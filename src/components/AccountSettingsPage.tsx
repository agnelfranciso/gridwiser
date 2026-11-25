'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Download,
  Trash2,
  UserX,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { auth, formatFirebaseAuthError, googleProvider } from '@/lib/firebase';
import {
  deleteAllUserContent,
  deleteUserProfileDoc,
  exportAllUserTimetables,
  listUserTimetables,
} from '@/lib/firestore-timetables';
import { GridWiseBrand, GridWiseLogoMark } from '@/components/GridWiseLogo';
import {
  AnimatedModalShell,
  EASE_SMOOTH,
  TRANSITION_FAST,
} from '@/components/MotionPrimitives';

export function AccountSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [scheduleCount, setScheduleCount] = useState<number>(0);

  const [busyAction, setBusyAction] = useState<
    'export' | 'delete-content' | 'delete-account' | null
  >(null);
  const [confirmDeleteContent, setConfirmDeleteContent] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [statusMsg, setStatusMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!firebaseUser) {
          router.replace('/signin?next=/account');
          return;
        }
        setUser(firebaseUser);
        setAuthChecked(true);
        try {
          const items = await listUserTimetables(firebaseUser.uid);
          setScheduleCount(items.length);
        } catch {
          // ignore initial count error
        }
      },
      () => {
        router.replace('/signin');
      }
    );
    return () => unsub();
  }, [router]);

  const handleExportAllData = async () => {
    if (!user) return;
    setBusyAction('export');
    setStatusMsg(null);
    try {
      const records = await exportAllUserTimetables(user.uid);
      const payload = {
        exportedAt: new Date().toISOString(),
        account: {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
        timetables: records,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'gridwiser-account-backup.json';
      link.click();
      URL.revokeObjectURL(url);
      setStatusMsg({
        type: 'ok',
        text: `Downloaded backup of ${records.length} saved schedule${records.length === 1 ? '' : 's'}.`,
      });
    } catch {
      setStatusMsg({
        type: 'err',
        text: 'Could not export your saved schedules. Please try again.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteAllContent = async () => {
    if (!user) return;
    setBusyAction('delete-content');
    setStatusMsg(null);
    try {
      const count = await deleteAllUserContent(user.uid);
      setScheduleCount(0);
      setConfirmDeleteContent(false);
      setStatusMsg({
        type: 'ok',
        text: `Deleted ${count} saved schedule${count === 1 ? '' : 's'} and any associated share links.`,
      });
    } catch {
      setStatusMsg({
        type: 'err',
        text: 'Failed to delete saved content. Please try again.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
    setBusyAction('delete-account');
    setStatusMsg(null);
    try {
      await deleteAllUserContent(user.uid);
      await deleteUserProfileDoc(user.uid);

      try {
        await deleteUser(user);
      } catch (err: unknown) {
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code?: string }).code)
            : '';
        if (code === 'auth/requires-recent-login') {
          await reauthenticateWithPopup(user, googleProvider);
          await deleteUser(user);
        } else {
          throw err;
        }
      }

      router.replace('/');
    } catch (err: unknown) {
      const info = formatFirebaseAuthError(err);
      setStatusMsg({
        type: 'err',
        text: `${info.title}: ${info.message}`,
      });
      setBusyAction(null);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/');
  };

  if (!authChecked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03050A]">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <GridWiseLogoMark size={36} tone="dark" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#03050A] text-zinc-100">
      {/* Subtle cobalt aura */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 45% at 50% 0%, rgba(37, 99, 235, 0.28) 0%, rgba(3, 5, 10, 0) 75%)',
        }}
      />

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.06] bg-[#03050A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="transition hover:opacity-85">
            <GridWiseBrand size="md" tone="dark" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.12]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Studio
            </Link>
            <button
              type="button"
              onClick={() => setSignOutConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_SMOOTH }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Account Settings
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Manage your Google-connected profile, download your schedules, or remove your data.
            </p>
          </div>

          <AnimatePresence>
            {statusMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={TRANSITION_FAST}
                className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                  statusMsg.type === 'ok'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/35 bg-rose-500/10 text-rose-200'
                }`}
              >
                {statusMsg.type === 'ok' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                )}
                <span>{statusMsg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Card */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#080B12]/90 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? 'Profile'}
                    className="h-14 w-14 rounded-full border border-white/15 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/20 text-lg font-semibold text-blue-300">
                    {(user.displayName ?? user.email ?? 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {user.displayName || 'GridWiser User'}
                  </h2>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-300">
                    <Calendar className="h-3 w-3 text-blue-400" />
                    <span>
                      {scheduleCount} saved schedule{scheduleCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>

              <span className="self-start rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-300 sm:self-center">
                Connected via Google
              </span>
            </div>
          </section>

          {/* Data Export */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#080B12]/90 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-semibold text-white">Export Your Data</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Download a complete JSON backup of all your saved timetables and settings.
                </p>
              </div>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={handleExportAllData}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.12] disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {busyAction === 'export' ? 'Exporting...' : 'Download Backup (.JSON)'}
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-4 rounded-2xl border border-rose-500/25 bg-[#0C080D]/90 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Danger Zone
            </div>

            {/* Delete All Saved Content */}
            <div className="rounded-xl border border-white/[0.06] bg-black/25 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-sm font-medium text-white">Delete All Saved Content</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Permanently removes all {scheduleCount} saved timetable{scheduleCount === 1 ? '' : 's'} and revokes any public share links. Keeps your account active.
                  </p>
                </div>
                {!confirmDeleteContent ? (
                  <button
                    type="button"
                    disabled={busyAction !== null || scheduleCount === 0}
                    onClick={() => setConfirmDeleteContent(true)}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete All Schedules
                  </button>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteContent(false)}
                      className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={handleDeleteAllContent}
                      className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                    >
                      {busyAction === 'delete-content' ? 'Deleting...' : 'Confirm Delete All'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Delete Account */}
            <div className="rounded-xl border border-rose-500/20 bg-black/25 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-sm font-medium text-white">Delete Account Permanently</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Deletes your GridWiser profile, all saved timetables, share links, and disconnects your Google account. This cannot be undone.
                  </p>
                </div>
                {!confirmDeleteAccount && (
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => setConfirmDeleteAccount(true)}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-600/20 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-600/35 disabled:opacity-50"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Delete Account
                  </button>
                )}
              </div>

              {confirmDeleteAccount && (
                <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="flex-1 rounded-xl border border-rose-500/30 bg-[#07080D] px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-400"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteAccount(false);
                        setDeleteConfirmText('');
                      }}
                      className="rounded-lg px-3 py-2 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={
                        busyAction !== null ||
                        deleteConfirmText.trim().toUpperCase() !== 'DELETE'
                      }
                      onClick={handleDeleteAccount}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-40"
                    >
                      {busyAction === 'delete-account'
                        ? 'Deleting Account...'
                        : 'Permanently Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <p className="text-center text-[11px] text-zinc-500">
            Review our{' '}
            <Link href="/legal#privacy" className="text-zinc-400 underline hover:text-white">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/legal#terms" className="text-zinc-400 underline hover:text-white">
              Terms of Service
            </Link>
            .
          </p>
        </motion.div>
      </main>

      <AnimatedModalShell
        open={signOutConfirmOpen}
        onClose={() => setSignOutConfirmOpen(false)}
        zIndexClass="z-50"
      >
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-[#080B12] p-6 shadow-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-zinc-200">
            <LogOut className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            Sign out of GridWiser?
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            You&apos;ll be returned to the home page. All saved schedules remain safely stored in your account.
          </p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSignOutConfirmOpen(false)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setSignOutConfirmOpen(false);
                void handleSignOut();
              }}
              className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#050811] transition hover:bg-zinc-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </AnimatedModalShell>
    </div>
  );
}
