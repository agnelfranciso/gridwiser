'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import {
  Download,
  CalendarPlus,
  Printer,
  Copy,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { GridWiseBrand } from '@/components/GridWiseLogo';
import type { SavedTimetableRecord } from '@/types/timetable';
import { getPresetTemplate } from '@/lib/themes';
import { analyzeSchedule, generateICSFromSubjects } from '@/lib/schedule-engine';
import { TimetableRenderer } from '@/components/TimetableRenderer';
import { TRANSITION_VIEW } from '@/components/MotionPrimitives';

export function ShareViewClient({ timetable }: { timetable: SavedTimetableRecord }) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  const template = useMemo(
    () => getPresetTemplate(timetable.templateId),
    [timetable.templateId]
  );
  const schedule = useMemo(
    () => analyzeSchedule(timetable.subjects, timetable.meta),
    [timetable.subjects, timetable.meta]
  );

  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await toPng(canvasRef.current, {
      pixelRatio: 2,
      backgroundColor: template.tokens.canvasBg,
    });
    const link = document.createElement('a');
    link.download = `${(timetable.meta.title || 'gridwise-timetable').toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleExportIcs = () => {
    const ics = generateICSFromSubjects(timetable.meta, timetable.subjects);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(timetable.meta.title || 'gridwise-timetable').toLowerCase().replace(/\s+/g, '-')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-zinc-100">
      <header className="no-print sticky top-0 z-30 border-b border-[#1C1C22] bg-[#0A0A0C]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <GridWiseBrand size="sm" tone="dark" />
            <span className="font-mono text-[10px] uppercase text-zinc-500">Shared</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#25252D] bg-[#131317] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy URL'}
            </button>
            <button
              type="button"
              onClick={handleExportPng}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#25252D] bg-[#131317] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
            >
              <Download className="h-3.5 w-3.5" />
              PNG
            </button>
            <button
              type="button"
              onClick={handleExportIcs}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#25252D] bg-[#131317] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              .ICS
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#25252D] bg-[#131317] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <Link
              href={`/?load=${encodeURIComponent(timetable.id)}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-[#09090B] hover:bg-zinc-200"
            >
              Remix in Studio
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRANSITION_VIEW}
        className="mx-auto max-w-7xl px-4 py-6 sm:px-6"
      >
        <TimetableRenderer
          canvasRef={canvasRef}
          meta={timetable.meta}
          schedule={schedule}
          template={template}
        />
      </motion.main>
    </div>
  );
}
