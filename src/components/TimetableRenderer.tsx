'use client';

import React, { useMemo } from 'react';
import { Clock, MapPin, AlertTriangle } from 'lucide-react';
import { GridWiseLogoMark } from '@/components/GridWiseLogo';
import type {
  AnalyzedSchedule,
  DayOfWeek,
  MergedSlotCard,
  PresetTemplate,
  ScheduledBlock,
  TimetableMeta,
} from '@/types/timetable';
import { formatHourLabel, formatTimeDisplay } from '@/lib/schedule-engine';
import { getTemplateFontCss, getTemplateMonoCss } from '@/lib/themes';

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
        .split('')
        .map((c) => c + c)
        .join('')
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [148, 163, 184];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHexRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Ensures subject indicator colors always have crisp contrast in both dark and light themes
 * (e.g. light-gray #E4E4E7 becomes #475569 in light mode).
 */
function getAccessibleTone(hex: string, mode: 'dark' | 'light'): string {
  const [r, g, b] = parseHexRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (mode === 'light' && luminance > 0.72) {
    return '#475569';
  }
  if (mode === 'dark' && luminance < 0.25) {
    return '#CBD5E1';
  }
  return hex;
}

interface TimetableRendererProps {
  meta: TimetableMeta;
  schedule: AnalyzedSchedule;
  template: PresetTemplate;
  interactive?: boolean;
  compactPreview?: boolean;
  selectedDay?: DayOfWeek;
  onSelectDay?: (day: DayOfWeek) => void;
  onClickBlock?: (block: ScheduledBlock) => void;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}

export function TimetableRenderer({
  meta,
  schedule,
  template,
  interactive = false,
  compactPreview = false,
  selectedDay,
  onSelectDay,
  onClickBlock,
  canvasRef,
}: TimetableRendererProps) {
  const fontDisplay = getTemplateFontCss(template.displayFont);
  const fontBody = getTemplateFontCss(template.bodyFont);
  const fontMono = getTemplateMonoCss(template.monoFamily);
  const tokens = template.tokens;

  const activeDailyDay: DayOfWeek =
    selectedDay && schedule.days.includes(selectedDay)
      ? selectedDay
      : (schedule.days[0] ?? 'Mon');

  const fullDayName: Record<DayOfWeek, string> = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  };

  // Generous vertical scale so 45–50m blocks comfortably fit Code + Time + 2-line Title
  const hourHeight = compactPreview ? 72 : 112;
  const totalHoursSpan = Math.max(2, schedule.maxHour - schedule.minHour);
  const timelineHeight = totalHoursSpan * hourHeight;
  const hoursList = useMemo(
    () =>
      Array.from({ length: totalHoursSpan + 1 }, (_, idx) => schedule.minHour + idx),
    [schedule.minHour, totalHoursSpan]
  );

  const mergedOccurrenceSet = useMemo(
    () =>
      new Set(schedule.mergedGroups.flatMap((g) => g.blocks.map((b) => b.occurrenceId))),
    [schedule.mergedGroups]
  );

  const subjectTotals = useMemo(() => {
    const map = new Map<
      string,
      {
        subjectId: string;
        name: string;
        code: string;
        room: string;
        instructor: string;
        accentDot: string;
        minutes: number;
        count: number;
      }
    >();
    for (const blk of schedule.blocks) {
      const curr = map.get(blk.subjectId) ?? {
        subjectId: blk.subjectId,
        name: blk.name,
        code: blk.code,
        room: blk.room,
        instructor: blk.instructor,
        accentDot: blk.accentDot,
        minutes: 0,
        count: 0,
      };
      curr.minutes += blk.endMin - blk.startMin;
      curr.count += 1;
      map.set(blk.subjectId, curr);
    }
    return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes);
  }, [schedule.blocks]);

  const maxSubjectMinutes = Math.max(1, ...subjectTotals.map((s) => s.minutes));

  const bgPatternStyle = useMemo<React.CSSProperties>(() => {
    if (template.bgPattern === 'dots') {
      return {
        backgroundImage: `radial-gradient(${hexToRgba(tokens.textMuted, 0.16)} 1px, transparent 1px)`,
        backgroundSize: '18px 18px',
      };
    }
    if (template.bgPattern === 'grid') {
      return {
        backgroundImage: `linear-gradient(to right, ${hexToRgba(tokens.border, 0.4)} 1px, transparent 1px), linear-gradient(to bottom, ${hexToRgba(tokens.border, 0.4)} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      };
    }
    return {};
  }, [template.bgPattern, tokens.border, tokens.textMuted]);

  const getDayVisualItems = (day: DayOfWeek) => {
    const singles = schedule.blocks
      .filter((b) => b.day === day && !mergedOccurrenceSet.has(b.occurrenceId))
      .map((b) => ({ kind: 'single' as const, startMin: b.startMin, block: b }));
    const merged = schedule.mergedGroups
      .filter((g) => g.day === day)
      .map((g) => ({ kind: 'merged' as const, startMin: g.startMin, group: g }));
    return [...singles, ...merged].sort((a, b) => a.startMin - b.startMin);
  };

  const getCardStyle = (accentDot: string, hasConflict: boolean, tinted = false): React.CSSProperties => {
    const dotColor = getAccessibleTone(accentDot || tokens.accent, template.mode);
    const isLight = template.mode === 'light';
    const bg = tinted
      ? hexToRgba(dotColor, isLight ? 0.13 : 0.12)
      : hexToRgba(dotColor, isLight ? 0.08 : 0.06);
    const borderCol = hasConflict
      ? 'rgba(245, 158, 11, 0.65)'
      : hexToRgba(dotColor, isLight ? 0.34 : 0.28);

    return {
      backgroundColor: bg,
      borderTopWidth: '1px',
      borderRightWidth: '1px',
      borderBottomWidth: '1px',
      borderLeftWidth: '1px',
      borderStyle: 'solid',
      borderColor: borderCol,
      borderRadius: `${Math.max(0, template.radiusPx - 2)}px`,
    };
  };

  const renderGridCardInner = (blk: ScheduledBlock, leftStripe = true) => {
    const durationMin = blk.endMin - blk.startMin;
    const isCompactSlot = durationMin <= 65 || compactPreview;
    const dotColor = getAccessibleTone(blk.accentDot || tokens.accent, template.mode);
    const timeLabel = `${formatTimeDisplay(blk.startTime, meta.timeFormat)}–${formatTimeDisplay(
      blk.endTime,
      meta.timeFormat
    )}`;

    return (
      <div
        title={`${blk.code ? blk.code + ' · ' : ''}${blk.name} (${timeLabel})`}
        className="relative flex h-full flex-col justify-between overflow-hidden"
      >
        {leftStripe && (
          <div
            className="absolute inset-y-0.5 left-0 w-[2.5px] rounded-full"
            style={{ backgroundColor: dotColor }}
          />
        )}
        <div className={`min-w-0 ${leftStripe ? 'pl-2' : ''}`}>
          {/* Top metadata row: Dot + Code + Inline Time for compact slots */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              {!leftStripe && (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
              )}
              {blk.code && (
                <span
                  className="truncate text-[10px] font-semibold tracking-wide"
                  style={{ color: tokens.textMuted, fontFamily: fontMono }}
                >
                  {blk.code}
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {isCompactSlot && (
                <span
                  className="text-[9.5px] font-medium"
                  style={{ color: tokens.textMuted, fontFamily: fontMono }}
                >
                  {timeLabel}
                </span>
              )}
              {blk.hasConflict && (
                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />
              )}
            </div>
          </div>

          <div
            className={`mt-1 line-clamp-2 font-medium leading-[1.25] ${compactPreview ? 'text-[11px]' : 'text-[12px]'
              }`}
            style={{ color: tokens.text }}
          >
            {blk.name}
          </div>
        </div>

        {/* Bottom row for longer blocks or rooms */}
        {(!isCompactSlot || blk.room) && (
          <div
            className={`mt-1 flex flex-col gap-0.5 ${leftStripe ? 'pl-2' : ''}`}
            style={{ color: tokens.textMuted }}
          >
            {!isCompactSlot && (
              <span className="truncate text-[10px]" style={{ fontFamily: fontMono }}>
                {timeLabel}
              </span>
            )}
            {blk.room && (
              <span className="flex items-center gap-1 truncate text-[10px]">
                <MapPin className="h-2.5 w-2.5 shrink-0 opacity-70" />
                <span className="truncate">{blk.room}</span>
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Clean split card for intentional overlaps (no "MERGED" label)
  const renderMergedCardInner = (group: MergedSlotCard) => {
    const durationMin = group.endMin - group.startMin;
    const isTall = durationMin >= 100 && !compactPreview;

    return (
      <div className="flex h-full flex-col justify-center gap-2 overflow-hidden">
        {group.blocks.map((blk, idx) => {
          const dotColor = getAccessibleTone(blk.accentDot || tokens.accent, template.mode);
          return (
            <div
              key={blk.occurrenceId}
              title={`${blk.code ? blk.code + ' · ' : ''}${blk.name} (${blk.startTime}–${blk.endTime})`}
              onClick={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                onClickBlock?.(blk);
              }}
              style={{
                borderTopWidth: idx > 0 ? '1px' : '0px',
                borderTopStyle: 'solid',
                borderTopColor: tokens.border,
              }}
              className={`relative min-w-0 ${idx > 0 ? 'pt-2' : ''} ${interactive ? 'cursor-pointer rounded px-0.5 hover:bg-white/[0.05]' : ''
                }`}
            >
              <div className="flex items-start gap-1.5">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-medium leading-snug ${isTall ? 'line-clamp-2 text-[11.5px]' : 'truncate text-[11px]'
                      }`}
                    style={{ color: tokens.text }}
                  >
                    {blk.code ? (
                      <span
                        className="mr-1.5 text-[10px] font-semibold"
                        style={{ color: tokens.textMuted, fontFamily: fontMono }}
                      >
                        {blk.code}
                      </span>
                    ) : null}
                    {blk.name}
                  </div>
                  <div
                    className="mt-0.5 truncate text-[9.5px]"
                    style={{ color: tokens.textMuted, fontFamily: fontMono }}
                  >
                    {formatTimeDisplay(blk.startTime, meta.timeFormat)} –{' '}
                    {formatTimeDisplay(blk.endTime, meta.timeFormat)}
                    {blk.room ? ` · ${blk.room}` : ''}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderProportionalGrid = (isBento: boolean, tinted: boolean) => (
    <div className="overflow-x-auto">
      <div
        className="min-w-[680px]"
        style={{
          backgroundColor: isBento ? 'transparent' : tokens.surfaceBg,
          borderWidth: isBento ? '0px' : '1px',
          borderStyle: 'solid',
          borderColor: tokens.border,
          borderRadius: `${template.radiusPx}px`,
          overflow: 'hidden',
        }}
      >
        {/* Day Headers */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `74px repeat(${schedule.days.length}, minmax(0, 1fr))`,
            backgroundColor: isBento ? 'transparent' : tokens.cardBg,
            borderBottomWidth: isBento ? '0px' : '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: tokens.border,
            gap: isBento ? '8px' : '0px',
            marginBottom: isBento ? '8px' : '0px',
          }}
        >
          <div
            className="px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              color: tokens.textMuted,
              fontFamily: fontMono,
              borderRightWidth: isBento ? '0px' : '1px',
              borderRightStyle: 'solid',
              borderRightColor: tokens.border,
            }}
          >
            Time
          </div>
          {schedule.days.map((day, idx) => (
            <div
              key={day}
              className="flex items-center justify-between px-3 py-2.5"
              style={{
                backgroundColor: isBento ? tokens.cardBg : 'transparent',
                borderTopWidth: isBento ? '1px' : '0px',
                borderBottomWidth: isBento ? '1px' : '0px',
                borderLeftWidth: isBento ? '1px' : '0px',
                borderRightWidth:
                  isBento || idx < schedule.days.length - 1 ? '1px' : '0px',
                borderStyle: 'solid',
                borderColor: tokens.border,
                borderRadius: isBento ? `${template.radiusPx}px` : '0px',
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: tokens.text, fontFamily: fontDisplay }}
              >
                {day}
              </span>
              <span
                className="text-[10px]"
                style={{ color: tokens.textMuted, fontFamily: fontMono }}
              >
                {schedule.blocks.filter((b) => b.day === day).length}
              </span>
            </div>
          ))}
        </div>

        {/* Time Body */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `74px repeat(${schedule.days.length}, minmax(0, 1fr))`,
            gap: isBento ? '8px' : '0px',
          }}
        >
          {/* Hour Rail */}
          <div
            className="relative"
            style={{
              height: `${timelineHeight}px`,
              backgroundColor: isBento ? tokens.surfaceBg : 'transparent',
              borderTopWidth: isBento ? '1px' : '0px',
              borderBottomWidth: isBento ? '1px' : '0px',
              borderLeftWidth: isBento ? '1px' : '0px',
              borderRightWidth: '1px',
              borderStyle: 'solid',
              borderColor: tokens.border,
              borderRadius: isBento ? `${template.radiusPx}px` : '0px',
            }}
          >
            {hoursList.slice(0, -1).map((hr, idx) => (
              <div
                key={hr}
                style={{
                  top: `${idx * hourHeight}px`,
                  height: `${hourHeight}px`,
                  borderBottomWidth: idx < hoursList.length - 2 ? '1px' : '0px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: tokens.border,
                  color: tokens.textMuted,
                  fontFamily: fontMono,
                }}
                className="absolute inset-x-0 px-2.5 pt-2 text-[10px]"
              >
                {formatHourLabel(hr, meta.timeFormat)}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {schedule.days.map((day, dayIdx) => {
            const singleBlocks = schedule.blocks.filter(
              (b) => b.day === day && !mergedOccurrenceSet.has(b.occurrenceId)
            );
            const mergedCards = schedule.mergedGroups.filter((g) => g.day === day);

            return (
              <div
                key={day}
                className="relative"
                style={{
                  height: `${timelineHeight}px`,
                  backgroundColor: isBento ? tokens.surfaceBg : 'transparent',
                  borderTopWidth: isBento ? '1px' : '0px',
                  borderBottomWidth: isBento ? '1px' : '0px',
                  borderLeftWidth: isBento ? '1px' : '0px',
                  borderRightWidth:
                    isBento || dayIdx < schedule.days.length - 1 ? '1px' : '0px',
                  borderStyle: 'solid',
                  borderColor: tokens.border,
                  borderRadius: isBento ? `${template.radiusPx}px` : '0px',
                }}
              >
                {hoursList.slice(0, -1).map((hr, idx) => (
                  <div
                    key={hr}
                    style={{
                      top: `${idx * hourHeight}px`,
                      height: `${hourHeight}px`,
                      borderBottomWidth: idx < hoursList.length - 2 ? '1px' : '0px',
                      borderBottomStyle: 'dashed',
                      borderBottomColor: tokens.border,
                    }}
                    className="pointer-events-none absolute inset-x-0 opacity-60"
                  />
                ))}

                {mergedCards.map((group) => {
                  const topPx =
                    ((group.startMin - schedule.minHour * 60) / 60) * hourHeight + 3;
                  const heightPx = Math.max(
                    84,
                    ((group.endMin - group.startMin) / 60) * hourHeight - 6
                  );
                  return (
                    <div
                      key={group.id}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        left: '4px',
                        width: 'calc(100% - 8px)',
                        backgroundColor: tokens.cardElevatedBg,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: tokens.borderStrong,
                        borderRadius: `${Math.max(0, template.radiusPx - 2)}px`,
                      }}
                      className="absolute z-10 overflow-hidden px-2.5 py-2"
                    >
                      {renderMergedCardInner(group)}
                    </div>
                  );
                })}

                {singleBlocks.map((blk) => {
                  const topPx =
                    ((blk.startMin - schedule.minHour * 60) / 60) * hourHeight + 3;
                  const heightPx = Math.max(
                    56,
                    ((blk.endMin - blk.startMin) / 60) * hourHeight - 6
                  );
                  const widthPct = 100 / blk.laneCount;
                  const leftPct = blk.lane * widthPct;

                  return (
                    <div
                      key={blk.occurrenceId}
                      onClick={() => interactive && onClickBlock?.(blk)}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        left: `calc(${leftPct}% + 4px)`,
                        width: `calc(${widthPct}% - 8px)`,
                        ...getCardStyle(blk.accentDot, blk.hasConflict, tinted),
                      }}
                      className={`absolute overflow-hidden px-2.5 py-1.5 transition ${interactive ? 'cursor-pointer hover:brightness-110' : ''
                        }`}
                    >
                      {renderGridCardInner(blk, !tinted)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const isDailyLayout =
    template.layout === 'daily-poster' ||
    template.layout === 'daily-deck' ||
    template.layout === 'exhibition-daily';

  return (
    <div
      ref={canvasRef}
      style={{
        minWidth: isDailyLayout ? '680px' : '1060px',
        backgroundColor: tokens.canvasBg,
        color: tokens.text,
        fontFamily: fontBody,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: tokens.border,
        borderRadius: `${template.radiusPx === 0 ? 0 : template.radiusPx + 4}px`,
        boxShadow:
          template.mode === 'dark'
            ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 24px 48px -24px rgba(0,0,0,0.75)'
            : '0 20px 40px -24px rgba(15,23,42,0.12)',
        ...bgPatternStyle,
      }}
      className="print-only-canvas relative overflow-hidden"
    >
      {/* Header Banner (hidden on pure poster layouts like Acid Daily & Exhibition Blue) */}
      {template.layout !== 'daily-poster' && template.layout !== 'exhibition-daily' && (
        <div
          style={{
            background: tokens.headerBannerBg ?? tokens.surfaceBg,
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: tokens.border,
          }}
          className={compactPreview ? 'px-5 py-4' : 'px-6 py-5'}
        >
        <div className="flex items-end justify-between gap-4">
          <div>
            <div
              className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider"
              style={{ color: tokens.textMuted, fontFamily: fontMono }}
            >
              <span>{template.name}</span>
              <span>·</span>
              <span>{template.layoutLabel}</span>
            </div>
            <h2
              className={`font-semibold tracking-tight ${compactPreview ? 'text-xl' : 'text-[26px]'
                } ${template.layout === 'horizontal-timeline' ? 'uppercase tracking-tighter' : ''}`}
              style={{ color: tokens.text, fontFamily: fontDisplay }}
            >
              {meta.title || 'Weekly Timetable'}
            </h2>
            {meta.subtitle && (
              <p
                className={`mt-0.5 ${compactPreview ? 'text-[11px]' : 'text-xs'}`}
                style={{ color: tokens.textMuted }}
              >
                {meta.subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MetricChip
              label="Hours"
              value={`${schedule.stats.totalHours}h`}
              tokens={tokens}
              mono={fontMono}
              radius={template.radiusPx}
            />
            <MetricChip
              label="Classes"
              value={String(schedule.stats.totalSessions)}
              tokens={tokens}
              mono={fontMono}
              radius={template.radiusPx}
            />
            {schedule.stats.conflictCount > 0 && (
              <MetricChip
                label="Overlaps"
                value={String(schedule.stats.conflictCount)}
                tokens={tokens}
                mono={fontMono}
                radius={template.radiusPx}
                warn
              />
            )}
          </div>
        </div>
        </div>
      )}

      {/* BODY RENDERED BY DISTINCT ARCHITECTURAL LAYOUT */}
      <div key={template.layout} className={compactPreview ? 'p-4' : 'p-6'}>
        {schedule.blocks.length === 0 ? (
          <div
            className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed text-center"
            style={{ borderColor: tokens.border, color: tokens.textMuted }}
          >
            <Clock className="mb-2 h-5 w-5 opacity-50" />
            <p className="text-xs font-medium">No classes entered yet</p>
            <p className="mt-0.5 text-[11px] opacity-75">
              Add subjects and their weekly times to preview this template.
            </p>
          </div>
        ) : template.layout === 'cron-sidebar-grid' ? (
          /* 1. CRON STUDIO: PROPORTIONAL GRID + RIGHT BREAKDOWN RAIL */
          <div className="grid grid-cols-[1fr_220px] gap-4">
            {renderProportionalGrid(false, false)}

            {!compactPreview && (
              <aside
                style={{
                  backgroundColor: tokens.surfaceBg,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: tokens.border,
                  borderRadius: `${template.radiusPx}px`,
                }}
                className="flex flex-col justify-between p-4"
              >
                <div className="space-y-3">
                  <div
                    className="pb-2 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: tokens.textMuted,
                      fontFamily: fontMono,
                      borderBottomWidth: '1px',
                      borderBottomStyle: 'solid',
                      borderBottomColor: tokens.border,
                    }}
                  >
                    Weekly Breakdown
                  </div>

                  <div className="space-y-2.5">
                    {subjectTotals.map((subj) => {
                      const pct = Math.round((subj.minutes / maxSubjectMinutes) * 100);
                      const hrs = (subj.minutes / 60).toFixed(1);
                      const barColor = getAccessibleTone(
                        subj.accentDot || tokens.accent,
                        template.mode
                      );
                      return (
                        <div key={subj.subjectId} className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="truncate font-medium" style={{ color: tokens.text }}>
                              {subj.code || subj.name}
                            </span>
                            <span
                              className="shrink-0 text-[10px]"
                              style={{ color: tokens.textMuted, fontFamily: fontMono }}
                            >
                              {hrs}h
                            </span>
                          </div>
                          <div
                            className="h-1.5 w-full overflow-hidden rounded-full"
                            style={{ backgroundColor: tokens.cardElevatedBg }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="mt-4 pt-3 text-[10px]"
                  style={{
                    borderTopWidth: '1px',
                    borderTopStyle: 'solid',
                    borderTopColor: tokens.border,
                    color: tokens.textMuted,
                    fontFamily: fontMono,
                  }}
                >
                  Peak Day: {schedule.stats.busiestDay ?? '—'}
                </div>
              </aside>
            )}
          </div>
        ) : template.layout === 'horizontal-timeline' ? (
          /* 2. SWISS HORIZONTAL TIMELINE (X-axis = Hours, Y-axis = Days) */
          <div className="overflow-x-auto">
            <div
              style={{
                minWidth: `${Math.max(920, totalHoursSpan * (compactPreview ? 108 : 136))}px`,
                backgroundColor: tokens.surfaceBg,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: tokens.border,
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: '84px 1fr',
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: tokens.borderStrong,
                  backgroundColor: tokens.cardBg,
                }}
              >
                <div
                  className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    color: tokens.accent,
                    fontFamily: fontMono,
                    borderRightWidth: '1px',
                    borderRightStyle: 'solid',
                    borderRightColor: tokens.border,
                  }}
                >
                  DAY / HR
                </div>
                <div className="relative h-9">
                  {hoursList.slice(0, -1).map((hr, idx) => {
                    const leftPct = (idx / totalHoursSpan) * 100;
                    const widthPct = (1 / totalHoursSpan) * 100;
                    return (
                      <div
                        key={hr}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          borderRightWidth: idx < hoursList.length - 2 ? '1px' : '0px',
                          borderRightStyle: 'solid',
                          borderRightColor: tokens.border,
                          color: tokens.textMuted,
                          fontFamily: fontMono,
                        }}
                        className="absolute inset-y-0 flex items-center px-2 text-[10px]"
                      >
                        {formatHourLabel(hr, meta.timeFormat)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {schedule.days.map((day, dIdx) => {
                const singleBlocks = schedule.blocks.filter(
                  (b) => b.day === day && !mergedOccurrenceSet.has(b.occurrenceId)
                );
                const mergedCards = schedule.mergedGroups.filter((g) => g.day === day);
                const maxMergedLen = mergedCards.reduce(
                  (max, g) => Math.max(max, g.blocks.length),
                  0
                );
                const rowHeight =
                  maxMergedLen > 1
                    ? Math.max(compactPreview ? 116 : 152, maxMergedLen * (compactPreview ? 54 : 70))
                    : compactPreview
                      ? 84
                      : 108;

                return (
                  <div
                    key={day}
                    className="grid"
                    style={{
                      gridTemplateColumns: '84px 1fr',
                      borderBottomWidth: dIdx < schedule.days.length - 1 ? '1px' : '0px',
                      borderBottomStyle: 'solid',
                      borderBottomColor: tokens.border,
                    }}
                  >
                    <div
                      style={{
                        height: `${rowHeight}px`,
                        borderRightWidth: '1px',
                        borderRightStyle: 'solid',
                        borderRightColor: tokens.border,
                        fontFamily: fontDisplay,
                      }}
                      className="flex flex-col justify-center px-3"
                    >
                      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: tokens.text }}>
                        {day}
                      </span>
                      <span className="text-[10px]" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
                        {schedule.blocks.filter((b) => b.day === day).length} blk
                      </span>
                    </div>

                    <div className="relative" style={{ height: `${rowHeight}px` }}>
                      {hoursList.slice(0, -1).map((hr, idx) => (
                        <div
                          key={hr}
                          style={{
                            left: `${(idx / totalHoursSpan) * 100}%`,
                            width: `${(1 / totalHoursSpan) * 100}%`,
                            borderRightWidth: idx < hoursList.length - 2 ? '1px' : '0px',
                            borderRightStyle: 'dashed',
                            borderRightColor: tokens.border,
                          }}
                          className="pointer-events-none absolute inset-y-0 opacity-50"
                        />
                      ))}

                      {mergedCards.map((group) => {
                        const leftPct =
                          ((group.startMin - schedule.minHour * 60) / (totalHoursSpan * 60)) * 100;
                        const widthPct =
                          ((group.endMin - group.startMin) / (totalHoursSpan * 60)) * 100;

                        return (
                          <div
                            key={group.id}
                            style={{
                              left: `calc(${leftPct}% + 2px)`,
                              width: `calc(${widthPct}% - 4px)`,
                              top: '6px',
                              bottom: '6px',
                              backgroundColor: tokens.cardElevatedBg,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: tokens.borderStrong,
                            }}
                            className="absolute z-10 overflow-hidden px-2 py-1.5"
                          >
                            {renderMergedCardInner(group)}
                          </div>
                        );
                      })}

                      {singleBlocks.map((blk) => {
                        const leftPct =
                          ((blk.startMin - schedule.minHour * 60) / (totalHoursSpan * 60)) * 100;
                        const widthPct =
                          ((blk.endMin - blk.startMin) / (totalHoursSpan * 60)) * 100;
                        const tone = getAccessibleTone(
                          blk.accentDot || tokens.accent,
                          template.mode
                        );

                        return (
                          <div
                            key={blk.occurrenceId}
                            title={`${blk.code ? blk.code + ' · ' : ''}${blk.name} (${blk.startTime}–${blk.endTime})`}
                            onClick={() => interactive && onClickBlock?.(blk)}
                            style={{
                              left: `calc(${leftPct}% + 2px)`,
                              width: `calc(${widthPct}% - 4px)`,
                              top: '6px',
                              bottom: '6px',
                              backgroundColor: tokens.cardBg,
                              borderTopWidth: '1px',
                              borderRightWidth: '1px',
                              borderBottomWidth: '1px',
                              borderLeftWidth: '3px',
                              borderStyle: 'solid',
                              borderTopColor: tokens.borderStrong,
                              borderRightColor: tokens.borderStrong,
                              borderBottomColor: tokens.borderStrong,
                              borderLeftColor: tone,
                            }}
                            className={`absolute overflow-hidden px-2 py-1.5 transition ${interactive ? 'cursor-pointer hover:brightness-125' : ''
                              }`}
                          >
                            <div className="flex h-full flex-col justify-between overflow-hidden">
                              <div>
                                {blk.code && (
                                  <div
                                    className="truncate text-[9px] font-semibold uppercase"
                                    style={{ color: tokens.textMuted, fontFamily: fontMono }}
                                  >
                                    {blk.code}
                                  </div>
                                )}
                                <div
                                  className="line-clamp-2 text-[11px] font-semibold leading-tight"
                                  style={{ color: tokens.text }}
                                >
                                  {blk.name}
                                </div>
                              </div>
                              <div
                                className="truncate text-[9px]"
                                style={{ color: tokens.textMuted, fontFamily: fontMono }}
                              >
                                {formatTimeDisplay(blk.startTime, meta.timeFormat)}–
                                {formatTimeDisplay(blk.endTime, meta.timeFormat)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : template.layout === 'bento-dashboard' ? (
          /* 3. SAPPHIRE BENTO */
          <div className="space-y-4">
            {!compactPreview && (
              <div className="grid grid-cols-4 gap-3">
                <div
                  style={{
                    backgroundColor: tokens.cardBg,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: tokens.border,
                    borderRadius: `${template.radiusPx}px`,
                  }}
                  className="p-3.5"
                >
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
                    Peak Day
                  </div>
                  <div className="mt-1 text-lg font-semibold" style={{ color: tokens.text, fontFamily: fontDisplay }}>
                    {schedule.stats.busiestDay ?? '—'}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: tokens.cardBg,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: tokens.border,
                    borderRadius: `${template.radiusPx}px`,
                  }}
                  className="p-3.5"
                >
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
                    Top Focus
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold" style={{ color: tokens.text, fontFamily: fontDisplay }}>
                    {subjectTotals[0]?.name ?? '—'}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: tokens.cardBg,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: tokens.border,
                    borderRadius: `${template.radiusPx}px`,
                  }}
                  className="col-span-2 p-3.5"
                >
                  <div className="mb-1.5 text-[10px] uppercase tracking-wider" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
                    Active Subjects
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subjectTotals.slice(0, 6).map((s) => {
                      const tone = getAccessibleTone(s.accentDot, template.mode);
                      return (
                        <span
                          key={s.subjectId}
                          style={{
                            backgroundColor: hexToRgba(tone, 0.14),
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: hexToRgba(tone, 0.32),
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px]"
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
                          {s.code || s.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Bento Day Cards Grid */}
            <div className="grid grid-cols-3 gap-3">
              {schedule.days.map((day) => {
                const items = getDayVisualItems(day);
                return (
                  <div
                    key={day}
                    style={{
                      backgroundColor: tokens.surfaceBg,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: tokens.border,
                      borderRadius: `${template.radiusPx}px`,
                    }}
                    className="flex flex-col p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className="text-sm font-semibold tracking-tight"
                        style={{ color: tokens.text, fontFamily: fontDisplay }}
                      >
                        {fullDayName[day]}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: tokens.accentSoft,
                          color: tokens.accent,
                          fontFamily: fontMono,
                        }}
                      >
                        {items.length} slots
                      </span>
                    </div>

                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <div className="py-4 text-center text-[11px]" style={{ color: tokens.textMuted }}>
                          No classes
                        </div>
                      ) : (
                        items.map((item) => {
                          if (item.kind === 'merged') {
                            return (
                              <div
                                key={item.group.id}
                                style={{
                                  backgroundColor: tokens.cardElevatedBg,
                                  borderWidth: '1px',
                                  borderStyle: 'solid',
                                  borderColor: tokens.borderStrong,
                                  borderRadius: `${Math.max(8, template.radiusPx - 4)}px`,
                                }}
                                className="space-y-1.5 p-2.5"
                              >
                                <div className="text-[10px] font-medium" style={{ color: tokens.accent, fontFamily: fontMono }}>
                                  {formatTimeDisplay(item.group.blocks[0]?.startTime ?? '', meta.timeFormat)} · Parallel
                                </div>
                                {item.group.blocks.map((b) => (
                                  <div
                                    key={b.occurrenceId}
                                    onClick={() => interactive && onClickBlock?.(b)}
                                    className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs ${
                                      interactive ? 'cursor-pointer hover:bg-white/5' : ''
                                    }`}
                                  >
                                    <span className="truncate font-medium" style={{ color: tokens.text }}>
                                      {b.name}
                                    </span>
                                    <span className="shrink-0 text-[10px]" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
                                      {b.code || b.room}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }

                          const blk = item.block;
                          const tone = getAccessibleTone(blk.accentDot || tokens.accent, template.mode);
                          return (
                            <div
                              key={blk.occurrenceId}
                              onClick={() => interactive && onClickBlock?.(blk)}
                              style={{
                                backgroundColor: tokens.cardBg,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: tokens.border,
                                borderRadius: `${Math.max(8, template.radiusPx - 4)}px`,
                              }}
                              className={`flex items-center justify-between gap-2.5 px-3 py-2 transition ${
                                interactive ? 'cursor-pointer hover:border-blue-400/50' : ''
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: tone }}
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-medium" style={{ color: tokens.text }}>
                                    {blk.name}
                                  </div>
                                  {blk.room && (
                                    <div className="truncate text-[10px]" style={{ color: tokens.textMuted }}>
                                      {blk.room}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span
                                className="shrink-0 text-[10px] font-medium"
                                style={{ color: tokens.accent, fontFamily: fontMono }}
                              >
                                {formatTimeDisplay(blk.startTime, meta.timeFormat)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : template.layout === 'magazine-spread' ? (
          /* 4. EDITORIAL JOURNAL */
          <div className="grid grid-cols-[240px_1fr] gap-6">
            {!compactPreview && (
              <aside
                style={{
                  borderRightWidth: '1px',
                  borderRightStyle: 'solid',
                  borderRightColor: tokens.border,
                }}
                className="pr-5"
              >
                <div
                  className="pb-2 text-[10px] font-semibold uppercase tracking-widest"
                  style={{
                    color: tokens.accent,
                    fontFamily: fontMono,
                    borderBottomWidth: '1px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: tokens.borderStrong,
                  }}
                >
                  Course Index
                </div>
                <div className="mt-3 space-y-3">
                  {subjectTotals.map((subj, idx) => (
                    <div
                      key={subj.subjectId}
                      style={{
                        borderBottomWidth: '1px',
                        borderBottomStyle: 'solid',
                        borderBottomColor: tokens.border,
                      }}
                      className="pb-2.5"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px]" style={{ color: tokens.accent, fontFamily: fontMono }}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[10px]" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
                          {(subj.minutes / 60).toFixed(1)}h · {subj.count}×
                        </span>
                      </div>
                      <div className="mt-0.5 text-sm font-medium" style={{ color: tokens.text, fontFamily: fontDisplay }}>
                        {subj.name}
                      </div>
                      {(subj.code || subj.room || subj.instructor) && (
                        <div className="mt-0.5 text-[11px]" style={{ color: tokens.textMuted }}>
                          {[subj.code, subj.room, subj.instructor].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </aside>
            )}

            <div className="space-y-4">
              {schedule.days.map((day) => {
                const items = getDayVisualItems(day);
                return (
                  <div
                    key={day}
                    style={{
                      borderBottomWidth: '1px',
                      borderBottomStyle: 'solid',
                      borderBottomColor: tokens.border,
                    }}
                    className="pb-4"
                  >
                    <div className="mb-2.5 flex items-baseline justify-between">
                      <h3
                        className="text-lg font-semibold italic"
                        style={{ color: tokens.accent, fontFamily: fontDisplay }}
                      >
                        {day}
                      </h3>
                      <span className="text-[10px]" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
                        {schedule.blocks.filter((b) => b.day === day).length} sessions
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <p className="text-xs italic" style={{ color: tokens.textMuted }}>
                        No scheduled classes.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {items.map((item) =>
                          item.kind === 'merged' ? (
                            <div
                              key={item.group.id}
                              style={{
                                backgroundColor: tokens.cardElevatedBg,
                                borderTopWidth: '2px',
                                borderTopStyle: 'solid',
                                borderTopColor: tokens.accent,
                                borderRadius: `${template.radiusPx}px`,
                              }}
                              className="p-3"
                            >
                              {renderMergedCardInner(item.group)}
                            </div>
                          ) : (
                            <div
                              key={item.block.occurrenceId}
                              onClick={() => interactive && onClickBlock?.(item.block)}
                              style={{
                                backgroundColor: tokens.cardBg,
                                borderTopWidth: '2px',
                                borderTopStyle: 'solid',
                                borderTopColor: getAccessibleTone(
                                  item.block.accentDot || tokens.accent,
                                  template.mode
                                ),
                                borderRadius: `${template.radiusPx}px`,
                              }}
                              className={`p-3 transition ${interactive ? 'cursor-pointer hover:brightness-110' : ''
                                }`}
                            >
                              <div className="flex items-center justify-between text-[10px]" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
                                <span>
                                  {formatTimeDisplay(item.block.startTime, meta.timeFormat)} –{' '}
                                  {formatTimeDisplay(item.block.endTime, meta.timeFormat)}
                                </span>
                                {item.block.code && <span>{item.block.code}</span>}
                              </div>
                              <div className="mt-1 text-sm font-medium" style={{ color: tokens.text }}>
                                {item.block.name}
                              </div>
                              {(item.block.room || item.block.instructor) && (
                                <div className="mt-1 text-[11px]" style={{ color: tokens.textMuted }}>
                                  {[item.block.room, item.block.instructor].filter(Boolean).join(' · ')}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : template.layout === 'terminal-table' ? (
          /* 5. TERMINAL INDEX */
          <div className="overflow-x-auto">
            <div
              className="min-w-[640px]"
              style={{
                backgroundColor: tokens.surfaceBg,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: tokens.border,
                borderRadius: `${template.radiusPx}px`,
                overflow: 'hidden',
                fontFamily: fontMono,
              }}
            >
              <div
                className="grid grid-cols-[70px_135px_95px_1fr_130px_120px] gap-2 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: tokens.cardBg,
                  color: tokens.accent,
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: tokens.borderStrong,
                }}
              >
                <span>Day</span>
                <span>Time</span>
                <span>Code</span>
                <span>Subject</span>
                <span>Room</span>
                <span>Instructor</span>
              </div>

              <div>
                {schedule.blocks
                  .slice()
                  .sort((a, b) => {
                    const dDiff = schedule.days.indexOf(a.day) - schedule.days.indexOf(b.day);
                    return dDiff !== 0 ? dDiff : a.startMin - b.startMin;
                  })
                  .map((blk, idx) => (
                    <div
                      key={blk.occurrenceId}
                      onClick={() => interactive && onClickBlock?.(blk)}
                      style={{
                        backgroundColor: idx % 2 === 1 ? tokens.cardBg : 'transparent',
                        borderBottomWidth: idx < schedule.blocks.length - 1 ? '1px' : '0px',
                        borderBottomStyle: 'solid',
                        borderBottomColor: tokens.border,
                      }}
                      className={`grid grid-cols-[70px_135px_95px_1fr_130px_120px] items-center gap-2 px-4 py-2.5 text-[11px] transition ${interactive ? 'cursor-pointer hover:bg-white/[0.04]' : ''
                        }`}
                    >
                      <span className="font-semibold" style={{ color: tokens.accent }}>
                        {blk.day}
                      </span>
                      <span style={{ color: tokens.textMuted }}>
                        {formatTimeDisplay(blk.startTime, meta.timeFormat)}–
                        {formatTimeDisplay(blk.endTime, meta.timeFormat)}
                      </span>
                      <span className="truncate" style={{ color: tokens.textMuted }}>
                        {blk.code || '—'}
                      </span>
                      <span className="flex min-w-0 items-center gap-2 font-medium" style={{ color: tokens.text }}>
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: getAccessibleTone(blk.accentDot, template.mode),
                          }}
                        />
                        <span className="truncate">{blk.name}</span>
                      </span>
                      <span className="truncate" style={{ color: tokens.textMuted }}>
                        {blk.room || '—'}
                      </span>
                      <span className="truncate" style={{ color: tokens.textMuted }}>
                        {blk.instructor || '—'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : template.layout === 'day-columns' ? (
          /* 6. LINEAR BOARDS */
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(${compactPreview ? '145px' : '195px'}, 1fr))`,
            }}
          >
            {schedule.days.map((day) => {
              const items = getDayVisualItems(day);

              return (
                <div
                  key={day}
                  style={{
                    backgroundColor: tokens.surfaceBg,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: tokens.border,
                    borderRadius: `${template.radiusPx}px`,
                  }}
                  className="flex flex-col p-3"
                >
                  <div
                    className="mb-2.5 flex items-center justify-between pb-2"
                    style={{
                      borderBottomWidth: '1px',
                      borderBottomStyle: 'solid',
                      borderBottomColor: tokens.border,
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: tokens.text, fontFamily: fontDisplay }}>
                      {day}
                    </span>
                    <span className="text-[10px]" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
                      {schedule.blocks.filter((b) => b.day === day).length}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    {items.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center py-6 text-[11px]" style={{ color: tokens.textMuted }}>
                        —
                      </div>
                    ) : (
                      items.map((item) =>
                        item.kind === 'merged' ? (
                          <div
                            key={item.group.id}
                            style={{
                              backgroundColor: tokens.cardElevatedBg,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: tokens.borderStrong,
                              borderRadius: `${Math.max(0, template.radiusPx - 2)}px`,
                            }}
                            className="p-2.5"
                          >
                            {renderMergedCardInner(item.group)}
                          </div>
                        ) : (
                          <div
                            key={item.block.occurrenceId}
                            onClick={() => interactive && onClickBlock?.(item.block)}
                            style={getCardStyle(item.block.accentDot, item.block.hasConflict, true)}
                            className={`p-2.5 transition ${interactive ? 'cursor-pointer hover:brightness-110' : ''
                              }`}
                          >
                            {renderGridCardInner(item.block, false)}
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : template.layout === 'poster-tiles' ? (
          /* 7. VIOLET POSTER */
          <div className="grid grid-cols-3 gap-4">
            {schedule.days.map((day) => {
              const items = getDayVisualItems(day);
              return (
                <div
                  key={day}
                  style={{
                    backgroundColor: tokens.surfaceBg,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: tokens.borderStrong,
                    borderRadius: `${template.radiusPx}px`,
                  }}
                  className="flex flex-col p-4"
                >
                  <div
                    className="mb-3 flex items-center justify-between pb-2.5"
                    style={{
                      borderBottomWidth: '1px',
                      borderBottomStyle: 'solid',
                      borderBottomColor: tokens.border,
                    }}
                  >
                    <span
                      className="text-base font-bold tracking-tight"
                      style={{ color: tokens.text, fontFamily: fontDisplay }}
                    >
                      {day}
                    </span>
                    <span
                      style={{
                        backgroundColor: tokens.accentSoft,
                        color: tokens.accent,
                        fontFamily: fontMono,
                      }}
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                    >
                      {schedule.blocks.filter((b) => b.day === day).length} classes
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {items.length === 0 ? (
                      <div className="py-8 text-center text-xs" style={{ color: tokens.textMuted }}>
                        Free Day
                      </div>
                    ) : (
                      items.map((item) =>
                        item.kind === 'merged' ? (
                          <div
                            key={item.group.id}
                            style={{
                              backgroundColor: tokens.cardElevatedBg,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: tokens.borderStrong,
                              borderRadius: `${Math.max(0, template.radiusPx - 4)}px`,
                            }}
                            className="p-3"
                          >
                            {renderMergedCardInner(item.group)}
                          </div>
                        ) : (
                          <div
                            key={item.block.occurrenceId}
                            onClick={() => interactive && onClickBlock?.(item.block)}
                            style={getCardStyle(item.block.accentDot, item.block.hasConflict, true)}
                            className={`p-3 transition ${interactive ? 'cursor-pointer hover:brightness-110' : ''
                              }`}
                          >
                            <div className="flex items-center justify-between text-[10px]" style={{ color: tokens.textMuted, fontFamily: fontMono }}>
                              <span>
                                {formatTimeDisplay(item.block.startTime, meta.timeFormat)} –{' '}
                                {formatTimeDisplay(item.block.endTime, meta.timeFormat)}
                              </span>
                              {item.block.code && <span>{item.block.code}</span>}
                            </div>
                            <div className="mt-1 text-sm font-semibold" style={{ color: tokens.text }}>
                              {item.block.name}
                            </div>
                            {(item.block.room || item.block.instructor) && (
                              <div className="mt-1 text-[11px]" style={{ color: tokens.textMuted }}>
                                {[item.block.room, item.block.instructor].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : template.layout === 'athletic-columns' ? (
          /* 8. PRECISION ATHLETIC COLUMNS (inspired by Precision Run editorial schedule) */
          <div
            className="grid gap-0 overflow-x-auto"
            style={{
              gridTemplateColumns: `repeat(${schedule.days.length}, minmax(140px, 1fr))`,
              borderTopWidth: '1px',
              borderTopStyle: 'solid',
              borderTopColor: tokens.border,
            }}
          >
            {schedule.days.map((day, dIdx) => {
              const items = getDayVisualItems(day);
              return (
                <div
                  key={day}
                  className="flex flex-col px-3.5 py-4"
                  style={{
                    borderRightWidth: dIdx < schedule.days.length - 1 ? '1px' : '0px',
                    borderRightStyle: 'solid',
                    borderRightColor: tokens.border,
                  }}
                >
                  <div className="mb-4">
                    <div
                      className="text-[10px] font-medium uppercase tracking-widest"
                      style={{ color: tokens.textMuted, fontFamily: fontMono }}
                    >
                      0{dIdx + 1} · {items.length} CLS
                    </div>
                    <div
                      className="mt-0.5 text-xl font-extrabold uppercase tracking-tight"
                      style={{ color: tokens.text, fontFamily: fontDisplay }}
                    >
                      {day}
                    </div>
                  </div>

                  <div className="flex flex-col divide-y" style={{ borderColor: tokens.border }}>
                    {items.length === 0 ? (
                      <div className="py-4 text-xs" style={{ color: tokens.textMuted }}>
                        Rest / Free
                      </div>
                    ) : (
                      items.map((item, idx) => {
                        if (item.kind === 'merged') {
                          return (
                            <div
                              key={item.group.id}
                              className="my-1.5 rounded-xs p-3"
                              style={{
                                backgroundColor: tokens.accent,
                                color: '#09090B',
                              }}
                            >
                              <div className="text-[9px] font-bold uppercase tracking-widest opacity-70">
                                {formatTimeDisplay(item.group.blocks[0]?.startTime ?? '', meta.timeFormat)}
                              </div>
                              <div className="mt-1 space-y-1.5">
                                {item.group.blocks.map((b) => (
                                  <div
                                    key={b.occurrenceId}
                                    onClick={() => interactive && onClickBlock?.(b)}
                                    className={interactive ? 'cursor-pointer hover:underline' : ''}
                                  >
                                    <div className="text-xs font-bold leading-snug">{b.name}</div>
                                    <div className="text-[10px] opacity-75">
                                      {b.code || b.room}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        const blk = item.block;
                        const isHighlight = dIdx === 0 && idx === 0;
                        return (
                          <div
                            key={blk.occurrenceId}
                            onClick={() => interactive && onClickBlock?.(blk)}
                            className={`py-3 transition ${interactive ? 'cursor-pointer hover:opacity-85' : ''} ${
                              isHighlight ? 'my-1 px-3' : ''
                            }`}
                            style={
                              isHighlight
                                ? { backgroundColor: tokens.accent, color: '#09090B' }
                                : { borderColor: tokens.border }
                            }
                          >
                            <div
                              className="text-[9px] font-bold uppercase tracking-widest"
                              style={{ color: isHighlight ? '#09090B' : tokens.textMuted }}
                            >
                              {blk.code || 'SESSION'}
                            </div>
                            <div
                              className="mt-1 text-xs font-medium leading-snug"
                              style={{ color: isHighlight ? '#09090B' : tokens.text }}
                            >
                              {blk.name}
                            </div>
                            <div
                              className="mt-1.5 text-lg font-semibold tracking-tight"
                              style={{
                                color: isHighlight ? '#09090B' : tokens.text,
                                fontFamily: fontBody,
                              }}
                            >
                              {formatTimeDisplay(blk.startTime, meta.timeFormat)}
                            </div>
                            {blk.room && (
                              <div
                                className="mt-0.5 text-[10px]"
                                style={{ color: isHighlight ? '#18181B' : tokens.textMuted }}
                              >
                                {blk.room}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : template.layout === 'daily-poster' ? (
          /* 9. ACID DAILY POSTER (inspired by HÖR single-day poster carousel) */
          <div className="mx-auto max-w-2xl py-2 sm:px-4">
            {/* Interactive Day Switcher (hidden in PNG export if desired, or keep clean) */}
            {interactive && onSelectDay && (
              <div className="no-print mb-5 flex flex-wrap items-center gap-1.5">
                {schedule.days.map((d) => {
                  const active = d === activeDailyDay;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onSelectDay(d)}
                      className="rounded-full px-3 py-1 text-xs font-semibold transition"
                      style={{
                        backgroundColor: active ? tokens.accent : 'rgba(0,0,0,0.18)',
                        color: active ? '#18181B' : tokens.text,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Giant Day Header + Italic Serif Subtitle */}
            <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6">
              <div>
                <div
                  className="text-4xl font-bold tracking-tight sm:text-6xl"
                  style={{ color: tokens.text, fontFamily: fontDisplay }}
                >
                  {fullDayName[activeDailyDay]}
                </div>
                <div
                  className="mt-1 text-2xl font-bold tracking-tight sm:text-4xl"
                  style={{ color: tokens.text, fontFamily: fontDisplay }}
                >
                  0{schedule.days.indexOf(activeDailyDay) + 1}
                </div>
              </div>
              <div
                className="text-lg italic sm:text-2xl"
                style={{ color: tokens.text, fontFamily: fontBody }}
              >
                {meta.title || meta.subtitle || 'Weekly Schedule'}
              </div>
            </div>

            {/* Clean Acid-Lime Horizontal Divider Rows */}
            <div
              className="divide-y"
              style={{
                borderTopWidth: '1px',
                borderBottomWidth: '1px',
                borderStyle: 'solid',
                borderColor: tokens.border,
              }}
            >
              {getDayVisualItems(activeDailyDay).length === 0 ? (
                <div className="py-8 text-center text-sm font-medium" style={{ color: tokens.text }}>
                  No sessions scheduled for {fullDayName[activeDailyDay]}.
                </div>
              ) : (
                getDayVisualItems(activeDailyDay).map((item) => {
                  if (item.kind === 'merged') {
                    return (
                      <div
                        key={item.group.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                        style={{ borderColor: tokens.border }}
                      >
                        <div className="flex items-baseline gap-4">
                          <span
                            className="w-16 shrink-0 text-sm font-semibold sm:w-20 sm:text-base"
                            style={{ color: tokens.text, fontFamily: fontDisplay }}
                          >
                            {formatTimeDisplay(item.group.blocks[0]?.startTime ?? '', meta.timeFormat)}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            {item.group.blocks.map((b) => (
                              <span
                                key={b.occurrenceId}
                                onClick={() => interactive && onClickBlock?.(b)}
                                className={`text-sm font-semibold sm:text-base ${
                                  interactive ? 'cursor-pointer hover:underline' : ''
                                }`}
                                style={{ color: tokens.text, fontFamily: fontDisplay }}
                              >
                                {b.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span
                          className="rounded-full px-3 py-0.5 text-xs font-semibold italic"
                          style={{
                            backgroundColor: tokens.accent,
                            color: '#18181B',
                            fontFamily: fontBody,
                          }}
                        >
                          {item.group.blocks.map((b) => b.code || b.room || 'LAB').join(' / ')}
                        </span>
                      </div>
                    );
                  }

                  const blk = item.block;
                  return (
                    <div
                      key={blk.occurrenceId}
                      onClick={() => interactive && onClickBlock?.(blk)}
                      className={`flex flex-wrap items-center justify-between gap-2 py-2.5 transition ${
                        interactive ? 'cursor-pointer hover:opacity-85' : ''
                      }`}
                      style={{ borderColor: tokens.border }}
                    >
                      <div className="flex min-w-0 items-baseline gap-4">
                        <span
                          className="w-16 shrink-0 text-sm font-semibold sm:w-20 sm:text-base"
                          style={{ color: tokens.text, fontFamily: fontDisplay }}
                        >
                          {formatTimeDisplay(blk.startTime, meta.timeFormat)}
                        </span>
                        <span
                          className="truncate text-sm font-semibold sm:text-base"
                          style={{ color: tokens.text, fontFamily: fontDisplay }}
                        >
                          {blk.name}
                        </span>
                      </div>
                      {(blk.code || blk.room) && (
                        <span
                          className="shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold italic"
                          style={{
                            backgroundColor: tokens.accent,
                            color: '#18181B',
                            fontFamily: fontBody,
                          }}
                        >
                          {blk.room || blk.code}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Poster Meta + Carousel Dots */}
            <div className="mt-8 flex items-center justify-between">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full border text-[11px] font-bold uppercase"
                style={{ borderColor: tokens.border, color: tokens.text }}
              >
                {meta.timeFormat}
              </span>
              <div className="flex items-center gap-1.5">
                {schedule.days.map((d) => (
                  <span
                    key={d}
                    className="h-2 w-2 rounded-full transition-opacity"
                    style={{
                      backgroundColor: tokens.accent,
                      opacity: d === activeDailyDay ? 1 : 0.35,
                    }}
                  />
                ))}
              </div>
              <span
                className="text-lg font-extrabold tracking-tighter"
                style={{ color: tokens.text, fontFamily: fontDisplay }}
              >
                GRIDWISER
              </span>
            </div>
          </div>
        ) : template.layout === 'daily-deck' ? (
          /* 10. IVORY DAILY DECK (archival paper per-day poster) */
          <div className="mx-auto max-w-2xl py-2 sm:px-4">
            {interactive && onSelectDay && (
              <div className="no-print mb-5 flex flex-wrap items-center gap-1.5">
                {schedule.days.map((d) => {
                  const active = d === activeDailyDay;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onSelectDay(d)}
                      className="rounded-lg border px-3 py-1 text-xs font-medium transition"
                      style={{
                        backgroundColor: active ? tokens.accent : tokens.surfaceBg,
                        borderColor: active ? tokens.accent : tokens.border,
                        color: active ? '#FFFFFF' : tokens.text,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            )}

            <div
              className="flex flex-wrap items-end justify-between gap-3 border-b pb-5"
              style={{ borderColor: tokens.borderStrong }}
            >
              <div>
                <div
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: tokens.accent, fontFamily: fontMono }}
                >
                  Day {schedule.days.indexOf(activeDailyDay) + 1} of {schedule.days.length}
                </div>
                <h3
                  className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl"
                  style={{ color: tokens.text, fontFamily: fontDisplay }}
                >
                  {fullDayName[activeDailyDay]}
                </h3>
              </div>
              <div className="text-right text-xs" style={{ color: tokens.textMuted }}>
                {getDayVisualItems(activeDailyDay).length} scheduled blocks
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {getDayVisualItems(activeDailyDay).length === 0 ? (
                <div
                  className="rounded-xl border border-dashed py-10 text-center text-xs"
                  style={{ borderColor: tokens.borderStrong, color: tokens.textMuted }}
                >
                  No classes scheduled on {fullDayName[activeDailyDay]}.
                </div>
              ) : (
                getDayVisualItems(activeDailyDay).map((item) => {
                  if (item.kind === 'merged') {
                    return (
                      <div
                        key={item.group.id}
                        className="rounded-xl border p-4"
                        style={{
                          backgroundColor: tokens.surfaceBg,
                          borderColor: tokens.borderStrong,
                        }}
                      >
                        <div className="mb-2 flex items-center justify-between text-[11px] font-medium" style={{ color: tokens.accent, fontFamily: fontMono }}>
                          <span>
                            {formatTimeDisplay(item.group.blocks[0]?.startTime ?? '', meta.timeFormat)} –{' '}
                            {formatTimeDisplay(
                              item.group.blocks[item.group.blocks.length - 1]?.endTime ?? '',
                              meta.timeFormat
                            )}
                          </span>
                          <span>Parallel / Lab</span>
                        </div>
                        <div className="space-y-2">
                          {item.group.blocks.map((b) => (
                            <div
                              key={b.occurrenceId}
                              onClick={() => interactive && onClickBlock?.(b)}
                              className={`flex items-center justify-between gap-2 rounded-lg p-2.5 ${
                                interactive ? 'cursor-pointer hover:opacity-85' : ''
                              }`}
                              style={{ backgroundColor: tokens.cardBg }}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: getAccessibleTone(b.accentDot, 'light') }}
                                />
                                <span className="text-sm font-medium" style={{ color: tokens.text }}>
                                  {b.name}
                                </span>
                              </div>
                              <span className="text-xs" style={{ color: tokens.textMuted }}>
                                {b.code || b.room}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  const blk = item.block;
                  return (
                    <div
                      key={blk.occurrenceId}
                      onClick={() => interactive && onClickBlock?.(blk)}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition ${
                        interactive ? 'cursor-pointer hover:shadow-sm' : ''
                      }`}
                      style={{
                        backgroundColor: tokens.surfaceBg,
                        borderColor: tokens.border,
                      }}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                          style={{
                            backgroundColor: tokens.accentSoft,
                            color: tokens.accent,
                            fontFamily: fontMono,
                          }}
                        >
                          {formatTimeDisplay(blk.startTime, meta.timeFormat)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: tokens.text }}>
                            {blk.name}
                          </div>
                          <div className="mt-0.5 text-xs" style={{ color: tokens.textMuted }}>
                            {[blk.code, blk.instructor].filter(Boolean).join(' · ') || 'Scheduled Session'}
                          </div>
                        </div>
                      </div>
                      {blk.room && (
                        <span
                          className="rounded-md px-2.5 py-1 text-xs font-medium"
                          style={{ backgroundColor: tokens.cardBg, color: tokens.textMuted }}
                        >
                          {blk.room}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : template.layout === 'exhibition-daily' ? (
          /* 11. EXHIBITION BLUE DAILY POSTER (inspired by MO exhibition poster) */
          <div className="mx-auto max-w-2xl py-2 sm:px-5">
            {interactive && onSelectDay && (
              <div className="no-print mb-5 flex flex-wrap items-center gap-1.5">
                {schedule.days.map((d) => {
                  const active = d === activeDailyDay;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onSelectDay(d)}
                      className="rounded-full px-3 py-1 text-xs font-semibold transition"
                      style={{
                        backgroundColor: active ? tokens.text : 'rgba(13, 14, 18, 0.12)',
                        color: active ? tokens.canvasBg : tokens.text,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Top Exhibition Header */}
            <div className="flex items-start justify-between gap-4 pb-8">
              <div
                className="text-2xl font-black tracking-tighter"
                style={{ color: tokens.text, fontFamily: fontDisplay }}
              >
                GRIDWISER
              </div>
              <div className="text-right leading-tight" style={{ color: tokens.text }}>
                <div className="text-[11px] font-bold uppercase tracking-wide">
                  {meta.title || 'WEEKLY SCHEDULE'}
                </div>
                <div className="text-[11px] font-normal opacity-85">
                  {meta.subtitle || `DAY 0${schedule.days.indexOf(activeDailyDay) + 1}`}
                </div>
              </div>
            </div>

            {/* Giant Stacked Display Day Title */}
            <h3
              className="pb-5 text-4xl font-semibold tracking-tight sm:pb-6 sm:text-7xl sm:leading-[0.95]"
              style={{ color: tokens.text, fontFamily: fontDisplay, letterSpacing: '-0.04em' }}
            >
              {fullDayName[activeDailyDay]}
            </h3>

            {/* Clean Hairline Rows */}
            <div
              className="divide-y"
              style={{
                borderTopWidth: '1px',
                borderBottomWidth: '1px',
                borderStyle: 'solid',
                borderColor: tokens.border,
              }}
            >
              {getDayVisualItems(activeDailyDay).length === 0 ? (
                <div className="py-8 text-sm font-medium" style={{ color: tokens.text }}>
                  No sessions scheduled for {fullDayName[activeDailyDay]}.
                </div>
              ) : (
                getDayVisualItems(activeDailyDay).map((item) => {
                  if (item.kind === 'merged') {
                    return (
                      <div
                        key={item.group.id}
                        className="py-3"
                        style={{ borderColor: tokens.border }}
                      >
                        <div className="text-[11px] font-medium" style={{ color: tokens.textMuted }}>
                          {formatTimeDisplay(item.group.blocks[0]?.startTime ?? '', meta.timeFormat)}–
                          {formatTimeDisplay(
                            item.group.blocks[item.group.blocks.length - 1]?.endTime ?? '',
                            meta.timeFormat
                          )}
                        </div>
                        <div className="mt-1 space-y-1">
                          {item.group.blocks.map((b) => (
                            <div
                              key={b.occurrenceId}
                              onClick={() => interactive && onClickBlock?.(b)}
                              className={`flex items-baseline justify-between gap-4 ${
                                interactive ? 'cursor-pointer hover:opacity-75' : ''
                              }`}
                            >
                              <span className="text-sm font-medium sm:text-[15px]" style={{ color: tokens.text }}>
                                {b.name}
                              </span>
                              <span className="shrink-0 text-xs sm:text-sm" style={{ color: tokens.textMuted }}>
                                {b.room || b.code}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  const blk = item.block;
                  return (
                    <div
                      key={blk.occurrenceId}
                      onClick={() => interactive && onClickBlock?.(blk)}
                      className={`py-3 transition ${
                        interactive ? 'cursor-pointer hover:opacity-75' : ''
                      }`}
                      style={{ borderColor: tokens.border }}
                    >
                      <div className="text-[11px] font-medium" style={{ color: tokens.textMuted }}>
                        {formatTimeDisplay(blk.startTime, meta.timeFormat)}–
                        {formatTimeDisplay(blk.endTime, meta.timeFormat)}
                      </div>
                      <div className="mt-0.5 flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium sm:text-[15px]" style={{ color: tokens.text }}>
                          {blk.name}
                        </span>
                        {(blk.room || blk.code) && (
                          <span className="shrink-0 text-xs sm:text-sm" style={{ color: tokens.textMuted }}>
                            {blk.room || blk.code}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* 12. GALLERY PAPER */
          renderProportionalGrid(false, true)
        )}

        <div
          className="mt-4 flex items-center justify-between text-[10px]"
          style={{ color: tokens.textMuted, fontFamily: fontMono }}
        >
          <span>
            {schedule.stats.totalSubjects} subjects · {schedule.stats.totalSessions} weekly sessions
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <GridWiseLogoMark
              size={15}
              tone={template.mode === 'light' ? 'light' : 'dark'}
              accentColor={tokens.accent}
            />
            GridWiser
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricChip({
  label,
  value,
  tokens,
  mono,
  radius,
  warn,
}: {
  label: string;
  value: string;
  tokens: PresetTemplate['tokens'];
  mono: string;
  radius: number;
  warn?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 text-[11px]"
      style={{
        backgroundColor: warn ? 'rgba(245, 158, 11, 0.14)' : tokens.cardBg,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: warn ? 'rgba(245, 158, 11, 0.45)' : tokens.border,
        borderRadius: `${radius === 0 ? 0 : Math.max(4, radius - 2)}px`,
        fontFamily: mono,
      }}
    >
      <span className="text-[10px] uppercase" style={{ color: tokens.textMuted }}>
        {label}
      </span>
      <span className="font-semibold" style={{ color: warn ? '#FBBF24' : tokens.text }}>
        {value}
      </span>
    </div>
  );
}
