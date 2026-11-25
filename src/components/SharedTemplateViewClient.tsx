'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  Sliders,
} from 'lucide-react';
import { TimetableRenderer } from '@/components/TimetableRenderer';
import {
  AnalyzedSchedule,
  CustomTemplateDefinition,
  TimetableMeta,
  toPresetTemplate,
} from '@/types/timetable';

const SAMPLE_META: TimetableMeta = {
  title: 'Engineering Schedule Preview',
  subtitle: 'Generated with GridWiser',
  timeFormat: '24h',
  showWeekend: false,
};

const SAMPLE_SCHEDULE: AnalyzedSchedule = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  minHour: 8,
  maxHour: 18,
  blocks: [
    {
      occurrenceId: 'o1',
      subjectId: 's1',
      name: 'Advanced Algorithms',
      code: 'CS-401',
      room: 'Hall B',
      instructor: 'Dr. Thorne',
      accentDot: '#3B82F6',
      day: 'Mon',
      startTime: '09:00',
      endTime: '10:30',
      startMin: 540,
      endMin: 630,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o2',
      subjectId: 's2',
      name: 'Embedded Systems Lab',
      code: 'EE-310',
      room: 'Lab 4',
      instructor: 'Prof. Miller',
      accentDot: '#10B981',
      day: 'Mon',
      startTime: '11:00',
      endTime: '13:00',
      startMin: 660,
      endMin: 780,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o3',
      subjectId: 's3',
      name: 'Distributed Cloud Arch',
      code: 'CS-420',
      room: 'Virtual 2',
      instructor: 'Sarah Jenkins',
      accentDot: '#F59E0B',
      day: 'Tue',
      startTime: '10:00',
      endTime: '11:30',
      startMin: 600,
      endMin: 690,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o4',
      subjectId: 's1',
      name: 'Advanced Algorithms',
      code: 'CS-401',
      room: 'Hall B',
      instructor: 'Dr. Thorne',
      accentDot: '#3B82F6',
      day: 'Wed',
      startTime: '09:00',
      endTime: '10:30',
      startMin: 540,
      endMin: 630,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o5',
      subjectId: 's4',
      name: 'Quantum Logic Lab',
      code: 'CS-480',
      room: 'Seminar Room',
      instructor: 'Dr. Rao',
      accentDot: '#EC4899',
      day: 'Thu',
      startTime: '14:00',
      endTime: '16:00',
      startMin: 840,
      endMin: 960,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
  ],
  mergedGroups: [],
  unresolvedOverlaps: [],
  stats: {
    totalSubjects: 4,
    totalSessions: 5,
    totalHours: 8.5,
    busiestDay: 'Mon',
    conflictCount: 0,
  },
};

export function SharedTemplateViewClient({
  template,
}: {
  template: CustomTemplateDefinition;
}) {
  const [copied, setCopied] = useState(false);

  const preset = useMemo(() => toPresetTemplate(template), [template]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#08080A] text-zinc-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#1E1E24] bg-[#0E0E12]/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#26262F] bg-[#141418] px-2.5 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>GridWiser</span>
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white sm:text-sm">
              {template.name}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-400">
              By {template.authorName || 'Community'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#272732] bg-[#131318] px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Share Theme'}</span>
          </button>
          <Link
            href="/theme-creator"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Customize or Remix</span>
          </Link>
        </div>
      </header>

      {/* Main View */}
      <main className="mx-auto w-full max-w-[1340px] flex-1 p-4 lg:p-8 space-y-6">
        {/* Info card */}
        <div className="rounded-2xl border border-[#202028] bg-[#101014] p-5 shadow-xl sm:flex sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: template.tokens.accent }}
              />
              <h1 className="text-base font-bold text-white sm:text-lg">
                {template.name}
              </h1>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              {template.description || 'Custom crafted timetable theme.'}
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 text-[11px] font-mono text-zinc-400">
            <span className="rounded-md border border-[#2A2A36] bg-[#16161D] px-2 py-1">
              Layout: {template.layout}
            </span>
            <span className="rounded-md border border-[#2A2A36] bg-[#16161D] px-2 py-1">
              Mode: {template.mode}
            </span>
            <span className="rounded-md border border-[#2A2A36] bg-[#16161D] px-2 py-1">
              Font: {template.displayFont}
            </span>
          </div>
        </div>

        {/* Live Preview Render */}
        <div className="space-y-2">
          <span className="font-mono text-xs text-zinc-500">
            Sample Schedule Demonstration
          </span>
          <div className="overflow-hidden rounded-2xl border border-[#22222B] shadow-2xl">
            <TimetableRenderer
              meta={SAMPLE_META}
              schedule={SAMPLE_SCHEDULE}
              template={preset}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
