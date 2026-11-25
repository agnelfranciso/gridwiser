'use client';

import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import { X, AlertCircle, ShieldCheck } from 'lucide-react';
import { auth, formatFirebaseAuthError, googleProvider, type AuthErrorInfo } from '@/lib/firebase';
import { upsertUserProfile } from '@/lib/firestore-timetables';
import { GridWiseBrand } from '@/components/GridWiseLogo';
import {
  AnimatedModalShell,
  SPRING_PILL,
  TRANSITION_FAST,
} from '@/components/MotionPrimitives';

interface AuthModalProps {
  open: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({
  open,
  initialMode = 'signin',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthErrorInfo | null>(null);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        await upsertUserProfile(cred.user);
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedModalShell open={open} onClose={onClose} zIndexClass="z-50">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#242632] bg-[#0B0D12] shadow-[0_32px_90px_-20px_rgba(0,0,0,0.95)]">
        {/* Subtle top cobalt aura */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{
            background:
              'radial-gradient(90% 100% at 50% 0%, rgba(37, 99, 235, 0.28) 0%, transparent 100%)',
          }}
        />

        <div className="relative p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <GridWiseBrand size="md" tone="dark" />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sign In / Sign Up Switcher with shared pill indicator */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-[#20232D] bg-[#07080B] p-1">
            {(['signin', 'signup'] as const).map((tab) => {
              const active = mode === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setMode(tab);
                    setError(null);
                  }}
                  className={`relative rounded-lg py-2 text-xs font-medium transition-colors ${
                    active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="auth-mode-pill"
                      transition={SPRING_PILL}
                      className="absolute inset-0 rounded-lg bg-[#171A23] shadow-sm"
                    />
                  )}
                  <span className="relative z-10">
                    {tab === 'signin' ? 'Sign In' : 'Create Account'}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={TRANSITION_FAST}
              className="mt-6"
            >
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {mode === 'signin' ? 'Welcome back' : 'Create your GridWise account'}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                {mode === 'signin'
                  ? 'Sign in with Google to access your saved timetables and cloud sync across devices.'
                  : 'Continue with your Google account to save schedules to the cloud and create shareable links.'}
              </p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={TRANSITION_FAST}
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="font-semibold text-rose-100">{error.title}</div>
                  <div className="text-rose-200/90">{error.message}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Login Button (Only Login Method) */}
          <motion.button
            type="button"
            disabled={loading}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={handleGoogleAuth}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#09090B] shadow-lg transition hover:bg-zinc-100 disabled:opacity-60"
          >
            <GoogleSvg />
            {loading
              ? 'Connecting to Google...'
              : mode === 'signin'
                ? 'Sign in with Google'
                : 'Sign up with Google'}
          </motion.button>

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>Secured by Firebase Authentication · Google OAuth only</span>
          </div>
        </div>
      </div>
    </AnimatedModalShell>
  );
}

function GoogleSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}
