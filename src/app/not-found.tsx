import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { GridWiseLogoMark } from '@/components/GridWiseLogo';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050812] px-6 py-16 text-[#F0F6FF]">
      {/* Sapphire radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 55% at 50% 25%, rgba(37, 99, 235, 0.22) 0%, rgba(10, 17, 36, 0.45) 45%, #050812 85%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#1B2847] bg-[#0A1020]/90 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex items-center justify-center gap-2.5">
          <GridWiseLogoMark size={30} tone="dark" />
          <span className="text-sm font-semibold tracking-tight text-white">
            GridWiser
          </span>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#1B2847] bg-[#0F172A] px-3 py-1 font-mono text-[11px] font-medium tracking-wider text-[#60A5FA]">
          <Compass className="h-3.5 w-3.5" />
          ERROR 404
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Page not found
        </h1>

        <p className="mt-2.5 text-sm leading-relaxed text-[#8CA3CC]">
          The page or timetable you&apos;re looking for doesn&apos;t exist, may have been made private, or was moved.
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-[#050812] transition hover:bg-zinc-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to GridWiser
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-xl border border-[#1B2847] bg-[#0F172A] px-5 py-2.5 text-xs font-medium text-zinc-200 transition hover:border-[#2B3E6B] hover:text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
