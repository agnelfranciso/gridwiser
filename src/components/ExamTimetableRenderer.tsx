'use client';

import React, { useMemo } from 'react';
import { Calendar, Clock, MapPin, Hash, FileText } from 'lucide-react';
import { GridWiseLogoMark } from '@/components/GridWiseLogo';
import { formatTimeDisplay } from '@/lib/schedule-engine';
import { getTemplateFontCss, getTemplateMonoCss } from '@/lib/themes';
import type {
  ExamEntry,
  ExamTimetableMeta,
  PresetTemplate,
} from '@/types/timetable';

interface ExamTimetableRendererProps {
  meta: ExamTimetableMeta;
  exams: ExamEntry[];
  template: PresetTemplate;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  onClickExam?: (exam: ExamEntry) => void;
}

function formatExamDateParts(isoDate: string): {
  weekday: string;
  monthDay: string;
  year: string;
  epochMs: number;
} {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return { weekday: 'TBD', monthDay: isoDate || 'TBD', year: '', epochMs: 0 };
  }
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  const weekday = dt.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const monthDay = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  return {
    weekday,
    monthDay,
    year: String(parts[0]),
    epochMs: dt.getTime(),
  };
}

function durationLabel(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return '';
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return '';
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs}h` : `${hrs}h ${rem}m`;
}

export function ExamTimetableRenderer({
  meta,
  exams,
  template,
  canvasRef,
  onClickExam,
}: ExamTimetableRendererProps) {
  const fontDisplay = getTemplateFontCss(template.displayFont);
  const fontBody = getTemplateFontCss(template.bodyFont);
  const fontMono = getTemplateMonoCss(template.monoFamily);
  const tokens = template.tokens;

  const sortedExams = useMemo(
    () =>
      [...exams].sort((a, b) =>
        `${a.examDate}T${a.startTime}`.localeCompare(`${b.examDate}T${b.startTime}`)
      ),
    [exams]
  );

  const stats = useMemo(() => {
    let totalMins = 0;
    for (const ex of sortedExams) {
      const [sh, sm] = ex.startTime.split(':').map(Number);
      const [eh, em] = ex.endTime.split(':').map(Number);
      if (![sh, sm, eh, em].some(Number.isNaN)) {
        const diff = eh * 60 + em - (sh * 60 + sm);
        if (diff > 0) totalMins += diff;
      }
    }
    const first = sortedExams[0] ? formatExamDateParts(sortedExams[0].examDate).monthDay : '—';
    const last = sortedExams[sortedExams.length - 1]
      ? formatExamDateParts(sortedExams[sortedExams.length - 1].examDate).monthDay
      : '—';
    return {
      totalExams: sortedExams.length,
      totalHours: Math.round((totalMins / 60) * 10) / 10,
      span: sortedExams.length > 0 ? `${first} – ${last}` : 'No dates',
    };
  }, [sortedExams]);

  const patternStyle: React.CSSProperties =
    template.bgPattern === 'dots'
      ? {
          backgroundImage: `radial-gradient(${tokens.border} 1px, transparent 1px)`,
          backgroundSize: '18px 18px',
        }
      : template.bgPattern === 'grid'
        ? {
            backgroundImage: `linear-gradient(to right, ${tokens.border} 1px, transparent 1px), linear-gradient(to bottom, ${tokens.border} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }
        : {};

  return (
    <div
      ref={canvasRef}
      style={{
        backgroundColor: tokens.canvasBg,
        color: tokens.text,
        fontFamily: fontBody,
        borderRadius: `${template.radiusPx}px`,
        border: `1px solid ${tokens.border}`,
        ...patternStyle,
      }}
      className="w-full overflow-hidden shadow-2xl"
    >
      {/* Exam Header Banner */}
      <div
        style={{
          background: tokens.headerBannerBg || tokens.surfaceBg,
          borderBottom: `1px solid ${tokens.border}`,
        }}
        className="px-6 py-5 sm:px-8 sm:py-6"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <div
              style={{ fontFamily: fontMono, color: tokens.accent }}
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{template.name} · Examination Schedule</span>
            </div>
            <h1
              style={{ fontFamily: fontDisplay, color: tokens.text }}
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {meta.title || 'Examination Timetable'}
            </h1>
            {meta.subtitle && (
              <p style={{ color: tokens.textMuted }} className="text-xs sm:text-sm">
                {meta.subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              style={{
                backgroundColor: tokens.cardBg,
                borderColor: tokens.borderStrong,
                borderRadius: `${Math.max(8, template.radiusPx - 2)}px`,
                fontFamily: fontMono,
              }}
              className="border px-3 py-1.5 text-[11px]"
            >
              <span style={{ color: tokens.textMuted }}>EXAMS </span>
              <span style={{ color: tokens.text }} className="font-bold">
                {stats.totalExams}
              </span>
            </div>
            <div
              style={{
                backgroundColor: tokens.cardBg,
                borderColor: tokens.borderStrong,
                borderRadius: `${Math.max(8, template.radiusPx - 2)}px`,
                fontFamily: fontMono,
              }}
              className="border px-3 py-1.5 text-[11px]"
            >
              <span style={{ color: tokens.textMuted }}>DURATION </span>
              <span style={{ color: tokens.text }} className="font-bold">
                {stats.totalHours}h
              </span>
            </div>
            <div
              style={{
                backgroundColor: tokens.accentSoft,
                borderColor: tokens.accent,
                borderRadius: `${Math.max(8, template.radiusPx - 2)}px`,
                fontFamily: fontMono,
                color: tokens.accent,
              }}
              className="border px-3 py-1.5 text-[11px] font-semibold"
            >
              {stats.span}
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Date-Timeline Body (Distinct from Weekly Grid) */}
      <div className="space-y-3 p-5 sm:p-7">
        {sortedExams.length === 0 ? (
          <div
            style={{
              borderColor: tokens.borderStrong,
              backgroundColor: tokens.surfaceBg,
              color: tokens.textMuted,
              borderRadius: `${template.radiusPx}px`,
            }}
            className="border border-dashed px-6 py-12 text-center text-xs"
          >
            No exams added yet. Add exams manually or import via AI to render your chronological exam schedule.
          </div>
        ) : (
          sortedExams.map((exam, idx) => {
            const dateInfo = formatExamDateParts(exam.examDate);
            const prevInfo = idx > 0 ? formatExamDateParts(sortedExams[idx - 1].examDate) : null;
            const gapDays =
              prevInfo && dateInfo.epochMs && prevInfo.epochMs
                ? Math.round((dateInfo.epochMs - prevInfo.epochMs) / (1000 * 60 * 60 * 24))
                : null;
            const dur = durationLabel(exam.startTime, exam.endTime);

            return (
              <div
                key={exam.id}
                onClick={() => onClickExam?.(exam)}
                style={{
                  backgroundColor: tokens.cardBg,
                  borderColor: tokens.border,
                  borderRadius: `${template.radiusPx}px`,
                }}
                className={`group grid gap-4 border p-4 transition sm:grid-cols-[136px_minmax(0,1fr)_auto] sm:items-center ${
                  onClickExam ? 'cursor-pointer hover:brightness-110' : ''
                }`}
              >
                {/* Left Date Pillar */}
                <div
                  style={{
                    backgroundColor: tokens.cardElevatedBg,
                    borderColor: tokens.borderStrong,
                    borderRadius: `${Math.max(8, template.radiusPx - 4)}px`,
                  }}
                  className="flex items-center justify-between border px-3.5 py-2.5 sm:flex-col sm:items-start sm:justify-center"
                >
                  <div className="flex items-center gap-2 sm:w-full sm:justify-between">
                    <span
                      style={{ fontFamily: fontMono, color: tokens.accent }}
                      className="text-[10px] font-bold tracking-wider"
                    >
                      {dateInfo.weekday}
                    </span>
                    <span
                      style={{ fontFamily: fontMono, color: tokens.textMuted }}
                      className="text-[10px]"
                    >
                      #{idx + 1}
                    </span>
                  </div>
                  <div
                    style={{ fontFamily: fontDisplay, color: tokens.text }}
                    className="text-base font-bold tracking-tight sm:mt-0.5 sm:text-lg"
                  >
                    {dateInfo.monthDay}
                  </div>
                  {gapDays !== null && (
                    <span
                      style={{ fontFamily: fontMono, color: tokens.textMuted }}
                      className="hidden text-[10px] sm:mt-1 sm:inline-block"
                    >
                      {gapDays === 0 ? 'Same day' : `+${gapDays}d prep`}
                    </span>
                  )}
                </div>

                {/* Center Exam Details */}
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: exam.accentDot || tokens.accent }}
                    />
                    {exam.courseCode && (
                      <span
                        style={{
                          fontFamily: fontMono,
                          backgroundColor: tokens.surfaceBg,
                          borderColor: tokens.borderStrong,
                          color: tokens.textMuted,
                        }}
                        className="rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                      >
                        {exam.courseCode}
                      </span>
                    )}
                    {exam.examType && (
                      <span
                        style={{
                          fontFamily: fontMono,
                          backgroundColor: tokens.accentSoft,
                          color: tokens.accent,
                        }}
                        className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      >
                        {exam.examType}
                      </span>
                    )}
                  </div>

                  <h2
                    style={{ fontFamily: fontDisplay, color: tokens.text }}
                    className="truncate text-base font-bold sm:text-lg"
                  >
                    {exam.subjectName}
                  </h2>

                  <div
                    style={{ color: tokens.textMuted }}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
                  >
                    {exam.venue && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: tokens.accent }} />
                        <span>{exam.venue}</span>
                      </span>
                    )}
                    {exam.seatNumber && (
                      <span className="inline-flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 shrink-0" />
                        <span>{exam.seatNumber}</span>
                      </span>
                    )}
                    {exam.notes && (
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span>{exam.notes}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Time & Duration Box */}
                <div
                  style={{
                    backgroundColor: tokens.surfaceBg,
                    borderColor: tokens.border,
                    borderRadius: `${Math.max(8, template.radiusPx - 4)}px`,
                    fontFamily: fontMono,
                  }}
                  className="flex items-center justify-between gap-3 border px-3.5 py-2.5 sm:flex-col sm:items-end"
                >
                  <div
                    style={{ color: tokens.text }}
                    className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
                  >
                    <Clock className="h-3.5 w-3.5" style={{ color: tokens.accent }} />
                    <span>
                      {formatTimeDisplay(exam.startTime, meta.timeFormat)} –{' '}
                      {formatTimeDisplay(exam.endTime, meta.timeFormat)}
                    </span>
                  </div>
                  {dur && (
                    <span style={{ color: tokens.textMuted }} className="text-[10px]">
                      Duration: {dur}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${tokens.border}`,
          color: tokens.textMuted,
          fontFamily: fontMono,
        }}
        className="flex items-center justify-between px-6 py-3 text-[10px] sm:px-8"
      >
        <span>{stats.totalExams} exams · Chronological Exam Board</span>
        <span className="inline-flex items-center gap-1.5">
          <GridWiseLogoMark size={13} />
          GridWiser Exams
        </span>
      </div>
    </div>
  );
}
