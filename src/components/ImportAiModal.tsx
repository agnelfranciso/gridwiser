'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileJson,
} from 'lucide-react';
import type { SubjectEntry, TimetableMeta } from '@/types/timetable';
import {
  AI_IMPORT_PROMPT,
  parseImportedTimetableJson,
} from '@/lib/import-parser';
import { AnimatedModalShell, TRANSITION_FAST } from '@/components/MotionPrimitives';

interface ImportAiModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (payload: {
    meta: Partial<TimetableMeta>;
    subjects: SubjectEntry[];
    sessionCount: number;
  }) => void;
}

export function ImportAiModal({ open, onClose, onImport }: ImportAiModalProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  const validation = useMemo(() => {
    if (!jsonInput.trim()) {
      return { status: 'idle' as const, error: null, result: null };
    }
    try {
      const result = parseImportedTimetableJson(jsonInput);
      return { status: 'valid' as const, error: null, result };
    } catch (err) {
      return {
        status: 'error' as const,
        error: err instanceof Error ? err.message : 'Invalid JSON',
        result: null,
      };
    }
  }, [jsonInput]);

  const handleCopyPrompt = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(AI_IMPORT_PROMPT);
      } else {
        const ta = document.createElement('textarea');
        ta.value = AI_IMPORT_PROMPT;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2200);
    } catch {
      // Fallback failed; ignore silently
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJsonInput(String(reader.result ?? ''));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyImport = () => {
    if (validation.status !== 'valid' || !validation.result) return;
    onImport(validation.result);
    setJsonInput('');
    onClose();
  };

  return (
    <AnimatedModalShell
      open={open}
      onClose={onClose}
      blurClass="bg-black/80 backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#25252D] bg-[#0D0D10] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E1E24] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2A2A34] bg-[#16161B]">
              <Sparkles className="h-4 w-4 text-zinc-100" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Import Using AI</h3>
              <p className="text-xs text-zinc-500">
                Convert any timetable image, PDF, or text into GridWiser JSON with your favorite AI.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#1A1A20] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Step 1: Copy AI Prompt */}
          <div className="space-y-2.5 rounded-xl border border-[#222229] bg-[#121216] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Step 1
                </span>
                <h4 className="text-xs font-semibold text-white">
                  Copy this prompt & attach your timetable image, PDF, or text in ChatGPT / Claude / Gemini
                </h4>
              </div>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied Prompt
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Prompt
                  </>
                )}
              </button>
            </div>

            <pre className="max-h-48 overflow-y-auto rounded-lg border border-[#22222A] bg-[#09090B] p-3 font-mono text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
              {AI_IMPORT_PROMPT}
            </pre>
          </div>

          {/* Step 2: Paste JSON or Upload File */}
          <div className="space-y-2.5 rounded-xl border border-[#222229] bg-[#121216] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Step 2
                </span>
                <h4 className="text-xs font-semibold text-white">
                  Paste the AI&apos;s JSON output below or upload a .json file
                </h4>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#2A2A34] bg-[#0B0B0D] px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500">
                <Upload className="h-3.5 w-3.5" />
                Upload .json File
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={7}
              placeholder='Paste JSON here, e.g. { "meta": { "title": "Semester 4" }, "subjects": [...] }'
              className="w-full rounded-lg border border-[#25252D] bg-[#09090B] p-3 font-mono text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500"
            />

            {/* Validation Status */}
            <AnimatePresence mode="wait">
              {validation.status === 'error' && (
                <motion.div
                  key="import-error"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={TRANSITION_FAST}
                  className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{validation.error}</span>
                </motion.div>
              )}

              {validation.status === 'valid' && validation.result && (
                <motion.div
                  key="import-valid"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={TRANSITION_FAST}
                  className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Ready to import:{' '}
                    <strong>{validation.result.subjects.length} subjects</strong> and{' '}
                    <strong>{validation.result.sessionCount} weekly sessions</strong>
                    {validation.result.meta.title
                      ? ` (${validation.result.meta.title})`
                      : ''}
                  </span>
                  <FileJson className="h-3.5 w-3.5 shrink-0 opacity-75" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#1E1E24] bg-[#0A0A0D] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#25252D] bg-[#131317] px-4 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500"
          >
            Cancel
          </button>

          <motion.button
            type="button"
            disabled={validation.status !== 'valid'}
            whileHover={{ scale: validation.status === 'valid' ? 1.015 : 1 }}
            whileTap={{ scale: validation.status === 'valid' ? 0.985 : 1 }}
            onClick={handleApplyImport}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200 disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Import Timetable
          </motion.button>
        </div>
      </div>
    </AnimatedModalShell>
  );
}
