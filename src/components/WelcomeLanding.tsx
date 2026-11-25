'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  Calendar,
  Palette,
  Download,
  Clock,
  Check,
} from 'lucide-react';
import { GridWiseBrand } from '@/components/GridWiseLogo';
import type { PresetTemplateId } from '@/types/timetable';
import { PRESET_TEMPLATES } from '@/lib/themes';
import {
  EASE_SMOOTH,
  SPRING_PILL,
  TRANSITION_FAST,
  TRANSITION_VIEW,
} from '@/components/MotionPrimitives';

interface WelcomeLandingProps {
  onGetStarted: (presetId?: PresetTemplateId) => void;
  onOpenAiImport: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
}

export function WelcomeLanding({
  onGetStarted,
  onOpenAiImport,
  onOpenAuth,
}: WelcomeLandingProps) {
  const [previewTplId, setPreviewTplId] = useState<PresetTemplateId>('cron-studio');
  const activePreviewTpl =
    PRESET_TEMPLATES.find((t) => t.id === previewTplId) ?? PRESET_TEMPLATES[0];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03050A] text-zinc-100">
      {/* Clean Header for Unregistered Visitors — no studio links */}
      <header className="relative z-20 border-b border-white/[0.06] bg-[#03050A]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <GridWiseBrand size="md" tone="dark" />

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.12]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onGetStarted()}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#050811] shadow-sm transition hover:bg-zinc-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Cobalt-Sapphire Radial Aura */}
      <section className="relative overflow-hidden pb-16 pt-16 sm:pt-20">
        {/* Deep Cobalt Atmospheric Glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 58% at 50% 48%, rgba(37, 99, 235, 0.62) 0%, rgba(29, 78, 216, 0.34) 36%, rgba(10, 22, 58, 0.22) 66%, rgba(3, 5, 10, 0) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 52%, rgba(96, 165, 250, 0.22) 0%, transparent 55%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          {/* Announcement Pill */}
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_SMOOTH }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenAiImport}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] p-1 pr-3.5 text-xs text-blue-100/90 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.1]"
          >
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white">
              New
            </span>
            <span>Import schedules from any image or PDF with AI</span>
          </motion.button>

          {/* Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.05, ease: EASE_SMOOTH }}
            className="mx-auto max-w-3xl text-4xl font-medium tracking-tight text-white sm:text-6xl sm:leading-[1.08]"
          >
            Timetables, Built Cleanly
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.1, ease: EASE_SMOOTH }}
            className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-blue-100/75 sm:text-base"
          >
            Enter your subjects and weekly timings effortlessly—or import directly with AI. Preview modern preset templates and export print-ready schedules in seconds.
          </motion.p>

          {/* Dual Pill CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.15, ease: EASE_SMOOTH }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <motion.button
              type="button"
              whileHover={{ y: -1.5, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onGetStarted()}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-semibold text-[#050811] shadow-[0_12px_32px_-8px_rgba(255,255,255,0.4)] transition hover:bg-zinc-200 sm:text-sm"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenAiImport}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-6 py-2.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/[0.14] sm:text-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Import Using AI
            </motion.button>
          </motion.div>

          {/* Centerpiece Dark Console / Timetable Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE_SMOOTH }}
            className="relative mx-auto mt-14 max-w-3xl"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0A0C12]/95 text-left shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl">
              {/* Top Console Chrome */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-white/[0.02] px-5 py-3">
                <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>gridwiser.studio · {activePreviewTpl.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  {PRESET_TEMPLATES.slice(0, 4).map((tpl) => {
                    const active = tpl.id === previewTplId;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setPreviewTplId(tpl.id)}
                        className={`relative rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${active
                          ? 'text-[#050811]'
                          : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="welcome-preview-pill"
                            transition={SPRING_PILL}
                            className="absolute inset-0 rounded-full bg-white"
                          />
                        )}
                        <span className="relative z-10">{tpl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clean Live Sample Grid Showcase */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePreviewTpl.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={TRANSITION_FAST}
                  className="p-5 sm:p-6"
                  style={{
                    backgroundColor: activePreviewTpl.tokens.canvasBg,
                    color: activePreviewTpl.tokens.text,
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div
                        className="font-mono text-[10px] uppercase tracking-wider"
                        style={{ color: activePreviewTpl.tokens.textMuted }}
                      >
                        Weekly Schedule · Mon–Fri
                      </div>
                      <div className="mt-0.5 text-sm font-semibold">
                        Computer Science · Term 4
                      </div>
                    </div>
                    <span
                      className="rounded-md border px-2 py-0.5 font-mono text-[10px]"
                      style={{
                        backgroundColor: activePreviewTpl.tokens.cardBg,
                        borderColor: activePreviewTpl.tokens.border,
                        color: activePreviewTpl.tokens.textMuted,
                      }}
                    >
                      18.5 hrs / wk
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                    {[
                      {
                        day: 'Mon',
                        items: [
                          { code: 'CS 301', name: 'Algorithms', time: '09:00–10:30', dot: '#60A5FA' },
                          { code: 'MA 204', name: 'Linear Algebra', time: '13:00–14:00', dot: '#A78BFA' },
                        ],
                      },
                      {
                        day: 'Tue',
                        items: [
                          { code: 'AI 410', name: 'Neural Nets', time: '10:00–12:00', dot: '#34D399' },
                        ],
                      },
                      {
                        day: 'Wed',
                        items: [
                          { code: 'CS 301', name: 'Algorithms', time: '09:00–10:30', dot: '#60A5FA' },
                          { code: 'LAB 02', name: 'Systems Lab', time: '14:00–16:00', dot: '#E4E4E7' },
                        ],
                      },
                      {
                        day: 'Thu',
                        items: [
                          { code: 'DES 21', name: 'HCI Studio', time: '11:00–12:30', dot: '#F472B6' },
                        ],
                      },
                      {
                        day: 'Fri',
                        items: [
                          { code: 'AI 410', name: 'Neural Nets', time: '10:00–11:30', dot: '#34D399' },
                        ],
                      },
                    ].map((col) => (
                      <div
                        key={col.day}
                        className="rounded-lg border p-2.5"
                        style={{
                          backgroundColor: activePreviewTpl.tokens.surfaceBg,
                          borderColor: activePreviewTpl.tokens.border,
                        }}
                      >
                        <div
                          className="mb-2 border-b pb-1.5 text-[11px] font-semibold"
                          style={{ borderColor: activePreviewTpl.tokens.border }}
                        >
                          {col.day}
                        </div>
                        <div className="space-y-1.5">
                          {col.items.map((it) => (
                            <div
                              key={`${col.day}-${it.code}`}
                              className="rounded-md border p-2"
                              style={{
                                backgroundColor: activePreviewTpl.tokens.cardBg,
                                borderColor: activePreviewTpl.tokens.borderStrong,
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: it.dot }}
                                />
                                <span
                                  className="font-mono text-[9px]"
                                  style={{ color: activePreviewTpl.tokens.textMuted }}
                                >
                                  {it.code}
                                </span>
                              </div>
                              <div className="mt-1 truncate text-[11px] font-medium">
                                {it.name}
                              </div>
                              <div
                                className="mt-0.5 font-mono text-[9px]"
                                style={{ color: activePreviewTpl.tokens.textMuted }}
                              >
                                {it.time}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Subtle Bottom Fade Edge like MagUSD reference */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#03050A] via-[#03050A]/60 to-transparent" />
            </div>
          </motion.div>

          {/* Bottom Capabilities Strip (aligned like the reference bottom bar) */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-zinc-400/80">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-blue-400" />
              Exact Weekly Occurrences
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-blue-400" />
              Overlap Detection & Merge
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-blue-400" />
              AI Image / PDF Import
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-blue-400" />
              PNG · PDF · .ICS Export
            </span>
          </div>
        </div>
      </section>

      {/* Preset Templates Showcase Section */}
      <section id="templates" className="border-t border-white/[0.06] bg-[#04060B] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-blue-400">
                Full Preset Templates
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                12 Structurally Distinct Presets
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Pick any complete preset to start building your timetable with it immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onGetStarted()}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.12]"
            >
              Launch Studio
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {PRESET_TEMPLATES.map((tpl, idx) => (
              <motion.button
                key={tpl.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...TRANSITION_VIEW, delay: idx * 0.04 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onGetStarted(tpl.id)}
                className="group rounded-xl border border-white/[0.08] bg-[#0A0D14] p-4 text-left transition-colors hover:border-blue-500/40 hover:bg-[#0E131E]"
              >
                <div
                  className="mb-3 flex h-20 flex-col justify-between rounded-lg border p-2.5"
                  style={{
                    background: tpl.tokens.headerBannerBg ?? tpl.tokens.canvasBg,
                    borderColor: tpl.tokens.borderStrong,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="h-1.5 w-12 rounded-full"
                      style={{ backgroundColor: tpl.tokens.text }}
                    />
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tpl.tokens.accent }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <span
                      className="h-6 rounded border"
                      style={{
                        backgroundColor: tpl.tokens.cardBg,
                        borderColor: tpl.tokens.border,
                      }}
                    />
                    <span
                      className="h-6 rounded border"
                      style={{
                        backgroundColor: tpl.tokens.cardElevatedBg,
                        borderColor: tpl.tokens.borderStrong,
                      }}
                    />
                    <span
                      className="h-6 rounded border"
                      style={{
                        backgroundColor: tpl.tokens.cardBg,
                        borderColor: tpl.tokens.border,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{tpl.name}</span>
                  <span className="font-mono text-[10px] text-zinc-500">{tpl.category}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">
                  {tpl.description}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Strip */}
      <section id="workflow" className="border-t border-white/[0.06] bg-[#03050A] py-14">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Calendar className="h-4 w-4 text-blue-400" />}
            title="1. Enter or AI-Import"
            desc="Add each subject with exact weekly occurrences and times—or copy our AI prompt to extract schedules from any image or PDF."
          />
          <FeatureCard
            icon={<Palette className="h-4 w-4 text-blue-400" />}
            title="2. Preview Preset Templates"
            desc="Preview your real classes across 8 complete modern templates and merge intentional overlaps into unified split cards."
          />
          <FeatureCard
            icon={<Download className="h-4 w-4 text-blue-400" />}
            title="3. Adjust & Export"
            desc="Fine-tune any block directly, save to your Google-synced cloud library, share via link, or export as PNG, PDF, or .ICS."
          />
        </div>
      </section>

      {/* Global Modern Footer */}
      <footer className="border-t border-white/[0.08] bg-[#020306] py-12 text-zinc-400">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <GridWiseBrand size="md" tone="dark" />
              <p className="text-xs leading-relaxed text-zinc-500">
                Precision weekly schedule builder with automatic conflict handling, AI extraction, and 8 handcrafted architectural themes.
              </p>
              <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Cloud Sync · Instant Export
              </div>
            </div>

            {/* Col 2: Studio Tools */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-white">Studio</div>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => onGetStarted()}
                    className="transition hover:text-white"
                  >
                    Get Started (Wizard)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenAiImport}
                    className="transition hover:text-white"
                  >
                    AI Import (Image/PDF)
                  </button>
                </li>
                <li>
                  <a href="#templates" className="transition hover:text-white">
                    Explore 8 Design Themes
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="transition hover:text-white">
                    How it Works
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Export & Integrations */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-white">Export & Sync</div>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-1.5">
                  <span className="text-zinc-500">·</span> High-Res PNG (Retina 2x)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-zinc-500">·</span> Vector Print & PDF
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-zinc-500">·</span> Apple / Google Calendar (.ICS)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-zinc-500">·</span> Public Read-Only Share Links
                </li>
              </ul>
            </div>

            {/* Col 4: Legal & Policies */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-white">Trust & Legal</div>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="/legal#terms" className="transition hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/legal#privacy" className="transition hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/legal#security" className="transition hover:text-white">
                    Security & Data Protection
                  </a>
                </li>
                <li>
                  <a
                    href="/signin"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenAuth('signin');
                    }}
                    className="transition hover:text-white"
                  >
                    Google OAuth Sign In
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-6 text-[11px] text-zinc-500 sm:flex-row">
            <p>© 2026 GridWiser Studio. Built for students, engineers, and educators.</p>
            <div className="flex items-center gap-6">
              <a href="/legal" className="hover:text-zinc-300">
                Terms & Privacy
              </a>
              <span className="text-zinc-700">·</span>
              <a href="#templates" className="hover:text-zinc-300">
                Presets
              </a>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-600">Strict Auth Policy (Google Only)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#090C12] p-5">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
        {icon}
      </div>
      <div className="text-xs font-semibold text-white">{title}</div>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{desc}</p>
    </div>
  );
}
