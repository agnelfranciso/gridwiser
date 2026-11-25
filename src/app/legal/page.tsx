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
} from 'lucide-react';
import { GridWiseBrand } from '@/components/GridWiseLogo';

export const metadata: Metadata = {
  title: 'Legal, Terms & Privacy – GridWiser',
  description:
    'Comprehensive Terms of Service, Privacy Policy (GDPR, CCPA/CPRA, DPDP, and Google API Limited Use Disclosure), Acceptable Use Policy, and Security Disclosures for GridWiser.',
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
        <div className="mb-10 border-b border-white/[0.08] pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <Scale className="h-3.5 w-3.5" />
            Legal Framework, Compliance &amp; User Rights
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Terms of Service &amp; Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
            Effective Date: November 25, 2026 · Last Updated: November 25, 2026 · Applies to GridWiser Studio, Theme Creator, and Public Share Links.
          </p>
        </div>

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
            3. Global Privacy Rights
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
            5. Liability &amp; Governing Terms
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
                  1.1 Acceptance of Terms &amp; Eligibility
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  By accessing, browsing, signing into, or using GridWiser (&ldquo;the Service&rdquo;), operated by Agnel Francis Olakkengil (&ldquo;Operator&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to be bound by these Terms of Service and our Privacy Policy. You must be at least 13 years of age (or the minimum age of digital consent in your jurisdiction) to create an account or use cloud-sync features. If you do not agree to these Terms, please discontinue use of the Service.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.2 License Grant &amp; Platform Intellectual Property
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  Subject to your compliance with these Terms, we grant you a limited, personal, non-exclusive, non-transferable, revocable, royalty-free license to access and use GridWiser for personal, academic, and organizational scheduling. All underlying source code, user interface layouts, preset design templates, typography pairings, trademarks, and branding remain the exclusive intellectual property of GridWiser and its Operator.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.3 User-Generated Content (Schedules &amp; Custom Themes)
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  You retain 100% ownership and all intellectual property rights in the timetable titles, subject names, course codes, room numbers, instructor names, timings, and custom theme configurations (&ldquo;User Content&rdquo;) you create or import. By saving or sharing User Content on GridWiser, you grant us a strictly limited, worldwide, non-exclusive license to host, store, process, render, and—solely when you explicitly generate a public share link—display read-only snapshots of that content to operate the Service. You represent and warrant that your User Content does not infringe third-party rights or violate applicable laws.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.4 Public Share Links &amp; Theme Remixing
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  When you click <strong>Share</strong> on a timetable or custom theme, GridWiser creates a public, read-only snapshot accessible to anyone holding the generated unguessable URL (<code className="text-zinc-300">/share/[id]</code> or <code className="text-zinc-300">/template/[id]</code>). Your personal email address and private account credentials are never exposed in public share snapshots. Other users who view a shared custom theme may save a copy to their own account or remix it. Deleting a schedule or unpublishing a share link immediately revokes public access.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.5 Acceptable Use Policy (AUP)
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">You agree not to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  <li>Attempt to bypass authentication, Firestore security rules, rate limits, or access another user&apos;s private data.</li>
                  <li>Use automated bots, scrapers, or crawlers to harvest shared snapshots or overload our infrastructure.</li>
                  <li>Upload, store, or share unlawful, defamatory, harassing, or malicious payloads (including XSS or script-injection attempts).</li>
                  <li>Reverse-engineer, decompile, or resell the GridWiser platform as a competing commercial SaaS without written permission.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  1.6 AI Prompting &amp; Imported Schedule Accuracy
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  GridWiser provides structured prompts and client-side JSON parsers so you can use external or local AI models to extract schedules or generate custom themes. Because third-party and local AI outputs are probabilistic, GridWiser does not warrant the accuracy, completeness, or conflict-free status of any imported schedule. You are solely responsible for verifying class times, rooms, and exam dates against your institution&apos;s official records.
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
                  GridWiser acts as the Data Controller for account-level information. We collect only the minimum data necessary to deliver multi-device synchronization:
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs">
                  <li>
                    <strong className="text-zinc-200">Authentication &amp; Profile Data (Google OAuth):</strong> Unique Firebase/Google UID, display name, verified email address, and profile avatar URL. We never collect or store passwords.
                  </li>
                  <li>
                    <strong className="text-zinc-200">User Content:</strong> Timetables, subjects, timings, selected layout presets, and custom theme tokens you explicitly save to your account.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Essential Infrastructure &amp; Security Logs:</strong> Standard HTTP request metadata (IP address, browser user-agent, timestamps) processed transiently by our hosting and database providers for DDoS mitigation, error diagnostics, and abuse prevention.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  2.2 Lawful Bases for Processing (GDPR Article 6)
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  Where European Economic Area (EEA) or UK data protection law applies, we process personal data under: (a) <strong>Performance of a Contract</strong> (to authenticate you, sync your timetables, and generate share links at your request); (b) <strong>Legitimate Interests</strong> (to secure our platform, prevent abuse, and maintain reliability); and (c) <strong>Consent</strong> (where you voluntarily publish a public snapshot or sign in with Google).
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
                  , including the Limited Use requirements. Specifically, GridWiser does not use Google user data for targeted advertising, does not sell Google user data to data brokers, and does not use Google user data to train generalized AI or machine learning models.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  2.4 Client-Side Processing, Local AI &amp; Zero Ad Tracking
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  All exports (3× Retina PNG, Print-Ready PDF, Phone/Desktop Wallpapers, <code className="text-zinc-300">.ICS</code> calendar files, <code className="text-zinc-300">.JSON</code> backups, and <code className="text-zinc-300">.ZIP</code> archives) and AI JSON parsing execute 100% locally inside your browser. Your timetable screenshots or PDFs are never uploaded to GridWiser servers. We do not use third-party advertising cookies, cross-site tracking pixels, or behavioral profiling.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  2.5 Subprocessors &amp; International Data Transfers
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  To operate the Service reliably, we rely on vetted cloud subprocessors: <strong>Google Firebase</strong> (Authentication and Cloud Firestore database storage) and <strong>Vercel</strong> (global edge web hosting and delivery). Data is encrypted in transit via TLS 1.2+ and encrypted at rest by Google Cloud infrastructure. Where data is transferred internationally, subprocessors rely on Standard Contractual Clauses (SCCs) or equivalent adequacy safeguards.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Global Privacy Rights */}
          <section id="rights" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              3. Global Privacy Rights (GDPR, CCPA/CPRA &amp; DPDP)
            </h2>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  3.1 Your Rights Regardless of Location
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  Whether you are protected under the EU/UK GDPR, California CCPA/CPRA, India&apos;s Digital Personal Data Protection (DPDP) Act, or other regional privacy frameworks, GridWiser extends the following rights to all users:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  <li><strong className="text-zinc-200">Right to Access &amp; Portability:</strong> View all stored schedules and custom themes, or download a complete machine-readable <code className="text-zinc-300">.JSON</code> export anytime.</li>
                  <li><strong className="text-zinc-200">Right to Rectification:</strong> Edit your timetable entries, metadata, and custom themes directly in the Studio.</li>
                  <li><strong className="text-zinc-200">Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Delete individual timetables, wipe all schedules, or permanently delete your entire account and profile self-serve.</li>
                  <li><strong className="text-zinc-200">Right to Non-Discrimination:</strong> We will never deny service or degrade functionality for exercising your privacy rights.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  3.2 Do Not Sell or Share Personal Information (CCPA/CPRA)
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  GridWiser does <strong>not</strong> sell your personal information and does <strong>not</strong> share your personal information with third parties for cross-context behavioral advertising.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  3.3 Data Retention
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  We retain your profile, saved schedules, and custom themes only for as long as your account remains active or until you delete them. When you delete your account in <Link href="/account" className="text-blue-400 underline hover:text-blue-300">Account Settings</Link>, your user profile, private subcollections, and associated public share snapshots are purged from active Firestore storage.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Security & Data Control */}
          <section id="security" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              4. Security Architecture &amp; Self-Serve Data Control
            </h2>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  4.1 Server-Enforced Isolation &amp; Schema Validation
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  Your private timetables and custom templates are isolated under your authenticated UID and enforced server-side by strict Cloud Firestore Security Rules. Public share collections disallow collection-wide listing (<code className="text-zinc-300">allow list: if false</code>) and strictly reject extraneous fields or personally identifiable information. While we apply industry-standard safeguards, no internet transmission is 100% immune to risk; we recommend keeping periodic local JSON backups of critical schedules.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  4.2 Self-Serve Controls
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  Manage your data anytime from{' '}
                  <Link href="/account" className="text-blue-400 underline hover:text-blue-300">
                    Account Settings
                  </Link>
                  :
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  <li>Export a complete JSON archive of all saved schedules.</li>
                  <li>Delete all saved timetables and revoke all public share links in one action.</li>
                  <li>Permanently delete your GridWiser profile and disconnect your Google account.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. Disclaimers, Limitation of Liability & Governing Terms */}
          <section id="liability" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              5. Disclaimers, Limitation of Liability &amp; Governing Terms
            </h2>
            <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#090B10] p-5 text-zinc-400 sm:p-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  5.1 Disclaimer of Warranties
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GRIDWISER IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF DATA LOSS.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  5.2 Limitation of Liability
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL GRIDWISER OR ITS OPERATOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES (INCLUDING MISSED CLASSES, MISSED EXAMS, LOST DATA, OR LOSS OF GOODWILL) ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. BECAUSE GRIDWISER IS PROVIDED FREE OF CHARGE, OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID TO USE THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM OR TEN U.S. DOLLARS ($10 USD), EXCEPT WHERE PROHIBITED BY MANDATORY CONSUMER LAW.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  5.3 Indemnification
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  You agree to indemnify and hold harmless GridWiser and its Operator from any third-party claims, damages, or expenses arising out of your violation of these Terms, your misuse of the Service, or any infringing or unlawful User Content you publicly share.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  5.4 Changes, Severability &amp; Contact
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  We may update these Terms or Privacy Policy as GridWiser evolves; material changes will update the &ldquo;Last Updated&rdquo; date above. If any provision is held unenforceable, the remaining provisions remain in full force. For privacy inquiries, takedown requests, or legal notices, contact the Operator via{' '}
                  <a
                    href="https://agnel.is-a.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    agnel.is-a.dev
                  </a>
                  .
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
