'use client';

import React from 'react';
import { AlertTriangle, Layers, Clock, X } from 'lucide-react';
import type { OverlapConflict } from '@/types/timetable';
import { formatTimeDisplay } from '@/lib/schedule-engine';
import { AnimatedModalShell } from '@/components/MotionPrimitives';

interface OverlapAlertModalProps {
  conflicts: OverlapConflict[];
  timeFormat: '12h' | '24h';
  onClose: () => void;
  onMergeConflict: (occurrenceIds: string[]) => void;
  onMergeAll: () => void;
  onEditBlock?: (occurrenceId: string) => void;
}

export function OverlapAlertModal({
  conflicts,
  timeFormat,
  onClose,
  onMergeConflict,
  onMergeAll,
  onEditBlock,
}: OverlapAlertModalProps) {
  return (
    <AnimatedModalShell
      open={conflicts.length > 0}
      onClose={onClose}
      blurClass="bg-black/80 backdrop-blur-sm"
    >
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#2A2A34] bg-[#0D0D10] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#1E1E24] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Overlapping Time Detected
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                {conflicts.length === 1
                  ? 'Two or more subjects overlap at the same time.'
                  : `${conflicts.length} time slots have overlapping subjects.`}{' '}
                Choose whether to edit the time or merge them together while keeping them as separate subjects.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-[#1A1A20] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conflict List */}
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="rounded-xl border border-[#24242D] bg-[#131317] p-3.5"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-amber-300">
                  <Clock className="h-3.5 w-3.5" />
                  {conflict.day} · {conflict.blocks.length} overlapping subjects
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onMergeConflict(conflict.blocks.map((b) => b.occurrenceId))
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-[#09090B] transition hover:bg-zinc-200"
                >
                  <Layers className="h-3 w-3" />
                  Meant to Overlap (Merge)
                </button>
              </div>

              <div className="space-y-1.5">
                {conflict.blocks.map((blk) => (
                  <div
                    key={blk.occurrenceId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#202028] bg-[#0B0B0D] px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: blk.accentDot }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-white">
                          {blk.code ? `${blk.code} · ` : ''}
                          {blk.name}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400">
                          {formatTimeDisplay(blk.startTime, timeFormat)} –{' '}
                          {formatTimeDisplay(blk.endTime, timeFormat)}
                          {blk.room ? ` · ${blk.room}` : ''}
                        </div>
                      </div>
                    </div>

                    {onEditBlock && (
                      <button
                        type="button"
                        onClick={() => onEditBlock(blk.occurrenceId)}
                        className="shrink-0 rounded-md border border-[#27272F] px-2 py-1 text-[11px] text-zinc-300 hover:border-zinc-500 hover:text-white"
                      >
                        Edit Time
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#1E1E24] bg-[#0A0A0D] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#25252D] bg-[#131317] px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500"
          >
            I&apos;ll Fix Times
          </button>

          {conflicts.length > 1 && (
            <button
              type="button"
              onClick={onMergeAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-[#09090B] hover:bg-zinc-200"
            >
              <Layers className="h-3.5 w-3.5" />
              Merge All ({conflicts.length})
            </button>
          )}
        </div>
      </div>
    </AnimatedModalShell>
  );
}
