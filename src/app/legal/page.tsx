import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, FileText, Scale, UserCheck } from 'lucide-react';
import { GridWiseBrand } from '@/components/GridWiseLogo';

export const metadata: Metadata = {
  title: 'Legal, Terms & Privacy – GridWise',
  description:
    'Terms of Service, Privacy Policy, and Data Controls for GridWise timetable studio.',
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#03050A] text-zinc-200">
      {/* Top ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.4) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.08] bg-[#03050A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="transition hover:opacity-85">
            <GridWiseBrand size="md" tone="dark" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to App
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-4xl px-5 py-10 sm:px-6 lg:py-14">
        {/* Title */}
        <div className="mb-10 border-b border-white/[0.08] pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <Scale className="h-3.5 w-3.5" />
            Transparency & User Control
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Terms of Service & Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
            Effective November 25, 2026 · Plain-language overview of how GridWise handles your schedules and account.
          </p>
        </div>

        {/* Quick Nav Badges */}
        <div className="mb-10 flex flex-wrap gap-2">
          <a
            href="#terms"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#090C13] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-blue-500/40 hover:text-white"
          >
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            Terms of Service
          </a>
          <a
            href="#privacy"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#090C13] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-blue-500/40 hover:text-white"
          >
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            Privacy & Local Processing
          </a>
          <a
            href="#security"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#090C13] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-blue-500/40 hover:text-white"
          >
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            Data Control & Deletion
          </a>
        </div>

        {/* Content Sections */}
        <div className="space-y-12 text-sm leading-relaxed text-zinc-300">
          {/* Terms Section */}
          <section id="terms" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">1. Terms of Service</h2>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.1 Using GridWise
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  GridWise provides a web-based timetable builder, preset design templates, and export tools (PNG, PDF, .ICS, .JSON, and .ZIP) for personal, academic, and organizational scheduling. By accessing or signing into GridWise, you agree to use the service lawfully and not attempt to disrupt, scrape, or abuse shared endpoints.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.2 Ownership of Your Schedules
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  You retain full ownership of all timetable titles, subjects, course codes, room locations, instructor names, and timings you enter. GridWise claims no intellectual property rights over your schedule data.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.3 Public Share Links
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  If you choose to click <strong>Share</strong>, GridWise creates a public, read-only snapshot of that timetable accessible to anyone who holds the generated URL. Your personal email address and Google display name are never included in public share snapshots. Deleting the schedule from your account automatically revokes its share link.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.4 Service Availability
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  GridWise is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We recommend keeping a local backup using the JSON export feature in Account Settings or the Studio toolbar.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy Policy */}
          <section id="privacy" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              2. Privacy & Client-Side Processing
            </h2>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  2.1 Information We Store When You Sign In
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  GridWise uses Google OAuth exclusively—we never ask for, process, or store passwords. When you sign in, we store:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  <li>
                    <strong className="text-zinc-200">Google Profile Basics:</strong> Your unique account ID, display name, email address, and profile avatar URL.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Saved Timetables:</strong> The subjects, timings, title, subtitle, selected design preset, and time-format preference you choose to save to your account.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  2.2 AI Import & File Exports Run Locally in Your Browser
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  When you use <strong>Import Using AI</strong>, GridWise copies a structured prompt for you to use in your own AI tool and parses the pasted JSON locally inside your browser. Your timetable images or PDFs are not uploaded to GridWise servers. Similarly, all PNG, PDF, .ICS, .JSON, and .ZIP exports are rendered 100% client-side on your device.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  2.3 Zero Ad Tracking or Data Selling
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  We do not sell, rent, or share your personal information or class schedules with advertisers or data brokers.
                </p>
              </div>
            </div>
          </section>

          {/* Security & Data Control */}
          <section id="security" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              3. Data Control & Account Deletion
            </h2>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  3.1 Private Account Isolation
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  Your saved schedules are isolated to your authenticated Google account and protected by server-enforced access rules so only you can read, modify, or delete your private timetables.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  3.2 Export, Wipe Content, or Delete Account Anytime
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  You have full self-serve control over your data from your{' '}
                  <Link href="/account" className="text-blue-400 underline hover:text-blue-300">
                    Account Settings
                  </Link>{' '}
                  page (accessible anytime by clicking your profile in the Studio sidebar):
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  <li>Download a complete JSON backup of all saved schedules.</li>
                  <li>Delete all saved timetables and revoke all public share links at once.</li>
                  <li>Permanently delete your GridWise profile and disconnect your Google account.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Actions */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-8">
          <p className="text-xs text-zinc-500">© 2026 GridWise Studio.</p>
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08]"
            >
              <UserCheck className="h-3.5 w-3.5 text-blue-400" />
              Account Settings
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#050811] transition hover:bg-zinc-200"
            >
              Return to Studio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
