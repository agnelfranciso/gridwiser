import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Cpu,
  Globe,
  GraduationCap,
  Heart,
  Palette,
  Share2,
  Smartphone,
  Sparkles,
  Unlock,
  X,
} from 'lucide-react';
import { GridWiseBrand } from '@/components/GridWiseLogo';

export const metadata: Metadata = {
  title: 'About – GridWiser',
  description:
    'Built by student developer Agnel Francis Olakkengil for students: zero-paywall timetable creation, multi-device sync, custom theming, and bring-your-own or local AI.',
};

const PILLARS = [
  {
    icon: Unlock,
    accent: 'text-emerald-400',
    glow: 'from-emerald-500/20 to-transparent',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/25',
    title: 'Zero Paywalls for Students',
    description:
      'No "Pro" tiers locking away export formats, templates, or customization. Every layout, 3× Retina PNG, print-ready PDF, wallpaper, and .ICS feed is free out of the box.',
  },
  {
    icon: Smartphone,
    accent: 'text-blue-400',
    glow: 'from-blue-500/20 to-transparent',
    badgeBg: 'bg-blue-500/10 border-blue-500/25',
    title: 'Multi-Device Connectivity',
    description:
      'Build on your laptop, tweak on your phone before class, and export lockscreen wallpapers anytime. Your schedules and custom themes stay synced across every device.',
  },
  {
    icon: Palette,
    accent: 'text-violet-400',
    glow: 'from-violet-500/20 to-transparent',
    badgeBg: 'bg-violet-500/10 border-violet-500/25',
    title: 'Deep Custom Theming & Sharing',
    description:
      'Craft your own timetable aesthetic down to every color token, font pairing, border radius, and layout engine—then share a public link so classmates can add it to their account.',
  },
  {
    icon: Cpu,
    accent: 'text-amber-400',
    glow: 'from-amber-500/20 to-transparent',
    badgeBg: 'bg-amber-500/10 border-amber-500/25',
    title: 'Your Local or Preferred AI',
    description:
      'Never pay extra for bundled AI credits or custom theme commissions. Copy a structured prompt, run it with your own local model or favorite AI, and paste the JSON straight in.',
  },
];

const COMPARISON_ROWS = [
  {
    label: 'High-res PNG, PDF & .ICS Calendar Export',
    others: 'Locked behind monthly Pro paywall',
    gridwiser: '100% Free & unlimited',
  },
  {
    label: 'Custom Themes & Visual Layouts',
    others: 'Fixed templates or paid theme packs',
    gridwiser: 'Full Theme Creator + public remix links',
  },
  {
    label: 'AI Schedule & Theme Generation',
    others: 'Paid AI credits / token subscriptions',
    gridwiser: 'Bring your own local LLM or free AI',
  },
  {
    label: 'Multi-Device Cloud Sync',
    others: 'Local-only or paid sync tier',
    gridwiser: 'Instant Google-synced access everywhere',
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03050A] text-zinc-200">
      {/* Layered Atmospheric Glow + Subtle Dot Matrix */}
      <div
        className="pointer-events-none fixed inset-0 opacity-55"
        style={{
          background:
            'radial-gradient(ellipse 80% 45% at 50% -12%, rgba(37, 99, 235, 0.42) 0%, rgba(79, 70, 229, 0.16) 45%, transparent 75%)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#03050A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
          <Link href="/" className="transition hover:opacity-85">
            <GridWiseBrand size="md" tone="dark" />
          </Link>
          <div className="flex items-center gap-2">
            <a
              href="https://agnel.is-a.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white sm:inline-flex"
            >
              Portfolio
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#050811] shadow-sm transition hover:bg-zinc-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Open Studio
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-300 shadow-sm">
            <GraduationCap className="h-3.5 w-3.5" />
            Built by a Student, for Students
          </div>
          <h1 className="mt-5 bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl sm:leading-[1.12]">
            Great timetables shouldn&apos;t sit behind a paywall.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            GridWiser was created so every student can design, sync, customize, and share their weekly
            schedule without subscriptions, pricey custom-theme fees, or locked-in AI upsells.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#050811] shadow-lg transition hover:bg-zinc-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Launch Timetable Studio
            </Link>
            <a
              href="https://agnel.is-a.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.1]"
            >
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              Creator Portfolio
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        {/* Core Pillars Bento */}
        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080B12]/90 p-6 backdrop-blur-sm transition hover:border-white/[0.18] hover:bg-[#0B101B]"
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${item.glow}`}
                />
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${item.badgeBg}`}
                >
                  <Icon className={`h-5 w-5 ${item.accent}`} />
                </div>
                <h2 className="mt-4 text-base font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                  {item.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* Comparison Table Card */}
        <section className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070A11]/95 shadow-2xl">
          <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-white sm:text-base">
              Why Students Switch to GridWiser
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Everything essential unlocked from day one—no credit card, no artificial limits.
            </p>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {COMPARISON_ROWS.map((row) => (
              <div
                key={row.label}
                className="grid gap-2 px-5 py-3.5 sm:grid-cols-[1.2fr_1fr_1fr] sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="text-xs font-medium text-zinc-200">{row.label}</div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <X className="h-3.5 w-3.5 shrink-0 text-rose-400/70" />
                  <span>{row.others}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span>{row.gridwiser}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Creator Spotlight */}
        <section className="mt-10 overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[#0F172E] via-[#090D18] to-[#06070B] p-6 shadow-2xl sm:p-8 lg:p-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-zinc-300">
                <Heart className="h-3 w-3 text-rose-400" />
                The Creator Behind GridWiser
              </div>

              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/25 to-indigo-500/20 font-mono text-sm font-bold text-white shadow-inner">
                  AF
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Agnel Francis Olakkengil
                  </h2>
                  <p className="font-mono text-[11px] text-blue-400 sm:text-xs">
                    Student Developer · Designer · Builder
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-zinc-300">
                &ldquo;I built GridWiser because as a student, I was tired of timetable apps that
                charge monthly fees just to export a clean PDF, sync across devices, or customize how
                your own schedule looks. You shouldn&apos;t have to spend money paying someone for a
                custom theme or extra AI credits—with GridWiser, you can use your own local AI or
                any model you like, customize every pixel yourself, and share your creations freely
                with classmates.&rdquo;
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="https://agnel.is-a.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#050811] shadow-lg transition hover:bg-zinc-200"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Visit agnel.is-a.dev
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <Link
                  href="/theme-creator"
                  className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.1] lg:inline-flex"
                >
                  <Palette className="h-3.5 w-3.5 text-blue-400" />
                  Try Theme Creator
                </Link>
              </div>
            </div>

            {/* Right-side compact highlight stack */}
            <div className="grid shrink-0 grid-cols-2 gap-3 sm:w-auto lg:w-72">
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 backdrop-blur-sm">
                <div className="text-xl font-bold text-white">100%</div>
                <div className="mt-1 text-[11px] text-zinc-400">Free for students, no paywalls</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 backdrop-blur-sm">
                <div className="text-xl font-bold text-blue-400">BYO AI</div>
                <div className="mt-1 text-[11px] text-zinc-400">Works with local &amp; cloud LLMs</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 backdrop-blur-sm">
                <div className="text-xl font-bold text-violet-400">Sync</div>
                <div className="mt-1 text-[11px] text-zinc-400">Multi-device cloud storage</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-xl font-bold text-emerald-400">
                  <Share2 className="h-4 w-4" />
                  Remix
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">Share &amp; save custom themes</div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Footer Note */}
        <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-6 text-xs text-zinc-500 sm:flex-row">
          <p>Made with care by Agnel Francis Olakkengil for students everywhere.</p>
          <div className="flex items-center gap-5">
            <a
              href="https://agnel.is-a.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 transition hover:text-white"
            >
              agnel.is-a.dev
            </a>
            <Link href="/legal" className="transition hover:text-zinc-300">
              Terms &amp; Privacy
            </Link>
            <Link href="/" className="transition hover:text-zinc-300">
              Open Studio
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
