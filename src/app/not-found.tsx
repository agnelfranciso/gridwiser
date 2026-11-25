import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Sparkles } from 'lucide-react';
import { GridWiseBrand } from '@/components/GridWiseLogo';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#03050A] px-6 py-8 text-[#F0F6FF] sm:px-10">
      {/* Subtle architectural dot-grid + cobalt atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(96, 165, 250, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(75% 55% at 50% 35%, rgba(37, 99, 235, 0.22) 0%, rgba(10, 17, 36, 0.45) 48%, #03050A 86%)',
        }}
      />

      {/* Top Navigation */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/" className="transition hover:opacity-90">
          <GridWiseBrand size="md" tone="dark" />
        </Link>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-zinc-400">
          HTTP · 404
        </span>
      </header>

      {/* Center Bento Showcase */}
      <section className="relative z-10 mx-auto my-12 w-full max-w-3xl">
        <div className="overflow-hidden rounded-[26px] border border-white/[0.1] bg-[#080B12]/90 p-3 shadow-[0_36px_100px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[1.05fr_1fr]">
            {/* Left Sapphire Display Panel */}
            <div
              className="relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#04060C] p-7 sm:p-8"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse 95% 80% at 50% 95%, rgba(37, 99, 235, 0.52) 0%, rgba(29, 78, 216, 0.18) 48%, transparent 100%)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-500/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-blue-300">
                  <Sparkles className="h-3 w-3" />
                  Missing Grid
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  slot://null
                </span>
              </div>

              <div className="my-8 select-none">
                <div className="bg-gradient-to-b from-blue-200 via-blue-400 to-blue-600 bg-clip-text text-7xl font-extrabold tracking-tighter text-transparent sm:text-8xl">
                  404
                </div>
                <p className="mt-2 font-mono text-xs text-blue-200/70">
                  timetable_not_found
                </p>
              </div>

              {/* Mini schedule skeleton */}
              <div className="grid grid-cols-3 gap-2 opacity-80">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="h-1.5 w-8 rounded-full bg-zinc-700" />
                  <div className="mt-2 h-2 w-12 rounded-full bg-zinc-500/60" />
                </div>
                <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-2.5">
                  <div className="h-1.5 w-8 rounded-full bg-blue-400/70" />
                  <div className="mt-2 h-2 w-14 rounded-full bg-blue-300/60" />
                </div>
                <div className="rounded-lg border border-dashed border-white/15 bg-transparent p-2.5">
                  <div className="h-1.5 w-6 rounded-full bg-zinc-800" />
                  <div className="mt-2 h-2 w-10 rounded-full bg-zinc-800" />
                </div>
              </div>
            </div>

            {/* Right Action Panel */}
            <div className="flex flex-col justify-between rounded-[18px] bg-[#0A0D15] p-7 sm:p-8">
              <div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-blue-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
                  This schedule slot is empty.
                </h1>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
                  The page or shared timetable you&apos;re looking for doesn&apos;t exist, was made private by its owner, or moved to a new URL.
                </p>
              </div>

              <div className="mt-8 space-y-2.5">
                <Link
                  href="/"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-[#050812] transition hover:bg-zinc-200"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to GridWiser Studio
                </Link>
                <Link
                  href="/signin"
                  className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Sign In to Your Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between text-[11px] text-zinc-600">
        <span>GridWiser Timetable Studio</span>
        <Link href="/legal" className="transition hover:text-zinc-400">
          Terms &amp; Privacy
        </Link>
      </footer>
    </main>
  );
}
