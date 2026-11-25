'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import {
  Download,
  CalendarPlus,
  FileText,
  Copy,
  Check,
  ArrowUpRight,
  Smartphone,
  Monitor,
  ChevronDown,
} from 'lucide-react';
import { GridWiseBrand } from '@/components/GridWiseLogo';
import type { DayOfWeek, SavedTimetableRecord } from '@/types/timetable';
import { getPresetTemplate } from '@/lib/themes';
import { analyzeSchedule, generateICSFromSubjects } from '@/lib/schedule-engine';
import { exportTimetableWallpaper, type WallpaperFormat } from '@/lib/wallpaper-export';
import { TimetableRenderer } from '@/components/TimetableRenderer';
import { TRANSITION_VIEW } from '@/components/MotionPrimitives';

export function ShareViewClient({ timetable }: { timetable: SavedTimetableRecord }) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dailyExportRefs = useRef<Partial<Record<DayOfWeek, HTMLDivElement | null>>>({});
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [exportingWallpaper, setExportingWallpaper] = useState<WallpaperFormat | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [exportMenuOpen]);

  const template = useMemo(
    () => getPresetTemplate(timetable.templateId),
    [timetable.templateId]
  );
  const schedule = useMemo(
    () => analyzeSchedule(timetable.subjects, timetable.meta),
    [timetable.subjects, timetable.meta]
  );

  const isDailyTemplate =
    template.layout === 'daily-poster' ||
    template.layout === 'daily-deck' ||
    template.layout === 'exhibition-daily';

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    schedule.days[0] ?? 'Mon'
  );
  const activeDay = schedule.days.includes(selectedDay)
    ? selectedDay
    : (schedule.days[0] ?? 'Mon');

  const baseSlug =
    (timetable.meta.title || 'gridwiser-timetable')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'gridwiser-timetable';

  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await toPng(canvasRef.current, {
      pixelRatio: 3,
      backgroundColor: template.tokens.canvasBg,
    });
    const link = document.createElement('a');
    link.download = `${baseSlug}${isDailyTemplate ? `-${activeDay.toLowerCase()}` : ''}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleExportAllDaysZip = async () => {
    if (!isDailyTemplate || schedule.days.length === 0) return;
    setExportingZip(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      let count = 0;
      for (let i = 0; i < schedule.days.length; i += 1) {
        const day = schedule.days[i];
        const node = dailyExportRefs.current[day];
        if (!node) continue;
        const dataUrl = await toPng(node, {
          pixelRatio: 3,
          backgroundColor: template.tokens.canvasBg,
        });
        const base64 = dataUrl.split(',')[1];
        if (base64) {
          zip.file(`0${i + 1}-${day.toLowerCase()}.png`, base64, { base64: true });
          count += 1;
        }
      }
      if (count > 0) {
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${baseSlug}-daily-images.zip`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExportingZip(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const nodes: HTMLDivElement[] = isDailyTemplate
        ? schedule.days
            .map((d) => dailyExportRefs.current[d])
            .filter((el): el is HTMLDivElement => Boolean(el))
        : canvasRef.current
          ? [canvasRef.current]
          : [];

      if (nodes.length === 0) return;

      const bgHex = template.tokens.canvasBg;
      const pad = 24;
      let pdf: InstanceType<typeof jsPDF> | null = null;

      for (const node of nodes) {
        const dataUrl = await toPng(node, { pixelRatio: 3, backgroundColor: bgHex });
        const img = await loadImage(dataUrl);
        const w = Math.round(img.naturalWidth / 3);
        const h = Math.round(img.naturalHeight / 3);
        const pageW = w + pad * 2;
        const pageH = h + pad * 2;
        const orientation = pageW >= pageH ? 'landscape' : 'portrait';

        if (!pdf) {
          pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [pageW, pageH],
            hotfixes: ['px_scaling'],
          });
        } else {
          pdf.addPage([pageW, pageH], orientation);
        }
        pdf.setFillColor(bgHex);
        pdf.rect(0, 0, pageW, pageH, 'F');
        pdf.addImage(dataUrl, 'PNG', pad, pad, w, h, undefined, 'FAST');
      }

      pdf?.save(`${baseSlug}${isDailyTemplate ? '-daily' : ''}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportIcs = () => {
    const ics = generateICSFromSubjects(timetable.meta, timetable.subjects);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseSlug}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWallpaper = async (format: WallpaperFormat) => {
    if (!canvasRef.current) return;
    setExportingWallpaper(format);
    try {
      await exportTimetableWallpaper({
        node: canvasRef.current,
        template,
        title: timetable.meta.title,
        format,
        dayLabel: isDailyTemplate ? activeDay : undefined,
      });
    } finally {
      setExportingWallpaper(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const ta = document.createElement('textarea');
        ta.value = window.location.href;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0A0C] text-zinc-100">
      <header className="no-print sticky top-0 z-30 border-b border-[#1C1C22] bg-[#0A0A0C]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2.5">
              <GridWiseBrand size="sm" tone="dark" />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Shared
              </span>
            </Link>

            <Link
              href={`/?load=${encodeURIComponent(timetable.id)}`}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#09090B] hover:bg-zinc-200 sm:hidden"
            >
              Use Template
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2" ref={exportMenuRef}>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#25252D] bg-[#131317] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy URL'}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setExportMenuOpen((prev) => !prev)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#25252D] bg-[#131317] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
              >
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    exportMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-[#27272F] bg-[#0D0E12] p-1.5 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      void handleExportPng();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22]"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="h-3.5 w-3.5 text-zinc-400" />
                      {isDailyTemplate ? `${activeDay} Image` : '3× Ultra Retina'}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">PNG</span>
                  </button>
                  {isDailyTemplate && (
                    <button
                      type="button"
                      disabled={exportingZip}
                      onClick={() => {
                        setExportMenuOpen(false);
                        void handleExportAllDaysZip();
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22] disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <Download className="h-3.5 w-3.5 text-zinc-400" />
                        {exportingZip ? 'Zipping...' : 'All Days'}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">.ZIP</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={exportingPdf}
                    onClick={() => {
                      setExportMenuOpen(false);
                      void handleExportPdf();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22] disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-zinc-400" />
                      {exportingPdf ? 'Exporting...' : 'Print-Ready'}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">PDF</span>
                  </button>

                  <div className="my-1 border-t border-[#1E1F27]" />

                  <button
                    type="button"
                    disabled={exportingWallpaper !== null}
                    onClick={() => {
                      setExportMenuOpen(false);
                      void handleExportWallpaper('lockscreen');
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22] disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5 text-blue-400" />
                      {exportingWallpaper === 'lockscreen'
                        ? 'Rendering...'
                        : 'Phone Lockscreen'}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">9:16</span>
                  </button>
                  <button
                    type="button"
                    disabled={exportingWallpaper !== null}
                    onClick={() => {
                      setExportMenuOpen(false);
                      void handleExportWallpaper('desktop');
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22] disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <Monitor className="h-3.5 w-3.5 text-blue-400" />
                      {exportingWallpaper === 'desktop'
                        ? 'Rendering...'
                        : 'Desktop Wallpaper'}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">16:9</span>
                  </button>

                  <div className="my-1 border-t border-[#1E1F27]" />

                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportIcs();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22]"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarPlus className="h-3.5 w-3.5 text-zinc-400" />
                      Calendar Feed
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">.ICS</span>
                  </button>
                </div>
              )}
            </div>

            <Link
              href={`/?load=${encodeURIComponent(timetable.id)}`}
              className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-[#09090B] hover:bg-zinc-200 sm:inline-flex"
            >
              Use as Template
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRANSITION_VIEW}
        className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6"
      >
        {/* Day switcher for daily poster layouts */}
        {isDailyTemplate && schedule.days.length > 0 && (
          <div className="no-print mb-4 flex flex-wrap items-center justify-center gap-1.5">
            {schedule.days.map((day) => {
              const active = day === activeDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-white text-[#09090B]'
                      : 'border border-[#25252D] bg-[#131317] text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}

        <p className="no-print mb-2 text-center text-[11px] text-zinc-500 lg:hidden">
          Swipe horizontally to view the full fixed layout
        </p>

        <div className="overflow-x-auto pb-2">
          <div className={isDailyTemplate ? 'mx-auto w-fit' : 'mx-auto min-w-full w-fit'}>
            <TimetableRenderer
              canvasRef={canvasRef}
              meta={timetable.meta}
              schedule={schedule}
              template={template}
              selectedDay={activeDay}
              onSelectDay={setSelectedDay}
            />
          </div>
        </div>
      </motion.main>

      {/* Off-screen per-day renderers for ZIP / multi-page PDF */}
      {isDailyTemplate && schedule.days.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed -left-[9999px] top-0 w-[760px]"
        >
          {schedule.days.map((day) => (
            <div
              key={day}
              ref={(el) => {
                dailyExportRefs.current[day] = el;
              }}
            >
              <TimetableRenderer
                meta={timetable.meta}
                schedule={schedule}
                template={template}
                selectedDay={day}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
