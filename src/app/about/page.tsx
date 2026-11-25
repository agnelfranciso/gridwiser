import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Cpu,
  Globe,
  GraduationCap,
  Heart,
  Palette,
  Share2,
  Sparkles,
  Smartphone,
  Unlock,
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
    badgeBg: 'bg-emerald-500/10 border-emerald-500/25',
    title: 'Zero Paywalls for Students',
    description:
      'No "Pro" tiers locking away export formats, templates, or customization. Every layout, 3× Retina PNG, print-ready PDF, wallpaper, and .ICS feed is free out of the box.',
  },
  {
    icon: Smartphone,
    accent: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 border-blue-500/25',
    title: 'Multi-Device Connectivity',
    description:
      'Build on your laptop, tweak on your phone before class, and export lockscreen wallpapers anytime. Your schedules and custom themes stay synced across every device.',
  },
  {
    icon: Palette,
    accent: 'text-violet-400',
    badgeBg: 'bg-violet-500/10 border-violet-500/25',
    title: 'Deep Custom Theming & Sharing',
    description:
      'Craft your own timetable aesthetic down to every color token, font pairing, border radius, and layout engine—then share a public link so friends can add it to their account.',
  },
  {
    icon: Cpu,
    accent: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/25',
    title: 'Your Local or Preferred AI',
    description:
      'Never pay extra for bundled AI credits or custom theme commissions. Copy a structured prompt, run it with your own local model or favorite AI, and paste the JSON straight in.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#03050A] text-zinc-200">
      {/* Ambient Cobalt Glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-45"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -18%, rgba(37, 99, 235, 0.45) 0%, rgba(15, 23, 42, 0.15) 55%, transparent 75%)',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#03050A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="transition hover:opacity-85">
            <GridWiseBrand size="md" tone="dark" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/theme-creator"
              className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white sm:inline-flex"
            >
              <Palette className="h-3.5 w-3.5 text-blue-400" />
              Theme Creator
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#050811] transition hover:bg-zinc-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Studio
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-5 py-12 sm:px-6 lg:py-16">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-300">
            <GraduationCap className="h-3.5 w-3.5" />
            Built by a Student, for Students
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-5xl sm:leading-[1.12]">
            Great timetables shouldn&apos;t sit behind a paywall.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
            GridWiser was created so every student can design, sync, customize, and share their weekly
            schedule without subscriptions, pricey custom-theme fees, or locked-in AI upsells.
          </p>
        </section>

        {/* Why GridWiser Exists — Bento Pillars */}
        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080B12]/90 p-6 transition hover:border-white/[0.16] hover:bg-[#0B0F19]"
              >
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

        {/* Creator Spotlight */}
        <section className="mt-10 overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[#0D1324] via-[#090C14] to-[#06070B] p-6 shadow-2xl sm:p-8 lg:p-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-zinc-300">
                <Heart className="h-3 w-3 text-rose-400" />
                The Creator Behind GridWiser
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Agnel Francis Olakkengil
                </h2>
                <p className="mt-1 font-mono text-xs text-blue-400">
                  Student Developer · Designer · Builder
                </p>
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
                  Visit Portfolio (agnel.is-a.dev)
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <Link
                  href="/theme-creator"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.1]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  Try Theme Creator
                </Link>
              </div>
            </div>

            {/* Right-side compact highlight stack */}
            <div className="grid shrink-0 grid-cols-2 gap-3 sm:w-auto lg:w-72">
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4">
                <div className="text-xl font-bold text-white">100%</div>
                <div className="mt-1 text-[11px] text-zinc-400">Free for students, no paywalls</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4">
                <div className="text-xl font-bold text-blue-400">BYO AI</div>
                <div className="mt-1 text-[11px] text-zinc-400">Works with local &amp; cloud LLMs</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4">
                <div className="text-xl font-bold text-violet-400">Sync</div>
                <div className="mt-1 text-[11px] text-zinc-400">Multi-device cloud storage</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4">
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
