import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Lock,
  FileText,
  Scale,
  UserCheck,
  Globe,
  AlertTriangle,
  Database,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { GridWiseBrand } from '@/components/GridWiseLogo';

export const metadata: Metadata = {
  title: 'Legal, Terms & Privacy – GridWiser',
  description:
    'Terms of Service, Privacy Policy (India DPDP Act, GDPR, CCPA/CPRA, and Google API Limited Use Disclosure), Acceptable Use Policy, and Security Disclosures for GridWiser.',
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
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#03050A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="transition hover:opacity-85">
            <GridWiseBrand size="md" tone="dark" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/about"
              className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white sm:inline-flex"
            >
              About
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-4xl px-5 py-10 sm:px-6 lg:py-14">
        {/* Title */}
        <div className="mb-8 border-b border-white/[0.08] pb-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <Scale className="h-3.5 w-3.5" />
            Legal Framework, Compliance &amp; User Rights
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Terms of Service &amp; Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
            Effective Date: November 26, 2026 · Last Updated: November 26, 2026 · Applies to GridWiser Studio, Exam Timetable Generator, Theme Creator, and Public Share Links.
          </p>
        </div>

        {/* Plain-Language Summary Box */}
        <section className="mb-8 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            In Plain English (Quick Summary)
          </div>
          <ul className="mt-3 grid gap-2 text-xs leading-relaxed text-zinc-300 sm:grid-cols-2">
            <li>• We store only your Google name, email, avatar, and the timetables/themes you save.</li>
            <li>• We use privacy-friendly, cookieless Vercel Web Analytics for aggregate traffic counts only.</li>
            <li>• We never sell your data, run ads, or train AI models on your schedules.</li>
            <li>• You can export all your data as JSON or delete your account anytime in Settings.</li>
          </ul>
        </section>

        {/* Quick Nav Badges */}
        <div className="mb-10 flex flex-wrap gap-2">
          <a
            href="#terms"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#090C13] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-blue-500/40 hover:text-white"
          >
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            1. Terms of Service
          </a>
          <a
            href="#privacy"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#090C13] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-blue-500/40 hover:text-white"
          >
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            2. Privacy &amp; Google OAuth
          </a>
          <a
            href="#rights"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#090C13] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-blue-500/40 hover:text-white"
          >
            <Globe className="h-3.5 w-3.5 text-violet-400" />
            3. Privacy Rights &amp; Retention
          </a>
          <a
            href="#security"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#090C13] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-blue-500/40 hover:text-white"
          >
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            4. Security &amp; Data Control
          </a>
          <a
            href="#liability"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#090C13] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-blue-500/40 hover:text-white"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            5. Liability &amp; Governing Law
          </a>
        </div>

        {/* Content Sections */}
        <div className="space-y-12 text-sm leading-relaxed text-zinc-300">
          {/* 1. Terms of Service */}
          <section id="terms" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">1. Terms of Service</h2>
            <div className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.1 Acceptance of Terms &amp; Age Eligibility
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  By accessing, signing into, or using GridWiser (&ldquo;the Service&rdquo;), operated by Agnel Francis Olakkengil (&ldquo;Operator&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to these Terms of Service and our Privacy Policy. Under India&apos;s Digital Personal Data Protection (DPDP) Act, 2023, individuals under 18 years of age are treated as children and require verifiable parent or guardian consent for personal data processing. Accordingly, you must be at least <strong>18 years old</strong> to create a cloud-synced account independently, or if you are between 13 and 17, you may only use cloud sign-in with your parent or legal guardian&apos;s consent and supervision.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.2 Open-Source Code &amp; Service Use
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  GridWiser&apos;s source code is publicly available under the <strong>MIT License</strong> (see the <code className="text-zinc-300">LICENSE</code> file in our GitHub repository). You are free to inspect, fork, and self-host the source code in accordance with the MIT License. Your use of our hosted instance at <code className="text-zinc-300">gridwiser.vercel.app</code> remains subject to the Acceptable Use rules below.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.3 User-Generated Content (Schedules, Exams &amp; Custom Themes)
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  You retain 100% ownership and all intellectual property rights in the timetable titles, subjects, exam schedules, course codes, rooms, timings, and custom theme configurations (&ldquo;User Content&rdquo;) you create or import. By saving or sharing User Content on GridWiser, you grant us a strictly limited, non-exclusive license to host, store, render, and—solely when you explicitly generate a public share link—display read-only snapshots of that content to operate the Service. You represent that your User Content does not infringe third-party rights or violate applicable laws.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.4 Public Share Links &amp; Theme Remixing Caveat
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  When you click <strong>Share</strong> on a class timetable or custom theme, GridWiser creates a public, read-only snapshot accessible to anyone holding that URL (<code className="text-zinc-300">/share/[id]</code> or <code className="text-zinc-300">/template/[id]</code>) until you delete or unpublish it. Your email address and private account credentials are never included in public snapshots. Please note that anyone who views a shared link before you delete it—or who saves a copy, exports an image/PDF, or adds a shared custom theme to their own account—keeps that copy independently. Exam timetables are always private and cannot be shared.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.5 Acceptable Use Policy (AUP)
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">When using our hosted Service, you agree not to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  <li>Attempt to bypass authentication, Firestore security rules, or access another user&apos;s private data.</li>
                  <li>Use automated bots or scrapers to harvest public snapshots or intentionally overload our hosting infrastructure.</li>
                  <li>Upload, store, or share unlawful, defamatory, harassing, or malicious payloads (such as script-injection attempts).</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.6 AI Prompting &amp; Imported Schedule Accuracy
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  GridWiser provides structured prompts and client-side JSON parsers so you can use external or local AI models to extract class/exam schedules or generate themes. Because AI outputs are probabilistic, GridWiser does not warrant the accuracy or completeness of any imported schedule. Always verify class times, exam dates, halls, and seat numbers against your institution&apos;s official records.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Privacy & Google OAuth */}
          <section id="privacy" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              2. Privacy Policy &amp; Google OAuth Disclosure
            </h2>
            <div className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  2.1 Data Controller &amp; Categories of Data Collected
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  GridWiser is operated by Agnel Francis Olakkengil. We collect only the minimum data needed to deliver multi-device sync:
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs">
                  <li>
                    <strong className="text-zinc-200">Authentication &amp; Profile Data (Google OAuth):</strong> Unique Firebase/Google UID, display name, verified email address, and profile avatar URL. We never collect or store passwords.
                  </li>
                  <li>
                    <strong className="text-zinc-200">User Content:</strong> Class timetables, exam schedules, subjects, timings, selected presets, and custom theme tokens you save to your account.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Cookieless Aggregate Analytics (Vercel Web Analytics):</strong> We run privacy-friendly, cookieless Vercel Web Analytics to measure aggregate page views, referrer domains, and device/country counts without tracking individual users, storing cookies, or collecting personal identifiers.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Infrastructure Logs:</strong> Transient HTTP request metadata (IP address, user-agent, timestamps) processed by our hosting and database providers for security and error diagnostics.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  2.2 Lawful Bases for Processing
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  We process your personal data based on: (a) <strong>Contractual Necessity</strong> (to authenticate your account, sync your timetables and custom themes, and generate share links you request); (b) <strong>Consent</strong> (when you choose to sign in with Google or publish a public snapshot); and (c) <strong>Legitimate Interests</strong> (maintaining platform security, reliability, and aggregate cookieless analytics).
                </p>
              </div>

              <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.06] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  2.3 Google API Services User Data Policy (Limited Use Disclosure)
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                  GridWiser&apos;s use and transfer of information received from Google APIs to any other app will adhere to the{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the Limited Use requirements. GridWiser does not use Google user data for targeted advertising, does not sell Google user data, and does not use Google user data to train AI or machine learning models.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  2.4 Client-Side Exports &amp; Local AI Processing
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  All exports (3× Retina PNG, Print-Ready PDF, Phone/Desktop Wallpapers, <code className="text-zinc-300">.ICS</code> calendar files, <code className="text-zinc-300">.JSON</code> backups, and <code className="text-zinc-300">.ZIP</code> archives) and AI JSON parsing execute 100% locally inside your browser. Your timetable screenshots or PDFs are never uploaded to GridWiser servers.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  2.5 Subprocessors
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  GridWiser relies on <strong>Google Firebase</strong> (Authentication and Cloud Firestore database storage) and <strong>Vercel</strong> (global web hosting and cookieless Web Analytics). Data is encrypted in transit via TLS and encrypted at rest by our cloud providers.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Global Privacy Rights & Retention */}
          <section id="rights" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              3. Privacy Rights &amp; Data Retention
            </h2>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  3.1 Your Rights (India DPDP Act, GDPR &amp; CCPA/CPRA)
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  Regardless of where you live, GridWiser extends these rights to all users:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  <li><strong className="text-zinc-200">Access &amp; Portability:</strong> View all saved schedules and custom themes, or download a complete <code className="text-zinc-300">.JSON</code> export anytime.</li>
                  <li><strong className="text-zinc-200">Correction:</strong> Edit any timetable, exam entry, or custom theme directly in the Studio.</li>
                  <li><strong className="text-zinc-200">Erasure:</strong> Delete individual items, wipe all schedules, or permanently delete your entire account self-serve.</li>
                  <li><strong className="text-zinc-200">No Selling or Ad Sharing:</strong> GridWiser does not sell or share your personal information for advertising.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  3.2 Retention &amp; Backups After Deletion
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  We keep your profile, saved schedules, and custom themes only while your account is active or until you delete them. When you delete your account in <Link href="/account" className="text-blue-400 underline hover:text-blue-300">Account Settings</Link>, your active Firestore profile, private subcollections, and public share snapshots are removed immediately. However, automated disaster-recovery backups and transient infrastructure logs at Firebase/Google Cloud and Vercel may retain encrypted copies briefly before automatically rolling off.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Security & Data Control */}
          <section id="security" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              4. Security Architecture &amp; Vulnerability Reporting
            </h2>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  4.1 Server-Enforced Isolation &amp; Self-Serve Controls
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  Your private timetables, exam schedules, and custom templates are isolated under your authenticated UID and enforced server-side by Cloud Firestore Security Rules. Public share collections disallow collection-wide listing (<code className="text-zinc-300">allow list: if false</code>) and exclude PII. You can export a full JSON backup, wipe all timetables, or delete your account anytime in{' '}
                  <Link href="/account" className="text-blue-400 underline hover:text-blue-300">
                    Account Settings
                  </Link>
                  .
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  4.2 Reporting Security Issues
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  If you discover a security vulnerability, Firestore rule bypass, or privacy issue, please report it responsibly to{' '}
                  <a
                    href="mailto:agnelfrancis2007@hotmail.com?subject=GridWiser%20Security%20Report"
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    agnelfrancis2007@hotmail.com
                  </a>{' '}
                  before disclosing it publicly. We aim to acknowledge security reports within 48 hours.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Disclaimers, Limitation of Liability & Governing Law */}
          <section id="liability" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              5. Disclaimers, Limitation of Liability &amp; Governing Law
            </h2>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  5.1 Disclaimer of Warranties
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  To the maximum extent permitted by applicable law, GridWiser is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong> without warranties of any kind—express, implied, or statutory—including implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee uninterrupted availability or zero data loss, and recommend keeping periodic local JSON backups.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  5.2 Limitation of Liability
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  To the maximum extent permitted by law, neither GridWiser nor its Operator shall be liable for any indirect, incidental, special, consequential, or punitive damages—including missed classes, missed exams, or lost data—arising from your use of the Service. Because GridWiser is provided free of charge, our total aggregate liability for any claim shall not exceed the greater of the amount you paid to use the Service in the preceding 12 months or ten U.S. dollars (US$10), except where prohibited by mandatory consumer law.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  5.3 Governing Law &amp; Jurisdiction
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  These Terms and any disputes arising out of or relating to GridWiser are governed by the <strong>laws of India</strong>, without regard to conflict-of-law principles, and shall be subject to the exclusive jurisdiction of the courts in <strong>Thrissur, Kerala, India</strong>.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  5.4 Privacy Requests, Takedowns &amp; Contact
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  For privacy inquiries, data deletion requests, takedown notices, or general legal questions, email{' '}
                  <a
                    href="mailto:agnelfrancis2007@hotmail.com"
                    className="inline-flex items-center gap-1 text-blue-400 underline hover:text-blue-300"
                  >
                    <Mail className="h-3 w-3" />
                    agnelfrancis2007@hotmail.com
                  </a>
                  . We aim to respond to all privacy and takedown requests within <strong>7 business days</strong>.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Actions */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-8">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Database className="h-3.5 w-3.5 text-zinc-600" />
            <span>© 2026 GridWiser Studio · Built by Agnel Francis Olakkengil.</span>
          </div>
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
