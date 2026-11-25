'use client';

import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
} from 'lucide-react';
import {
  AI_THEME_GENERATOR_PROMPT,
  parseAiThemeJson,
} from '@/lib/ai-theme-parser';
import { AnimatedModalShell } from '@/components/MotionPrimitives';
import type { CustomTemplateDefinition } from '@/types/timetable';

interface ThemeAiModalProps {
  open: boolean;
  onClose: () => void;
  onApplyTheme: (parsedTheme: Partial<CustomTemplateDefinition>) => void;
}

export function ThemeAiModal({ open, onClose, onApplyTheme }: ThemeAiModalProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  const validation = useMemo(() => {
    if (!jsonInput.trim()) {
      return { status: 'idle' as const, error: null, result: null };
    }
    try {
      const result = parseAiThemeJson(jsonInput);
      return { status: 'valid' as const, error: null, result };
    } catch (err) {
      return {
        status: 'error' as const,
        error: err instanceof Error ? err.message : 'Invalid JSON format',
        result: null,
      };
    }
  }, [jsonInput]);

  const handleCopyPrompt = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(AI_THEME_GENERATOR_PROMPT);
      } else {
        const ta = document.createElement('textarea');
        ta.value = AI_THEME_GENERATOR_PROMPT;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2400);
    } catch {
      // ignore
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
  };

  const handleApply = () => {
    if (validation.status === 'valid' && validation.result) {
      onApplyTheme(validation.result);
      onClose();
    }
  };

  return (
    <AnimatedModalShell open={open} onClose={onClose} zIndexClass="z-50">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-[#0A0D16] p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2232]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Generate Custom Theme with AI
              </h3>
              <p className="text-[11px] text-zinc-400">
                Describe any vibe, color palette, or aesthetic to ChatGPT or Claude and paste the result.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2-Step Workflow */}
        <div className="mt-4 space-y-4">
          {/* Step 1: Prompt Copier */}
          <div className="rounded-xl border border-[#202538] bg-[#0E1220] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-[#050811]">
                  1
                </span>
                <span className="text-xs font-semibold text-zinc-200">
                  Copy the AI Theme Prompt
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/25"
              >
                {copiedPrompt ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedPrompt ? 'Copied Prompt!' : 'Copy System Prompt'}</span>
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Paste this into ChatGPT, Claude, or Gemini alongside your instructions (e.g. &quot;Make a minimalist Japanese matcha green paper theme&quot; or &quot;Make a dark synthwave cyberpunk aesthetic&quot;).
            </p>
          </div>

          {/* Step 2: Paste Generated JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-[#050811]">
                  2
                </span>
                <span className="text-xs font-semibold text-zinc-200">
                  Paste the Output JSON
                </span>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-zinc-400 transition hover:text-white">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload .json</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="relative">
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste raw JSON here: { "name": "Matcha Studio", "layout": "cron-sidebar-grid", ... }'
                rows={6}
                className="w-full resize-none rounded-xl border border-[#23283C] bg-[#0A0D18] p-3 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Validation Feedback */}
            {validation.status === 'valid' && validation.result && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    Valid theme schema: <strong>{validation.result.name}</strong> ({validation.result.layout}, {validation.result.mode} mode)
                  </span>
                </div>
                <div
                  className="h-4 w-4 rounded-full border border-white/20"
                  style={{ backgroundColor: validation.result.tokens?.accent }}
                />
              </div>
            )}

            {validation.status === 'error' && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span className="truncate">{validation.error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#1E2232] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={validation.status !== 'valid'}
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2 text-xs font-semibold text-[#050811] transition hover:bg-zinc-200 disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Apply AI Theme</span>
          </button>
        </div>
      </div>
    </AnimatedModalShell>
  );
}
