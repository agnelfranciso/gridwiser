'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signInWithPopup } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Download,
} from 'lucide-react';
import { auth, formatFirebaseAuthError, googleProvider, type AuthErrorInfo } from '@/lib/firebase';
import { upsertUserProfile } from '@/lib/firestore-timetables';
import { GridWiseBrand, GridWiseLogoMark } from '@/components/GridWiseLogo';
import { GoogleOneTap } from '@/components/GoogleOneTap';
import { EASE_SMOOTH, TRANSITION_FAST } from '@/components/MotionPrimitives';
import type { PresetTemplateId, SubjectEntry, TimetableMeta } from '@/types/timetable';
import { getPresetTemplate } from '@/lib/themes';

interface LoginGateProps {
  meta: TimetableMeta;
  subjects: SubjectEntry[];
  templateId: PresetTemplateId;
  onBack: () => void;
  onSuccess: () => void;
}

function GoogleSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
    </svg>
  );
}

export function LoginGate({ meta, subjects, templateId, onBack, onSuccess }: LoginGateProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthErrorInfo | null>(null);
  const [success, setSuccess] = useState(false);

  const template = getPresetTemplate(templateId);
  const totalSessions = subjects.reduce((n, s) => n + s.occurrences.length, 0);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        await upsertUserProfile(cred.user);
      }
      setSuccess(true);
      setTimeout(() => onSuccess(), 450);
    } catch (err: unknown) {
      setError(formatFirebaseAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#03050A] p-4 text-zinc-100 sm:p-8">
      <GoogleOneTap
        disabled={loading || success}
        onSuccess={() => {
          setSuccess(true);
          setTimeout(() => onSuccess(), 450);
        }}
        onError={(err) => setError(formatFirebaseAuthError(err))}
      />
      {/* Subtle outer cobalt ambient glow (no background grid) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(37, 99, 235, 0.16) 0%, rgba(3, 5, 10, 0) 75%)',
        }}
      />

      {/* Split Card Shell matching SignInPage & reference layout */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: EASE_SMOOTH }}
        className="relative z-10 grid w-full max-w-[1040px] overflow-hidden rounded-[26px] border border-white/[0.1] bg-[#080B12] p-2.5 shadow-[0_36px_100px_-24px_rgba(0,0,0,0.95)] lg:grid-cols-[1.08fr_1fr] lg:p-3"
      >
        {/* Left Atmospheric Cobalt Panel */}
        <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#04060C] p-6 sm:p-9 lg:min-h-[560px]">
          {/* Deep Cobalt-Sapphire Bottom Glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 95% 75% at 55% 84%, rgba(37, 99, 235, 0.72) 0%, rgba(29, 78, 216, 0.36) 38%, rgba(10, 22, 58, 0.16) 68%, transparent 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 60% 72%, rgba(96, 165, 250, 0.24) 0%, transparent 52%)',
            }}
          />

          {/* Top Bar inside Left Panel */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <GridWiseBrand size="md" tone="dark" />
          </div>

          {/* Bottom Headline & Draft Pill inside Left Panel */}
          <div className="relative z-10 mt-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11px] font-medium text-blue-100/90 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Draft Ready · {subjects.length} subjects · {totalSessions} sessions
            </div>

            <h2 className="text-3xl font-medium tracking-tight text-white sm:text-[38px] sm:leading-[1.1]">
              Your timetable is ready to save.
            </h2>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-blue-100/75 sm:text-[13px]">
              Sign in once with Google to save your entered classes to your account and unlock high-res PNG, PDF, and .ICS exports.
            </p>
          </div>
        </div>

        {/* Right Action Panel */}
        <div className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
          <div className="flex items-center justify-between">
            <GridWiseLogoMark size={28} tone="dark" />
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Onboarding
            </button>
          </div>

          <div className="my-auto py-8">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[26px]">
              Save & Generate
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Your onboarding schedule is preserved and will be saved automatically after sign-in.
            </p>

            {/* Draft Summary Fields matching reference layout */}
            <div className="mt-6 space-y-3">
              <div>
                <div className="mb-1.5 text-[11px] font-medium text-zinc-400">
                  Timetable Title
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0F131D] px-3.5 py-2.5 text-xs text-zinc-200">
                  <span className="truncate font-medium">
                    {meta.title || 'Untitled Timetable'}
                  </span>
                  <span className="ml-2 shrink-0 font-mono text-[11px] text-zinc-400">
                    {subjects.length} subjects
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-[11px] font-medium text-zinc-400">
                  Selected Design Preset
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0F131D] px-3.5 py-2.5 text-xs text-zinc-200">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: template.tokens.accent }}
                    />
                    {template.name}
                  </span>
                  <span className="text-[11px] text-zinc-400">{template.layoutLabel}</span>
                </div>
              </div>
            </div>

            {/* Error notice */}
            <AnimatePresence>
              {error && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={TRANSITION_FAST}
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3.5 text-xs text-rose-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-rose-100">{error.title}</span>
                      {error.code && (
                        <span className="font-mono text-[10px] text-rose-300/75">
                          {error.code}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed text-rose-200/90">{error.message}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary CTA */}
            <motion.button
              type="button"
              disabled={loading || success}
              whileHover={!loading && !success ? { y: -1 } : {}}
              whileTap={!loading && !success ? { scale: 0.985 } : {}}
              onClick={handleGoogleSignIn}
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-[#050811] shadow-lg transition hover:bg-zinc-200 disabled:opacity-60"
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.span
                    key="success"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Saving your timetable…
                  </motion.span>
                ) : (
                  <motion.span
                    key="normal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2.5"
                  >
                    <GoogleSvg />
                    {loading ? 'Connecting to Google…' : 'Sign in with Google & Save'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Bottom Capabilities & Legal */}
          <div className="space-y-3 border-t border-white/[0.08] pt-5">
            <div className="text-[11px] font-medium text-zinc-500">
              Included with your account
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-400" />
                Auto-Saved Draft
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                Shareable Links
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5 text-blue-400" />
                PNG · PDF · .ICS
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              By continuing, you agree to our{' '}
              <Link href="/legal#terms" className="text-zinc-400 underline underline-offset-2 hover:text-white">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/legal#privacy" className="text-zinc-400 underline underline-offset-2 hover:text-white">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
