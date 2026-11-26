'use client';

import React, { useState } from 'react';
import { Copy, Check, Sparkles, X, AlertCircle } from 'lucide-react';
import { AnimatedModalShell } from '@/components/MotionPrimitives';
import {
  EXAM_AI_EXTRACTION_PROMPT,
  parseExamAiJson,
} from '@/lib/exam-ai-parser';
import type { ExamEntry, ExamTimetableMeta } from '@/types/timetable';

interface ExamAiModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (payload: {
    meta: Partial<ExamTimetableMeta>;
    exams: ExamEntry[];
  }) => void;
}

export function ExamAiModal({ open, onClose, onImport }: ExamAiModalProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(EXAM_AI_EXTRACTION_PROMPT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      setError('Could not access clipboard. Please copy the prompt manually.');
    }
  };

  const handleApply = () => {
    setError(null);
    if (!jsonInput.trim()) {
      setError('Paste the JSON output from your AI first.');
      return;
    }
    try {
      const result = parseExamAiJson(jsonInput);
      onImport(result);
      setJsonInput('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse exam JSON.');
    }
  };

  return (
    <AnimatedModalShell open={open} onClose={onClose} zIndexClass="z-50">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#262632] bg-[#0B0C10] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1E1E26] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/15 text-blue-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Import Exam Timetable with AI
              </h3>
              <p className="text-[11px] text-zinc-400">
                Use ChatGPT, Claude, Gemini, or your local AI — 100% client-side.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5">
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">
                1. Copy this Exam Parser Prompt &amp; paste it with your exam sheet/PDF
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300 transition hover:bg-blue-500/20"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy Prompt
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-36 overflow-y-auto rounded-xl border border-[#20202A] bg-[#070709] p-3 font-mono text-[10px] leading-relaxed text-zinc-400 whitespace-pre-wrap">
              {EXAM_AI_EXTRACTION_PROMPT}
            </pre>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-200">
              2. Paste the resulting JSON here
            </label>
            <textarea
              rows={7}
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
              }}
              placeholder='{ "title": "Fall Finals 2026", "exams": [ ... ] }'
              className="w-full rounded-xl border border-[#242430] bg-[#070709] p-3 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#1E1E26] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#262632] bg-[#14141A] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Import Exam Schedule
          </button>
        </div>
      </div>
    </AnimatedModalShell>
  );
}
