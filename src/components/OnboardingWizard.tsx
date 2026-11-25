'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { GridWiseBrand } from '@/components/GridWiseLogo';
import type {
  PresetTemplateId,
  SubjectEntry,
  TimetableMeta,
} from '@/types/timetable';
import { getPresetTemplate, PRESET_TEMPLATES } from '@/lib/themes';
import { analyzeSchedule, markOccurrencesAsMerged } from '@/lib/schedule-engine';
import { SubjectEntryBuilder } from '@/components/SubjectEntryBuilder';
import { TimetableRenderer } from '@/components/TimetableRenderer';
import { OverlapAlertModal } from '@/components/OverlapAlertModal';
import {
  AiImportButton,
  SPRING_PILL,
  TRANSITION_FAST,
  TRANSITION_VIEW,
} from '@/components/MotionPrimitives';

interface OnboardingWizardProps {
  meta: TimetableMeta;
  subjects: SubjectEntry[];
  templateId: PresetTemplateId;
  step?: 1 | 2;
  onChangeStep?: (step: 1 | 2) => void;
  onChangeMeta: (next: TimetableMeta) => void;
  onChangeSubjects: (next: SubjectEntry[]) => void;
  onChangeTemplateId: (id: PresetTemplateId) => void;
  onOpenAiImport: () => void;
  onBackToWelcome: () => void;
  onGenerate: () => void;
}

export function OnboardingWizard({
  meta,
  subjects,
  templateId,
  step: controlledStep,
  onChangeStep,
  onChangeMeta,
  onChangeSubjects,
  onChangeTemplateId,
  onOpenAiImport,
  onBackToWelcome,
  onGenerate,
}: OnboardingWizardProps) {
  const [internalStep, setInternalStep] = useState<1 | 2>(1);
  const step = controlledStep ?? internalStep;
  const [overlapAlertOpen, setOverlapAlertOpen] = useState(false);

  const schedule = useMemo(() => analyzeSchedule(subjects, meta), [subjects, meta]);
  const selectedTemplate = useMemo(() => getPresetTemplate(templateId), [templateId]);

  const goToStep = (next: 1 | 2) => {
    if (onChangeStep) onChangeStep(next);
    else setInternalStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToStep2 = () => {
    if (schedule.unresolvedOverlaps.length > 0) {
      setOverlapAlertOpen(true);
      return;
    }
    goToStep(2);
  };

  const handleGenerateClick = () => {
    if (schedule.unresolvedOverlaps.length > 0) {
      setOverlapAlertOpen(true);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onGenerate();
  };

  return (
    <div className="relative min-h-screen bg-[#03050A] text-zinc-100">
      {/* Cobalt-Sapphire Atmospheric Aura matching Welcome & SignIn */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 48% at 50% 0%, rgba(37, 99, 235, 0.34) 0%, rgba(29, 78, 216, 0.14) 45%, rgba(3, 5, 10, 0) 80%)',
        }}
      />

      {/* Clean Header Bar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#03050A]/80 px-3 py-3 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onBackToWelcome}
            className="flex items-center gap-2 transition hover:opacity-85"
          >
            <GridWiseBrand size="md" tone="dark" />
          </button>

          {/* Stepper Tabs */}
          <div className="order-3 flex w-full items-center justify-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 text-xs sm:order-none sm:w-auto sm:gap-1.5">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition sm:flex-initial sm:px-3.5 ${
                step === 1 ? 'text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {step === 1 && (
                <motion.span
                  layoutId="wizard-stepper-pill"
                  transition={SPRING_PILL}
                  className="absolute inset-0 rounded-full bg-white shadow-sm"
                />
              )}
              <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-[10px]">
                1
              </span>
              <span className="relative z-10">Subjects & Times</span>
            </button>

            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-600" />

            <button
              type="button"
              onClick={handleGoToStep2}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition sm:flex-initial sm:px-3.5 ${
                step === 2 ? 'text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {step === 2 && (
                <motion.span
                  layoutId="wizard-stepper-pill"
                  transition={SPRING_PILL}
                  className="absolute inset-0 rounded-full bg-white shadow-sm"
                />
              )}
              <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-[10px]">
                2
              </span>
              <span className="relative z-10">Select Theme</span>
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5 text-xs">
              {(['24h', '12h'] as const).map((fmt) => {
                const active = meta.timeFormat === fmt;
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => onChangeMeta({ ...meta, timeFormat: fmt })}
                    className={`relative rounded-md px-2 py-1 text-[11px] font-medium transition sm:px-2.5 ${
                      active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="wizard-timefmt"
                        transition={SPRING_PILL}
                        className="absolute inset-0 rounded-md bg-white/15"
                      />
                    )}
                    <span className="relative z-10">{fmt}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onBackToWelcome}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.08] hover:text-white sm:px-3"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-6xl px-3 py-5 sm:px-8 sm:py-8">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="wizard-step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={TRANSITION_VIEW}
              className="space-y-6"
            >
              {/* Step 1 Header & Quick Action */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Subjects & Weekly Schedule
                  </h1>
                  <p className="mt-1 text-xs text-zinc-400">
                    Add the subjects you are taking and their weekly days and hours.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AiImportButton onClick={onOpenAiImport} />
                </div>
              </div>

              {/* Title & Subtitle Card */}
              <div className="grid gap-3 rounded-2xl border border-white/[0.08] bg-[#0A0D15]/80 p-4 sm:grid-cols-2 sm:p-5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Timetable Title
                  </label>
                  <input
                    type="text"
                    value={meta.title}
                    onChange={(e) => onChangeMeta({ ...meta, title: e.target.value })}
                    placeholder="e.g. Semester 4 - CS & Engineering"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#05070C] px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition focus:border-blue-500/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Term / Subtitle (optional)
                  </label>
                  <input
                    type="text"
                    value={meta.subtitle}
                    onChange={(e) => onChangeMeta({ ...meta, subtitle: e.target.value })}
                    placeholder="e.g. Spring 2026 · Batch A"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#05070C] px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition focus:border-blue-500/60"
                  />
                </div>
              </div>

              {/* Subject Entry Builder */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0A0D15]/80 p-3.5 sm:p-5">
                <SubjectEntryBuilder
                  subjects={subjects}
                  timeFormat={meta.timeFormat}
                  onChangeSubjects={onChangeSubjects}
                />
              </div>

              {/* Next Button Footer */}
              <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0A0D15]/90 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-center text-xs text-zinc-400 sm:text-left">
                  {subjects.length === 0 ? (
                    <span className="text-zinc-500">Add at least one subject to proceed</span>
                  ) : (
                    <span className="font-medium text-white">
                      {subjects.length} subjects · {schedule.stats.totalSessions} sessions ({schedule.stats.totalHours}h/week)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={subjects.length === 0}
                  onClick={handleGoToStep2}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black transition hover:bg-zinc-200 disabled:opacity-40 sm:w-auto"
                >
                  Choose Design Theme
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="wizard-step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={TRANSITION_VIEW}
              className="space-y-6"
            >
              {/* Step 2 Header */}
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Choose Your Design Preset
                  </h1>
                  <p className="mt-1 text-xs text-zinc-400">
                    Each theme has bespoke fonts, layout proportions, and custom palettes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Subjects
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateClick}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-xs font-bold text-black shadow-lg transition hover:bg-zinc-200"
                  >
                    Generate Timetable
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Preset Selector Grid - Swipeable horizontal strip on mobile, 4/6-col grid on desktop */}
              <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 lg:grid-cols-6">
                {PRESET_TEMPLATES.map((tpl) => {
                  const active = tpl.id === templateId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => onChangeTemplateId(tpl.id)}
                      className={`group relative flex w-[138px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-xl border p-2.5 text-left transition-all sm:w-auto ${
                        active
                          ? 'border-blue-400 bg-[#121828] shadow-[0_0_20px_rgba(59,130,246,0.25)] ring-1 ring-blue-400'
                          : 'border-white/[0.08] bg-[#0A0D15] hover:border-white/20 hover:bg-[#0E131E]'
                      }`}
                    >
                      {/* Mini Theme Thumbnail */}
                      <div
                        className="mb-2 h-10 w-full rounded-md border p-1"
                        style={{
                          backgroundColor: tpl.tokens.headerBannerBg ?? tpl.tokens.canvasBg,
                          borderColor: tpl.tokens.borderStrong,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="h-1 w-4 rounded-full"
                            style={{ backgroundColor: tpl.tokens.text }}
                          />
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: tpl.tokens.accent }}
                          />
                        </div>
                        <div className="mt-1 flex gap-1">
                          <span
                            className="h-3.5 flex-1 rounded-xs"
                            style={{ backgroundColor: tpl.tokens.cardBg }}
                          />
                          <span
                            className="h-3.5 w-2 rounded-xs"
                            style={{ backgroundColor: tpl.tokens.accent }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="truncate text-xs font-semibold text-white">
                            {tpl.name}
                          </span>
                          {active && (
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[9px] text-white">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                          {tpl.layoutLabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Full Scale Clean Timetable Preview */}
              <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0A0C13] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#07090F] px-3.5 py-2.5 sm:px-5 sm:py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      Live Preview: {selectedTemplate.name}
                    </span>
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      {selectedTemplate.category}
                    </span>
                  </div>
                  <div className="hidden text-xs text-zinc-400 sm:block">
                    {schedule.stats.totalSessions} scheduled sessions across{' '}
                    {meta.showWeekend ? '7' : '5'} days
                  </div>
                </div>

                <div className="p-3 sm:p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedTemplate.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={TRANSITION_FAST}
                    >
                      <ScaledTimetablePreview
                        designWidth={
                          selectedTemplate.layout === 'daily-poster' ||
                          selectedTemplate.layout === 'daily-deck' ||
                          selectedTemplate.layout === 'exhibition-daily'
                            ? 680
                            : 1060
                        }
                      >
                        <TimetableRenderer
                          meta={meta}
                          schedule={schedule}
                          template={selectedTemplate}
                          compactPreview={false}
                        />
                      </ScaledTimetablePreview>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col-reverse gap-3 rounded-2xl border border-white/[0.08] bg-[#080B12]/90 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Edit Subjects & Timings
                </button>

                <button
                  type="button"
                  onClick={handleGenerateClick}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-2.5 text-xs font-bold text-black transition hover:bg-zinc-200 sm:w-auto"
                >
                  Continue to Save & Export
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Overlap Alert Modal */}
      <OverlapAlertModal
        conflicts={overlapAlertOpen ? schedule.unresolvedOverlaps : []}
        timeFormat={meta.timeFormat}
        onClose={() => setOverlapAlertOpen(false)}
        onMergeConflict={(ids) => {
          onChangeSubjects(markOccurrencesAsMerged(subjects, ids));
          if (schedule.unresolvedOverlaps.length <= 1) {
            setOverlapAlertOpen(false);
          }
        }}
        onMergeAll={() => {
          const allIds = schedule.unresolvedOverlaps.flatMap((c) =>
            c.blocks.map((b) => b.occurrenceId)
          );
          onChangeSubjects(markOccurrencesAsMerged(subjects, allIds));
          setOverlapAlertOpen(false);
        }}
      />
    </div>
  );
}

/**
 * Keeps the timetable in its exact fixed desktop/poster layout and scales it
 * proportionally to fit smaller mobile viewports without reflowing columns.
 */
function ScaledTimetablePreview({
  designWidth,
  children,
}: {
  designWidth: number;
  children: React.ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      if (!outerRef.current || !innerRef.current) return;
      const avail = outerRef.current.clientWidth;
      const nextScale = avail > 0 && avail < designWidth ? avail / designWidth : 1;
      setScale(nextScale);
      setInnerHeight(innerRef.current.scrollHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [designWidth]);

  return (
    <div
      ref={outerRef}
      className="w-full overflow-hidden"
      style={{
        height: innerHeight !== null && scale < 1 ? `${Math.ceil(innerHeight * scale)}px` : 'auto',
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: scale < 1 ? `${designWidth}px` : '100%',
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}
