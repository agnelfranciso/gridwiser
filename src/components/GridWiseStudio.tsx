'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import { toPng } from 'html-to-image';
import {
  LayoutGrid,
  Calendar,
  FolderOpen,
  Palette,
  Download,
  CalendarPlus,
  Printer,
  FileJson,
  Save,
  Share2,
  Check,
  AlertCircle,
  ExternalLink,
  Trash2,
  X,
  RotateCcw,
  LogOut,
  LogIn,
  Monitor,
  Smartphone,
  Undo2,
  Redo2,
  Lock,
  Globe,
  Copy,
  ChevronDown,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import {
  ALL_DAYS,
  type DayOfWeek,
  type PresetTemplateId,
  type SavedTimetableRecord,
  type SavedTimetableSummary,
  type ScheduledBlock,
  type SubjectEntry,
  type TimetableMeta,
} from '@/types/timetable';
import { auth, formatFirebaseAuthError } from '@/lib/firebase';
import {
  deleteUserTimetable,
  getUserTimetable,
  listUserTimetables,
  publishSharedTimetable,
  saveUserTimetable,
  unpublishSharedTimetable,
  upsertUserProfile,
} from '@/lib/firestore-timetables';
import { getPresetTemplate, PRESET_TEMPLATES } from '@/lib/themes';
import {
  exportTimetableWallpaper,
  type WallpaperFormat,
} from '@/lib/wallpaper-export';
import {
  analyzeSchedule,
  generateICSFromSubjects,
  markOccurrencesAsMerged,
} from '@/lib/schedule-engine';
import { SubjectEntryBuilder } from '@/components/SubjectEntryBuilder';
import { TimetableRenderer } from '@/components/TimetableRenderer';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { WelcomeLanding } from '@/components/WelcomeLanding';
import { ImportAiModal } from '@/components/ImportAiModal';
import { OverlapAlertModal } from '@/components/OverlapAlertModal';
import { AuthModal } from '@/components/AuthModal';
import { LoginGate } from '@/components/LoginGate';
import { GridWiseBrand, GridWiseLogoMark } from '@/components/GridWiseLogo';
import { GoogleOneTap } from '@/components/GoogleOneTap';
import {
  AiImportButton,
  AnimatedModalShell,
  SPRING_PILL,
  TRANSITION_FAST,
  TRANSITION_VIEW,
} from '@/components/MotionPrimitives';

type ViewMode = 'welcome' | 'onboarding' | 'studio' | 'login-gate';
type StudioNav = 'subjects' | 'templates' | 'timetable' | 'saved';

interface GridWiseStudioProps {
  initialRecord?: SavedTimetableRecord | null;
}

export function GridWiseStudio({ initialRecord }: GridWiseStudioProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(!initialRecord);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const [viewMode, setViewMode] = useState<ViewMode>(
    initialRecord ? 'studio' : 'welcome'
  );
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [activeNav, setActiveNav] = useState<StudioNav>(
    initialRecord ? 'timetable' : 'subjects'
  );

  // Clean empty initial state (no demo values)
  const [meta, setMeta] = useState<TimetableMeta>(
    initialRecord?.meta ?? {
      title: '',
      subtitle: '',
      timeFormat: '24h',
      showWeekend: false,
    }
  );
  const [subjects, setSubjects] = useState<SubjectEntry[]>(
    initialRecord?.subjects ?? []
  );
  const [templateId, setTemplateId] = useState<PresetTemplateId>(
    initialRecord?.templateId ?? 'cron-studio'
  );

  const [savedId, setSavedId] = useState<string | null>(initialRecord?.id ?? null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedList, setSavedList] = useState<SavedTimetableSummary[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [overlapAlertOpen, setOverlapAlertOpen] = useState(false);

  const [editingBlock, setEditingBlock] = useState<ScheduledBlock | null>(null);
  const [editDay, setEditDay] = useState<DayOfWeek>('Mon');
  const [editStart, setEditStart] = useState('09:00');
  const [editEnd, setEditEnd] = useState('10:00');
  const [editRoom, setEditRoom] = useState('');
  const [editInstructor, setEditInstructor] = useState('');

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [activeDailyDay, setActiveDailyDay] = useState<DayOfWeek>('Mon');
  const [exportingAllDays, setExportingAllDays] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [exportingWallpaper, setExportingWallpaper] = useState<WallpaperFormat | null>(null);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const [mobileNoticeOpen, setMobileNoticeOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dailyExportRefs = useRef<Partial<Record<DayOfWeek, HTMLDivElement | null>>>({});
  const hasDraftSubjectsRef = useRef<boolean>(subjects.length > 0);
  const viewModeRef = useRef<ViewMode>(initialRecord ? 'studio' : 'welcome');
  // Stable refs so onAuthStateChanged & keyboard shortcuts can read latest state
  const metaRef = useRef(meta);
  const subjectsRef = useRef(subjects);
  const templateIdRef = useRef(templateId);
  const undoStackRef = useRef<
    Array<{ meta: TimetableMeta; subjects: SubjectEntry[]; templateId: PresetTemplateId }>
  >([]);
  const redoStackRef = useRef<
    Array<{ meta: TimetableMeta; subjects: SubjectEntry[]; templateId: PresetTemplateId }>
  >([]);

  useEffect(() => { metaRef.current = meta; }, [meta]);
  useEffect(() => { subjectsRef.current = subjects; }, [subjects]);
  useEffect(() => { templateIdRef.current = templateId; }, [templateId]);

  const showToast = useCallback((text: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((curr) => (curr?.text === text ? null : curr));
    }, 3200);
  }, []);

  const syncHistoryCounts = useCallback(() => {
    setHistoryCounts({
      undo: undoStackRef.current.length,
      redo: redoStackRef.current.length,
    });
  }, []);

  const resetHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    syncHistoryCounts();
  }, [syncHistoryCounts]);

  const pushUndoSnapshot = useCallback(() => {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-39),
      {
        meta: metaRef.current,
        subjects: subjectsRef.current,
        templateId: templateIdRef.current,
      },
    ];
    redoStackRef.current = [];
    syncHistoryCounts();
  }, [syncHistoryCounts]);

  const updateSubjectsWithHistory = useCallback(
    (next: React.SetStateAction<SubjectEntry[]>) => {
      pushUndoSnapshot();
      setSubjects(next);
    },
    [pushUndoSnapshot]
  );

  const handleUndo = useCallback(() => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    redoStackRef.current.push({
      meta: metaRef.current,
      subjects: subjectsRef.current,
      templateId: templateIdRef.current,
    });
    setMeta(prev.meta);
    setSubjects(prev.subjects);
    setTemplateId(prev.templateId);
    syncHistoryCounts();
    showToast('Undid last change');
  }, [showToast, syncHistoryCounts]);

  const handleRedo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push({
      meta: metaRef.current,
      subjects: subjectsRef.current,
      templateId: templateIdRef.current,
    });
    setMeta(next.meta);
    setSubjects(next.subjects);
    setTemplateId(next.templateId);
    syncHistoryCounts();
    showToast('Redid change');
  }, [showToast, syncHistoryCounts]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (viewModeRef.current !== 'studio') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        if (undoStackRef.current.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        if (redoStackRef.current.length > 0) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRedo, handleUndo]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [exportMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [userMenuOpen]);

  useEffect(() => {
    hasDraftSubjectsRef.current = subjects.length > 0;
  }, [subjects.length]);

  // Keep viewModeRef in sync for use inside auth observer
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  const fetchSavedList = useCallback(
    async (uid: string) => {
      setLoadingSaved(true);
      try {
        const items = await listUserTimetables(uid);
        setSavedList(items);
        return items;
      } catch {
        showToast('Could not load your saved schedules.', 'err');
        return [];
      } finally {
        setLoadingSaved(false);
      }
    },
    [showToast]
  );

  // Observe Firebase Auth state:
  // - Logged out -> Welcome / Get Started UI
  // - Logged in -> Go directly to Studio Dashboard and sync Firestore timetables
  // - Logged in from login-gate -> auto-save draft then enter studio
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);

      if (firebaseUser) {
        if (
          typeof window !== 'undefined' &&
          window.innerWidth < 768 &&
          sessionStorage.getItem('gridwiser_mobile_notice_dismissed') !== '1'
        ) {
          setMobileNoticeOpen(true);
        }
        upsertUserProfile(firebaseUser).catch(() => { });
        const params = new URLSearchParams(window.location.search);
        const loadParam = params.get('load');

        // If the user just signed in from the login gate, auto-save their draft
        if (viewModeRef.current === 'login-gate' && hasDraftSubjectsRef.current) {
          setViewMode('studio');
          setActiveNav('timetable');
          // Auto-save the draft to Firestore
          saveUserTimetable(
            firebaseUser.uid,
            {
              meta: metaRef.current,
              subjects: subjectsRef.current,
              templateId: templateIdRef.current,
              shareId: null,
            },
            null
          )
            .then((saved) => {
              setSavedId(saved.id);
              showToast('Timetable saved to your account!');
            })
            .catch(() => {
              showToast('Timetable generated – save failed, try manually.', 'err');
            });
          fetchSavedList(firebaseUser.uid).catch(() => { });
          return;
        }

        setViewMode('studio');
        const items = await fetchSavedList(firebaseUser.uid);

        if (hasDraftSubjectsRef.current) {
          setActiveNav('timetable');
        } else if (!loadParam && !initialRecord && items.length > 0) {
          // Load most recent saved timetable when user has no active draft
          getUserTimetable(firebaseUser.uid, items[0].id)
            .then((rec) => {
              if (rec) {
                setMeta(rec.meta);
                setSubjects(rec.subjects);
                setTemplateId(rec.templateId);
                setSavedId(rec.id);
                setShareId(rec.shareId ?? null);
                setActiveNav('timetable');
              }
            })
            .catch(() => { });
        }
      } else if (!initialRecord) {
        setSavedList([]);
        setSavedId(null);
        setShareId(null);
        const params = new URLSearchParams(window.location.search);
        if (!params.get('load') && viewModeRef.current !== 'login-gate') {
          setViewMode('welcome');
        }
      }
    },
      () => {
        setAuthLoading(false);
        showToast('Authentication failed to initialize. Please try signing in again.', 'err');
      }
    );

    return () => unsub();
  }, [fetchSavedList, initialRecord, showToast]);

  // Support ?load=<shareId> from Share page "Use as Template"
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loadId = params.get('load');
    if (loadId) {
      import('@/lib/firestore-timetables').then(({ getSharedTimetable }) =>
        getSharedTimetable(loadId)
          .then((rec) => {
            if (rec) {
              setMeta(rec.meta);
              setSubjects(rec.subjects);
              setTemplateId(rec.templateId);
              setSavedId(null);
              setShareId(null);
              resetHistory();
              window.history.replaceState({}, '', '/');
              if (auth.currentUser) {
                setViewMode('studio');
                setActiveNav('timetable');
                showToast(`Cloned "${rec.meta.title || 'Timetable'}" into your Studio`);
              } else {
                setViewMode('login-gate');
                showToast(`Cloned "${rec.meta.title || 'Timetable'}" — sign in to customize`);
              }
            }
          })
          .catch(() => { })
      );
    }
  }, [resetHistory, showToast]);

  const schedule = useMemo(() => analyzeSchedule(subjects, meta), [subjects, meta]);
  const activeTemplate = useMemo(() => getPresetTemplate(templateId), [templateId]);
  const isDailyTemplate =
    activeTemplate.layout === 'daily-poster' ||
    activeTemplate.layout === 'daily-deck' ||
    activeTemplate.layout === 'exhibition-daily';

  const handleNavClick = (nav: StudioNav) => {
    setActiveNav(nav);
    if (nav === 'saved' && user) {
      fetchSavedList(user.uid);
    }
  };

  const handleGenerate = () => {
    if (subjects.length === 0) {
      showToast('Add at least one subject with weekly times first.', 'err');
      if (viewMode === 'studio') setActiveNav('subjects');
      return;
    }
    if (schedule.unresolvedOverlaps.length > 0) {
      setOverlapAlertOpen(true);
      return;
    }
    // Gate: require sign-in before entering studio from onboarding
    if (!user) {
      setViewMode('login-gate');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setViewMode('studio');
    setActiveNav('timetable');
    showToast(`Generated timetable using ${activeTemplate.name}`);
  };

  const handleAiImport = (payload: {
    meta: Partial<TimetableMeta>;
    subjects: SubjectEntry[];
    sessionCount: number;
  }) => {
    const nextMeta = {
      ...meta,
      ...(payload.meta.title ? { title: payload.meta.title } : {}),
      ...(payload.meta.subtitle !== undefined ? { subtitle: payload.meta.subtitle } : {}),
      ...(payload.meta.timeFormat ? { timeFormat: payload.meta.timeFormat } : {}),
    };
    pushUndoSnapshot();
    setMeta(nextMeta);
    setSubjects(payload.subjects);
    setSavedId(null);
    setShareId(null);
    const check = analyzeSchedule(payload.subjects, nextMeta);
    if (viewMode === 'welcome' || viewMode === 'onboarding') {
      setViewMode('onboarding');
      setOnboardingStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (check.unresolvedOverlaps.length > 0) {
        setOverlapAlertOpen(true);
      }
    } else if (check.unresolvedOverlaps.length > 0) {
      setOverlapAlertOpen(true);
    } else if (viewMode === 'studio') {
      setActiveNav('timetable');
    }
    showToast(
      `Imported ${payload.subjects.length} subjects (${payload.sessionCount} sessions)`
    );
  };

  const openBlockEditor = (blk: ScheduledBlock) => {
    setEditingBlock(blk);
    setEditDay(blk.day);
    setEditStart(blk.startTime);
    setEditEnd(blk.endTime);
    setEditRoom(blk.room);
    setEditInstructor(blk.instructor);
  };

  const saveBlockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlock) return;

    const updatedSubjects = subjects.map((subj) => {
      if (subj.id !== editingBlock.subjectId) return subj;
      return {
        ...subj,
        room: editRoom.trim(),
        instructor: editInstructor.trim(),
        occurrences: subj.occurrences.map((occ) =>
          occ.id === editingBlock.occurrenceId
            ? {
              ...occ,
              day: editDay,
              startTime: editStart,
              endTime: editEnd,
              mergedOverlap: false,
            }
            : occ
        ),
      };
    });

    updateSubjectsWithHistory(updatedSubjects);
    setEditingBlock(null);

    const check = analyzeSchedule(updatedSubjects, meta);
    if (check.unresolvedOverlaps.length > 0) {
      setOverlapAlertOpen(true);
    } else {
      showToast('Updated session timing.');
    }
  };

  const deleteOccurrenceFromBlock = () => {
    if (!editingBlock) return;
    updateSubjectsWithHistory((prev) =>
      prev
        .map((subj) => {
          if (subj.id !== editingBlock.subjectId) return subj;
          return {
            ...subj,
            occurrences: subj.occurrences.filter((o) => o.id !== editingBlock.occurrenceId),
          };
        })
        .filter((subj) => subj.occurrences.length > 0)
    );
    setEditingBlock(null);
    showToast('Removed session.');
  };

  const handleSaveToCloud = async () => {
    if (!user) {
      setAuthModalMode('signin');
      setAuthModalOpen(true);
      showToast('Sign in with Google to save timetables to your account.', 'err');
      return;
    }
    if (subjects.length === 0) {
      showToast('Add subjects before saving.', 'err');
      return;
    }
    setIsSaving(true);
    try {
      const res = await saveUserTimetable(
        user.uid,
        { meta, subjects, templateId, shareId },
        savedId
      );
      setSavedId(res.id);
      setShareId(res.shareId);
      fetchSavedList(user.uid);
      showToast('Saved to your cloud library!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'err');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareTimetable = async () => {
    if (!user) {
      setAuthModalMode('signin');
      setAuthModalOpen(true);
      showToast('Sign in with Google to publish a shareable link.', 'err');
      return;
    }
    if (subjects.length === 0) {
      showToast('Add subjects before sharing.', 'err');
      return;
    }
    setIsSaving(true);
    try {
      const nextShareId = await publishSharedTimetable(
        user.uid,
        { meta, subjects, templateId },
        shareId
      );
      setShareId(nextShareId);
      const saved = await saveUserTimetable(
        user.uid,
        { meta, subjects, templateId, shareId: nextShareId },
        savedId
      );
      setSavedId(saved.id);
      fetchSavedList(user.uid);
      const shareUrl = `${window.location.origin}/share/${nextShareId}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Shareable link copied to clipboard!');
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Shareable link copied!');
      }
      setShareModalOpen(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Share failed', 'err');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMakePrivate = async (
    targetTimetableId: string | null = savedId,
    targetShareId: string | null = shareId
  ) => {
    if (!user || !targetShareId) return;
    setIsSaving(true);
    try {
      await unpublishSharedTimetable(user.uid, targetTimetableId, targetShareId);
      if (targetShareId === shareId) {
        setShareId(null);
      }
      setShareModalOpen(false);
      fetchSavedList(user.uid);
      showToast('Share link revoked — timetable is now private.');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to make timetable private',
        'err'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPng = async () => {
    if (!canvasRef.current) {
      showToast('Switch to Timetable view to export PNG.', 'err');
      return;
    }
    setExportingPng(true);
    setExportProgressText('Rendering high-res 3× PNG...');
    try {
      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 3,
        backgroundColor: activeTemplate.tokens.canvasBg,
      });
      const link = document.createElement('a');
      link.download = `${(meta.title || 'gridwiser-timetable').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Exported ultra-clear 3× PNG.');
    } catch {
      showToast('PNG export failed. Try Print / PDF.', 'err');
    } finally {
      setExportingPng(false);
      setExportProgressText(null);
    }
  };

  const handleExportAllDaysPng = async () => {
    if (subjects.length === 0 || schedule.days.length === 0) {
      showToast('Add subjects before exporting daily images.', 'err');
      return;
    }
    setExportingAllDays(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const baseSlug = (meta.title || 'gridwiser-timetable')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'gridwiser-timetable';

      let exported = 0;
      for (let i = 0; i < schedule.days.length; i += 1) {
        const day = schedule.days[i];
        setExportProgressText(`Rendering ${day} (${i + 1}/${schedule.days.length})...`);
        const node = dailyExportRefs.current[day];
        if (!node) continue;
        const dataUrl = await toPng(node, {
          pixelRatio: 3,
          backgroundColor: activeTemplate.tokens.canvasBg,
        });
        const base64 = dataUrl.split(',')[1];
        if (base64) {
          zip.file(`0${i + 1}-${day.toLowerCase()}.png`, base64, { base64: true });
          exported += 1;
        }
      }

      if (exported === 0) {
        showToast('Could not render daily images.', 'err');
        return;
      }

      setExportProgressText('Generating ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseSlug}-daily-images.zip`;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${exported} daily PNGs in ${baseSlug}-daily-images.zip!`);
    } catch {
      showToast('ZIP export failed. Try exporting single days.', 'err');
    } finally {
      setExportingAllDays(false);
      setExportProgressText(null);
    }
  };

  const handleExportPdf = async () => {
    if (subjects.length === 0) {
      showToast('Add subjects before exporting PDF.', 'err');
      return;
    }
    if (!isDailyTemplate && !canvasRef.current) {
      showToast('Switch to Timetable view to export PDF.', 'err');
      return;
    }

    setExportingPdf(true);
    setExportProgressText('Compiling crisp PDF document...');
    try {
      const { jsPDF } = await import('jspdf');
      const baseSlug =
        (meta.title || 'gridwiser-timetable')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'gridwiser-timetable';

      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const nodes: HTMLDivElement[] = isDailyTemplate
        ? schedule.days
          .map((d) => dailyExportRefs.current[d])
          .filter((el): el is HTMLDivElement => Boolean(el))
        : canvasRef.current
          ? [canvasRef.current]
          : [];

      if (nodes.length === 0) {
        showToast('Nothing to export to PDF.', 'err');
        return;
      }

      const bgHex = activeTemplate.tokens.canvasBg;
      let pdf: InstanceType<typeof jsPDF> | null = null;
      const pad = 24;

      for (let i = 0; i < nodes.length; i += 1) {
        setExportProgressText(`Rendering page ${i + 1} of ${nodes.length}...`);
        const dataUrl = await toPng(nodes[i], {
          pixelRatio: 3,
          backgroundColor: bgHex,
        });
        const img = await loadImage(dataUrl);
        const w = Math.round(img.naturalWidth / 3);
        const h = Math.round(img.naturalHeight / 3);
        const pageW = w + pad * 2;
        const pageH = h + pad * 2;
        const orientation = pageW >= pageH ? 'landscape' : 'portrait';

        if (!pdf) {
          pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [pageW, pageH],
            hotfixes: ['px_scaling'],
          });
        } else {
          pdf.addPage([pageW, pageH], orientation);
        }

        pdf.setFillColor(bgHex);
        pdf.rect(0, 0, pageW, pageH, 'F');
        pdf.addImage(dataUrl, 'PNG', pad, pad, w, h, undefined, 'FAST');
      }

      if (pdf) {
        pdf.save(`${baseSlug}${isDailyTemplate ? '-daily' : ''}.pdf`);
        showToast(
          isDailyTemplate
            ? `Exported ${nodes.length}-page PDF!`
            : 'Downloaded high-resolution PDF!'
        );
      }
    } catch {
      showToast('PDF export failed. Please try again.', 'err');
    } finally {
      setExportingPdf(false);
      setExportProgressText(null);
    }
  };

  const handleExportWallpaper = async (format: WallpaperFormat) => {
    if (subjects.length === 0) {
      showToast('Add subjects before exporting wallpaper.', 'err');
      return;
    }
    const targetNode = isDailyTemplate
      ? dailyExportRefs.current[activeDailyDay] ?? canvasRef.current
      : canvasRef.current;
    if (!targetNode) {
      showToast('Switch to Timetable view to export wallpaper.', 'err');
      return;
    }
    setExportingWallpaper(format);
    setExportProgressText(
      format === 'lockscreen'
        ? 'Rendering 1080×1920 Lockscreen wallpaper...'
        : 'Rendering 1920×1080 Desktop wallpaper...'
    );
    try {
      await exportTimetableWallpaper({
        node: targetNode,
        template: activeTemplate,
        title: meta.title,
        format,
        dayLabel: isDailyTemplate ? activeDailyDay : undefined,
      });
      showToast(
        format === 'lockscreen'
          ? 'Downloaded 9:16 Phone Lockscreen (1080×1920)!'
          : 'Downloaded 16:9 Desktop Wallpaper (1920×1080)!'
      );
    } catch {
      showToast('Wallpaper export failed. Please try again.', 'err');
    } finally {
      setExportingWallpaper(null);
      setExportProgressText(null);
    }
  };

  const handleExportIcs = () => {
    if (subjects.length === 0) {
      showToast('No sessions to export.', 'err');
      return;
    }
    const ics = generateICSFromSubjects(meta, subjects);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(meta.title || 'gridwiser-timetable').toLowerCase().replace(/\s+/g, '-')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded .ics calendar file.');
  };

  const handleExportJson = () => {
    const payload = { meta, subjects, templateId };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(meta.title || 'gridwiser-timetable').toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported JSON backup.');
  };

  const handleLoadSaved = async (id: string) => {
    if (!user) return;
    try {
      const rec = await getUserTimetable(user.uid, id);
      if (rec) {
        setMeta(rec.meta);
        setSubjects(rec.subjects);
        setTemplateId(rec.templateId);
        setSavedId(rec.id);
        setShareId(rec.shareId ?? null);
        setViewMode('studio');
        setActiveNav('timetable');
        showToast(`Opened "${rec.meta.title || 'Timetable'}"`);
      }
    } catch {
      showToast('Failed to open saved schedule.', 'err');
    }
  };

  const handleDeleteSaved = async (id: string) => {
    if (!user) return;
    try {
      await deleteUserTimetable(user.uid, id);
      setSavedList((prev) => prev.filter((item) => item.id !== id));
      if (savedId === id) {
        setSavedId(null);
        setShareId(null);
      }
      showToast('Deleted saved schedule.');
    } catch {
      showToast('Delete failed.', 'err');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setMeta({ title: '', subtitle: '', timeFormat: '24h', showWeekend: false });
      setSubjects([]);
      setSavedId(null);
      setShareId(null);
      setSavedList([]);
      setViewMode('welcome');
      showToast('Signed out.');
    } catch {
      showToast('Sign out failed.', 'err');
    }
  };

  const handleClearAll = () => {
    setMeta({ title: '', subtitle: '', timeFormat: '24h', showWeekend: false });
    setSubjects([]);
    setSavedId(null);
    setShareId(null);
    setOnboardingStep(1);
    setViewMode('onboarding');
  };

  if (authLoading) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-[#050812]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(50% 45% at 50% 50%, rgba(37, 99, 235, 0.16) 0%, rgba(5, 8, 18, 0) 75%)',
          }}
        />
        <div className="relative flex flex-col items-center gap-3.5">
          <div className="rounded-2xl border border-white/10 bg-[#0A1020]/80 p-3 shadow-[0_0_40px_rgba(59,130,246,0.18)]">
            <GridWiseLogoMark size={44} tone="dark" animated />
          </div>
          <span className="font-mono text-xs tracking-wide text-zinc-400">
            Loading workspace...
          </span>
        </div>
      </div>
    );
  }

  const navTitle =
    activeNav === 'subjects'
      ? 'Subjects & Times'
      : activeNav === 'templates'
        ? 'Template Gallery'
        : activeNav === 'timetable'
          ? 'Generated Timetable'
          : 'Saved Schedules';

  return (
    <>
      <AnimatePresence mode="wait">
        {viewMode === 'welcome' && (
          <motion.div
            key="view-welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={TRANSITION_VIEW}
          >
            <WelcomeLanding
              onGetStarted={(presetId) => {
                if (presetId) setTemplateId(presetId);
                setOnboardingStep(1);
                setViewMode('onboarding');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAiImport={() => setAiImportOpen(true)}
              onOpenAuth={() => {
                router.push('/signin');
              }}
            />
          </motion.div>
        )}

        {viewMode === 'onboarding' && (
          <motion.div
            key="view-onboarding"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={TRANSITION_VIEW}
          >
            <OnboardingWizard
              meta={meta}
              subjects={subjects}
              templateId={templateId}
              step={onboardingStep}
              onChangeStep={setOnboardingStep}
              onChangeMeta={setMeta}
              onChangeSubjects={setSubjects}
              onChangeTemplateId={setTemplateId}
              onOpenAiImport={() => setAiImportOpen(true)}
              onBackToWelcome={() => setViewMode(user ? 'studio' : 'welcome')}
              onGenerate={handleGenerate}
            />
          </motion.div>
        )}

        {viewMode === 'login-gate' && (
          <motion.div
            key="view-login-gate"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={TRANSITION_VIEW}
          >
            <LoginGate
              meta={meta}
              subjects={subjects}
              templateId={templateId}
              onBack={() => setViewMode('onboarding')}
              onSuccess={() => {
                // onAuthStateChanged will fire and handle the studio transition + auto-save
              }}
            />
          </motion.div>
        )}

        {viewMode === 'studio' && (
          <motion.div
            key="view-studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION_VIEW}
            className="flex min-h-screen bg-[#0A0A0C] text-zinc-100 lg:h-screen lg:overflow-hidden"
          >
            {/* Left Sidebar — fixed to viewport height so New Setup & Sign Out stay pinned */}
            <aside className="no-print hidden w-[248px] shrink-0 flex-col justify-between overflow-y-auto border-r border-[#1C1C22] bg-[#0D0D0F] p-3.5 lg:flex lg:h-screen">
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-xl border border-[#1E1E24] bg-[#121215] px-3 py-2.5">
                  <GridWiseBrand
                    size="sm"
                    tone="dark"
                    accentColor={activeTemplate.tokens.accent}
                  />
                  <span className="font-mono text-[10px] text-zinc-500">Studio</span>
                </div>

                <nav className="space-y-1">
                  <div className="px-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Workspace
                  </div>

                  <SidebarNavButton
                    active={activeNav === 'subjects'}
                    icon={<Calendar className="h-4 w-4" />}
                    label="Subjects & Times"
                    badge={subjects.length > 0 ? String(subjects.length) : undefined}
                    onClick={() => handleNavClick('subjects')}
                  />
                  <SidebarNavButton
                    active={activeNav === 'templates'}
                    icon={<Palette className="h-4 w-4" />}
                    label="Templates"
                    badge={String(PRESET_TEMPLATES.length)}
                    onClick={() => handleNavClick('templates')}
                  />
                  <SidebarNavButton
                    active={activeNav === 'timetable'}
                    icon={<LayoutGrid className="h-4 w-4" />}
                    label="Timetable"
                    onClick={() => handleNavClick('timetable')}
                  />
                  <SidebarNavButton
                    active={activeNav === 'saved'}
                    icon={<FolderOpen className="h-4 w-4" />}
                    label="Saved Schedules"
                    badge={savedList.length > 0 ? String(savedList.length) : undefined}
                    onClick={() => handleNavClick('saved')}
                  />
                  <Link
                    href="/theme-creator"
                    className="flex w-full items-center justify-between overflow-hidden rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-400 transition hover:bg-[#18181E] hover:text-white"
                  >
                    <span className="flex items-center gap-2.5">
                      <Palette className="h-4 w-4 text-blue-400" />
                      <span>Theme Creator</span>
                    </span>
                    <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                      NEW
                    </span>
                  </Link>
                </nav>

                <div className="space-y-2 px-1">
                  <div className="px-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Active Preset
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavClick('templates')}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-[#1E1E24] bg-[#121215] p-2.5 text-left transition hover:border-[#2E2E38]"
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20"
                      style={{ backgroundColor: activeTemplate.tokens.accent }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-zinc-100">
                        {activeTemplate.name}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {activeTemplate.layoutLabel}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bottom Account & Summary Card */}
              <div className="space-y-3">
                <div className="space-y-2.5 rounded-xl border border-[#1E1E24] bg-[#121215] p-3.5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Weekly Load</span>
                    <span className="font-mono font-medium text-white">
                      {schedule.stats.totalHours}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Sessions</span>
                    <span className="font-mono font-medium text-white">
                      {schedule.stats.totalSessions}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOnboardingStep(1);
                        setViewMode('onboarding');
                      }}
                      className="rounded-lg border border-[#25252D] bg-[#18181D] px-2 py-1.5 text-[11px] font-medium text-zinc-200 hover:border-zinc-500"
                    >
                      New Setup
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearConfirmOpen(true)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#25252D] bg-[#0B0B0D] px-2 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Clear
                    </button>
                  </div>
                </div>

                {/* User Profile & Sign Out */}
                {user ? (
                  <div className="rounded-xl border border-[#1E1E24] bg-[#121215] p-3">
                    <button
                      type="button"
                      onClick={() => router.push('/account')}
                      title="Open Account Settings"
                      className="flex w-full items-center gap-2.5 rounded-lg p-1 text-left transition hover:bg-white/[0.05]"
                    >
                      {user.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.photoURL}
                          alt={user.displayName ?? 'User'}
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 shrink-0 rounded-full border border-white/15 object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-white">
                          {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-white">
                          {user.displayName ?? 'Google User'}
                        </div>
                        <div className="truncate text-[10px] text-zinc-500">
                          Account settings · {user.email}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignOutConfirmOpen(true)}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#25252D] bg-[#0B0B0D] py-1.5 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                    >
                      <LogOut className="h-3 w-3" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signin');
                      setAuthModalOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign In with Google
                  </button>
                )}
              </div>
            </aside>

            {/* Main Content — independent scroll pane connected to fixed sidebar */}
            <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-y-auto">
              <header className="no-print sticky top-0 z-20 flex flex-col gap-2.5 border-b border-[#1C1C22] bg-[#0A0A0C]/90 px-3 py-2.5 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-zinc-400 lg:text-zinc-500">GridWiser</span>
                    <span className="text-zinc-700">/</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={navTitle}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={TRANSITION_FAST}
                        className="font-medium text-zinc-100"
                      >
                        {navTitle}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  {/* Mobile quick actions */}
                  <div className="flex items-center gap-1.5 lg:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setOnboardingStep(1);
                        setViewMode('onboarding');
                      }}
                      className="rounded-lg border border-[#25252D] bg-[#131317] px-2.5 py-1 text-[11px] font-medium text-zinc-300"
                    >
                      New Setup
                    </button>
                    {user ? (
                      <div className="relative" ref={userMenuRef}>
                        <button
                          type="button"
                          onClick={() => setUserMenuOpen((prev) => !prev)}
                          className="flex overflow-hidden rounded-full border border-white/20 transition hover:border-white/50 focus:outline-none"
                          title="Account menu"
                        >
                          {user.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.photoURL}
                              alt={user.displayName ?? 'Account'}
                              referrerPolicy="no-referrer"
                              className="h-7 w-7 object-cover"
                            />
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center bg-zinc-800 text-[11px] font-semibold text-white">
                              {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </button>

                        {userMenuOpen && (
                          <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#27272F] bg-[#0E0F14] p-1.5 shadow-2xl backdrop-blur-xl">
                            <div className="border-b border-[#1E1F27] px-3 py-2">
                              <p className="truncate text-xs font-semibold text-white">
                                {user.displayName ?? 'User'}
                              </p>
                              <p className="truncate text-[10px] text-zinc-500">
                                {user.email}
                              </p>
                            </div>
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  router.push('/account');
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-zinc-200 transition hover:bg-[#1C1D26]"
                              >
                                <UserIcon className="h-3.5 w-3.5 text-blue-400" />
                                Open Profile
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  setSignOutConfirmOpen(true);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
                              >
                                <LogOut className="h-3.5 w-3.5" />
                                Sign Out
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode('signin');
                          setAuthModalOpen(true);
                        }}
                        className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-[#09090B]"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:gap-2 lg:overflow-visible lg:pb-0">
                  <div className="flex items-center rounded-lg border border-[#222229] bg-[#121215] p-0.5">
                    <button
                      type="button"
                      disabled={historyCounts.undo === 0}
                      onClick={handleUndo}
                      title="Undo (Ctrl+Z)"
                      aria-label="Undo"
                      className="rounded-md p-1.5 text-zinc-300 transition hover:bg-[#1E1E26] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={historyCounts.redo === 0}
                      onClick={handleRedo}
                      title="Redo (Ctrl+Y)"
                      aria-label="Redo"
                      className="rounded-md p-1.5 text-zinc-300 transition hover:bg-[#1E1E26] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Redo2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <AiImportButton
                    onClick={() => setAiImportOpen(true)}
                    compact
                    hideLabelOnMobile
                  />

                  <div className="hidden rounded-lg border border-[#222229] bg-[#121215] p-0.5 text-[11px] sm:flex">
                    {(['24h', '12h'] as const).map((fmt) => {
                      const active = meta.timeFormat === fmt;
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setMeta({ ...meta, timeFormat: fmt })}
                          className={`relative rounded-md px-2 py-1 font-medium transition-colors ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="studio-timefmt-pill"
                              transition={SPRING_PILL}
                              className="absolute inset-0 rounded-md bg-[#222229]"
                            />
                          )}
                          <span className="relative z-10">{fmt}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveToCloud}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#25252D] bg-[#131317] px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isSaving ? 'Saving...' : savedId ? 'Update' : 'Save'}
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      if (shareId) {
                        setShareModalOpen(true);
                      } else {
                        void handleShareTimetable();
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                      shareId
                        ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/50'
                        : 'border-[#25252D] bg-[#131317] text-zinc-200 hover:border-zinc-500'
                    }`}
                  >
                    {shareId ? (
                      <>
                        <Globe className="h-3.5 w-3.5" />
                        Shared
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                      </>
                    )}
                  </button>

                  {activeNav !== 'timetable' && (
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      View Timetable
                    </button>
                  )}
                </div>
              </header>

              <main className="flex-1 p-3 pb-24 sm:p-6 lg:pb-6">
                <AnimatePresence mode="wait">
                  {activeNav === 'subjects' && (
                    <motion.div
                      key="tab-subjects"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={TRANSITION_VIEW}
                      className="mx-auto max-w-4xl space-y-6"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                          <h1 className="text-xl font-semibold tracking-tight text-white">
                            Subjects & Weekly Timings
                          </h1>
                          <p className="mt-1 text-xs text-zinc-500">
                            Enter your subjects manually, or use Import Using AI to convert an image, PDF, or text schedule.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleNavClick('templates')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#27272F] bg-[#131317] px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500"
                          >
                            <Palette className="h-3.5 w-3.5" />
                            Choose Template
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 rounded-xl border border-[#222228] bg-[#131317] p-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                            Timetable Title
                          </label>
                          <input
                            type="text"
                            value={meta.title}
                            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                            placeholder="e.g. Semester 4 Schedule"
                            className="w-full rounded-lg border border-[#25252C] bg-[#0B0B0D] px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                            Subtitle / Term
                          </label>
                          <input
                            type="text"
                            value={meta.subtitle}
                            onChange={(e) => setMeta({ ...meta, subtitle: e.target.value })}
                            placeholder="e.g. B.Tech Computer Science"
                            className="w-full rounded-lg border border-[#25252C] bg-[#0B0B0D] px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                          />
                        </div>
                      </div>

                      <SubjectEntryBuilder
                        subjects={subjects}
                        timeFormat={meta.timeFormat}
                        onChangeSubjects={updateSubjectsWithHistory}
                      />
                    </motion.div>
                  )}

                  {activeNav === 'templates' && (
                    <motion.div
                      key="tab-templates"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={TRANSITION_VIEW}
                      className="mx-auto max-w-[1380px] space-y-5"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                          <h1 className="text-xl font-semibold tracking-tight text-white">
                            Preset Templates
                          </h1>
                          <p className="mt-1 text-xs text-zinc-500">
                            Each template is a complete visual preset. Select any card to preview your entered timetable live.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href="/theme-creator"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
                          >
                            <Palette className="h-3.5 w-3.5" />
                            Create Your Template
                          </Link>
                          <button
                            type="button"
                            onClick={handleGenerate}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-zinc-200"
                          >
                            Use {activeTemplate.name} & Generate
                          </button>
                        </div>
                      </div>

                      <div className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
                        <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 xl:grid xl:content-start xl:grid-cols-1 xl:overflow-visible xl:pb-0">
                          {PRESET_TEMPLATES.map((tpl) => {
                            const active = tpl.id === templateId;
                            return (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => setTemplateId(tpl.id)}
                                className={`flex w-[220px] shrink-0 snap-start items-start gap-3 rounded-xl border p-3 text-left transition xl:w-auto xl:gap-3.5 xl:p-3.5 ${active
                                  ? 'border-white bg-[#17171C]'
                                  : 'border-[#202026] bg-[#121215] hover:border-[#32323D]'
                                  }`}
                              >
                                <div
                                  className="flex h-11 w-14 shrink-0 flex-col justify-between rounded-lg border p-1.5"
                                  style={{
                                    background: tpl.tokens.headerBannerBg ?? tpl.tokens.canvasBg,
                                    borderColor: tpl.tokens.borderStrong,
                                  }}
                                >
                                  <span
                                    className="h-1 w-6 rounded-full"
                                    style={{ backgroundColor: tpl.tokens.text }}
                                  />
                                  <div className="flex gap-1">
                                    <span
                                      className="h-2.5 flex-1 rounded-xs"
                                      style={{ backgroundColor: tpl.tokens.cardBg }}
                                    />
                                    <span
                                      className="h-2.5 w-3 rounded-xs"
                                      style={{ backgroundColor: tpl.tokens.accent }}
                                    />
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-xs font-semibold text-white">
                                      {tpl.name}
                                    </span>
                                    <span className="shrink-0 text-[10px] font-medium text-zinc-500">
                                      {tpl.layoutLabel}
                                    </span>
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
                                    {tpl.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="min-w-0 overflow-x-auto">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeTemplate.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={TRANSITION_FAST}
                            >
                              <TimetableRenderer
                                meta={meta}
                                schedule={schedule}
                                template={activeTemplate}
                                interactive
                                selectedDay={activeDailyDay}
                                onSelectDay={setActiveDailyDay}
                                onClickBlock={openBlockEditor}
                              />
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeNav === 'timetable' && (
                    <motion.div
                      key="tab-timetable"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={TRANSITION_VIEW}
                      className="mx-auto max-w-[1380px] space-y-4"
                    >
                      <div className="no-print flex flex-col gap-2.5 rounded-xl border border-[#202026] bg-[#121215] px-3.5 py-2 md:flex-row md:items-center md:justify-between md:gap-3">
                        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
                          <span className="mr-1 shrink-0 text-[11px] text-zinc-500">Preset:</span>
                          {PRESET_TEMPLATES.map((tpl) => {
                            const active = tpl.id === templateId;
                            return (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => setTemplateId(tpl.id)}
                                className={`relative shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${active
                                  ? 'text-[#09090B]'
                                  : 'text-zinc-400 hover:bg-[#1C1C22] hover:text-zinc-200'
                                  }`}
                              >
                                {active && (
                                  <motion.span
                                    layoutId="studio-preset-pill"
                                    transition={SPRING_PILL}
                                    className="absolute inset-0 rounded-lg bg-white"
                                  />
                                )}
                                <span className="relative z-10">{tpl.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div
                          className="flex shrink-0 items-center gap-1.5 md:border-l md:border-[#24242C] md:pl-3"
                          ref={exportMenuRef}
                        >
                          <button
                            type="button"
                            disabled={exportingPng}
                            onClick={handleExportPng}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#27272F] bg-[#0B0B0D] px-3 py-1.5 text-[11px] font-medium text-zinc-200 transition hover:border-zinc-500 disabled:opacity-60"
                          >
                            {exportingPng ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            {exportingPng
                              ? 'Rendering...'
                              : isDailyTemplate
                                ? `${activeDailyDay} PNG`
                                : '3× PNG'}
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setExportMenuOpen((prev) => !prev)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-[#09090B] transition hover:bg-zinc-200"
                            >
                              Export
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${
                                  exportMenuOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {exportMenuOpen && (
                              <div className="absolute left-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-xl border border-[#27272F] bg-[#0D0E12] p-1.5 shadow-2xl md:left-auto md:right-0">
                                <button
                                  type="button"
                                  disabled={exportingPng}
                                  onClick={() => {
                                    setExportMenuOpen(false);
                                    void handleExportPng();
                                  }}
                                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22] disabled:opacity-50"
                                >
                                  <span className="flex items-center gap-2">
                                    <Download className="h-3.5 w-3.5 text-zinc-400" />
                                    {isDailyTemplate ? `${activeDailyDay} Image` : '3× Ultra Retina'}
                                  </span>
                                  <span className="font-mono text-[10px] text-zinc-500">PNG</span>
                                </button>
                                {isDailyTemplate && (
                                  <button
                                    type="button"
                                    disabled={exportingAllDays}
                                    onClick={() => {
                                      setExportMenuOpen(false);
                                      void handleExportAllDaysPng();
                                    }}
                                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22] disabled:opacity-50"
                                  >
                                    <span className="flex items-center gap-2">
                                      <Download className="h-3.5 w-3.5 text-zinc-400" />
                                      {exportingAllDays
                                        ? 'Zipping Days...'
                                        : `All ${schedule.days.length} Days`}
                                    </span>
                                    <span className="font-mono text-[10px] text-zinc-500">.ZIP</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={exportingPdf}
                                  onClick={() => {
                                    setExportMenuOpen(false);
                                    void handleExportPdf();
                                  }}
                                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22] disabled:opacity-50"
                                >
                                  <span className="flex items-center gap-2">
                                    <Printer className="h-3.5 w-3.5 text-zinc-400" />
                                    {exportingPdf ? 'Exporting PDF...' : 'Print-Ready'}
                                  </span>
                                  <span className="font-mono text-[10px] text-zinc-500">PDF</span>
                                </button>

                                <div className="my-1 border-t border-[#1E1F27]" />

                                <button
                                  type="button"
                                  disabled={exportingWallpaper !== null}
                                  onClick={() => {
                                    setExportMenuOpen(false);
                                    void handleExportWallpaper('lockscreen');
                                  }}
                                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22] disabled:opacity-50"
                                >
                                  <span className="flex items-center gap-2">
                                    <Smartphone className="h-3.5 w-3.5 text-blue-400" />
                                    {exportingWallpaper === 'lockscreen'
                                      ? 'Rendering...'
                                      : 'Phone Lockscreen'}
                                  </span>
                                  <span className="font-mono text-[10px] text-zinc-500">9:16</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={exportingWallpaper !== null}
                                  onClick={() => {
                                    setExportMenuOpen(false);
                                    void handleExportWallpaper('desktop');
                                  }}
                                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22] disabled:opacity-50"
                                >
                                  <span className="flex items-center gap-2">
                                    <Monitor className="h-3.5 w-3.5 text-blue-400" />
                                    {exportingWallpaper === 'desktop'
                                      ? 'Rendering...'
                                      : 'Desktop Wallpaper'}
                                  </span>
                                  <span className="font-mono text-[10px] text-zinc-500">16:9</span>
                                </button>

                                <div className="my-1 border-t border-[#1E1F27]" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setExportMenuOpen(false);
                                    handleExportIcs();
                                  }}
                                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22]"
                                >
                                  <span className="flex items-center gap-2">
                                    <CalendarPlus className="h-3.5 w-3.5 text-zinc-400" />
                                    Calendar Feed
                                  </span>
                                  <span className="font-mono text-[10px] text-zinc-500">.ICS</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExportMenuOpen(false);
                                    handleExportJson();
                                  }}
                                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#191A22]"
                                >
                                  <span className="flex items-center gap-2">
                                    <FileJson className="h-3.5 w-3.5 text-zinc-400" />
                                    Schedule Backup
                                  </span>
                                  <span className="font-mono text-[10px] text-zinc-500">JSON</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {subjects.length === 0 ? (
                        <div className="no-print flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#27272F] bg-[#121215]/70 px-6 py-14 text-center">
                          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#2A2A34] bg-[#18181D]">
                            <Calendar className="h-5 w-5 text-blue-400" />
                          </div>
                          <h2 className="text-sm font-semibold text-white">
                            Your timetable canvas is ready
                          </h2>
                          <p className="mt-1 max-w-md text-xs text-zinc-400">
                            Add your subjects manually or import an existing timetable PDF/image with AI to populate the grid.
                          </p>
                          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleNavClick('subjects')}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              Add Subjects
                            </button>
                            <AiImportButton onClick={() => setAiImportOpen(true)} />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="no-print text-[11px] text-zinc-500 lg:hidden">
                            Swipe horizontally to inspect the fixed layout · Tap any session to edit
                          </p>
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeTemplate.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={TRANSITION_FAST}
                              className="overflow-x-auto"
                            >
                              <TimetableRenderer
                                canvasRef={canvasRef}
                                meta={meta}
                                schedule={schedule}
                                template={activeTemplate}
                                interactive
                                selectedDay={activeDailyDay}
                                onSelectDay={setActiveDailyDay}
                                onClickBlock={openBlockEditor}
                              />
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      )}

                      {schedule.unresolvedOverlaps.length > 0 && (
                        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                          <span>
                            {schedule.unresolvedOverlaps.length} time overlap
                            {schedule.unresolvedOverlaps.length > 1 ? 's' : ''} detected. Merge
                            intentional overlaps or edit the session times.
                          </span>
                          <button
                            type="button"
                            onClick={() => setOverlapAlertOpen(true)}
                            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#09090B] hover:bg-zinc-200"
                          >
                            Resolve / Merge Overlaps
                          </button>
                        </div>
                      )}

                      <p className="no-print text-center text-[11px] text-zinc-500">
                        Click any session block above to adjust its weekday, start/end time, room, or instructor.
                      </p>
                    </motion.div>
                  )}

                  {activeNav === 'saved' && (
                    <motion.div
                      key="tab-saved"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={TRANSITION_VIEW}
                      className="mx-auto max-w-4xl space-y-5"
                    >
                      <div>
                        <h1 className="text-xl font-semibold tracking-tight text-white">
                          Saved Schedules
                        </h1>
                        <p className="mt-1 text-xs text-zinc-500">
                          Timetables synced privately to your Google account.
                        </p>
                      </div>

                      {!user ? (
                        <div className="rounded-xl border border-[#222228] bg-[#121215] p-8 text-center">
                          <p className="text-sm font-medium text-white">
                            Sign in with Google to view your saved schedules
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Your timetables are saved privately to your Google account.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthModalMode('signin');
                              setAuthModalOpen(true);
                            }}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-zinc-200"
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            Sign In with Google
                          </button>
                        </div>
                      ) : loadingSaved ? (
                        <div className="rounded-xl border border-[#222228] bg-[#121215] py-14 text-center text-xs text-zinc-500">
                          Loading your saved schedules...
                        </div>
                      ) : savedList.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#25252C] bg-[#121215]/50 py-14 text-center text-xs text-zinc-500">
                          No saved schedules yet. Build a timetable and click Save.
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {savedList.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-col justify-between gap-4 rounded-xl border border-[#222228] bg-[#131317] p-4"
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10"
                                  style={{ backgroundColor: item.canvasBg }}
                                >
                                  <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: item.accent }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-white">
                                    {item.title}
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-zinc-500">
                                    {item.subjectCount} subjects · {item.sessionCount} sessions ·{' '}
                                    {item.templateName}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-[#1F1F26] pt-3">
                                <button
                                  type="button"
                                  onClick={() => handleLoadSaved(item.id)}
                                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#09090B] hover:bg-zinc-200"
                                >
                                  Open in Studio
                                </button>
                                <div className="flex items-center gap-1.5">
                                  {item.shareId && (
                                    <>
                                      <a
                                        href={`/share/${item.shareId}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-300 hover:border-emerald-400/60"
                                        title="Open public share link"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                      <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => handleMakePrivate(item.id, item.shareId ?? null)}
                                        className="rounded-lg border border-[#25252D] p-1.5 text-zinc-400 hover:border-amber-400/50 hover:text-amber-300 disabled:opacity-50"
                                        title="Make private (revoke share link)"
                                      >
                                        <Lock className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSaved(item.id)}
                                    className="rounded-lg border border-[#25252D] p-1.5 text-zinc-400 hover:border-zinc-500 hover:text-rose-400"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>
            </div>

            {/* Fixed Bottom Navigation Bar on Mobile */}
            <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-[#1E1E26] bg-[#0A0A0E]/95 px-2 py-1.5 backdrop-blur-xl lg:hidden">
              {(
                [
                  { id: 'subjects', label: 'Subjects', icon: Calendar },
                  { id: 'templates', label: 'Themes', icon: Palette },
                  { id: 'timetable', label: 'Timetable', icon: LayoutGrid },
                  { id: 'saved', label: 'Saved', icon: FolderOpen },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const active = activeNav === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleNavClick(id)}
                    className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-colors ${
                      active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="studio-mobile-nav-pill"
                        transition={SPRING_PILL}
                        className="absolute inset-0 rounded-xl border border-white/10 bg-[#1B1C24]"
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </nav>

            <AnimatedModalShell
              open={Boolean(editingBlock)}
              onClose={() => setEditingBlock(null)}
              blurClass="bg-black/75 backdrop-blur-sm"
            >
              {editingBlock && (
                <form
                  onSubmit={saveBlockAdjustment}
                  className="w-full max-w-md rounded-2xl border border-[#25252D] bg-[#121215] p-5 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-[#1F1F26] pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{editingBlock.name}</h3>
                      <p className="text-[11px] text-zinc-500">
                        Adjust this session&apos;s timing or details
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingBlock(null)}
                      className="rounded-lg p-1 text-zinc-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-400">Weekday</label>
                        <select
                          value={editDay}
                          onChange={(e) => setEditDay(e.target.value as DayOfWeek)}
                          className="w-full rounded-lg border border-[#25252D] bg-[#0B0B0D] px-2.5 py-2 text-xs text-white outline-none"
                        >
                          {ALL_DAYS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-400">Start</label>
                        <input
                          type="time"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                          className="w-full rounded-lg border border-[#25252D] bg-[#0B0B0D] px-2 py-2 font-mono text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-400">End</label>
                        <input
                          type="time"
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                          className="w-full rounded-lg border border-[#25252D] bg-[#0B0B0D] px-2 py-2 font-mono text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-400">Room</label>
                        <input
                          type="text"
                          value={editRoom}
                          onChange={(e) => setEditRoom(e.target.value)}
                          className="w-full rounded-lg border border-[#25252D] bg-[#0B0B0D] px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-400">Instructor</label>
                        <input
                          type="text"
                          value={editInstructor}
                          onChange={(e) => setEditInstructor(e.target.value)}
                          className="w-full rounded-lg border border-[#25252D] bg-[#0B0B0D] px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={deleteOccurrenceFromBlock}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-[#1C1C22] hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove session
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingBlock(null)}
                        className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-[#09090B] hover:bg-zinc-200"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </AnimatedModalShell>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal (Google Login Only) */}
      <AuthModal
        open={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setViewMode('studio');
          showToast('Signed in with Google!');
        }}
      />

      {/* AI Import Popup Modal */}
      <ImportAiModal
        open={aiImportOpen}
        onClose={() => setAiImportOpen(false)}
        onImport={handleAiImport}
      />

      {/* Overlap Alert & Merge Modal */}
      <OverlapAlertModal
        conflicts={overlapAlertOpen ? schedule.unresolvedOverlaps : []}
        timeFormat={meta.timeFormat}
        onClose={() => setOverlapAlertOpen(false)}
        onMergeConflict={(ids) => {
          updateSubjectsWithHistory((prev) => markOccurrencesAsMerged(prev, ids));
          showToast('Merged overlapping subjects into one slot.');
          if (schedule.unresolvedOverlaps.length <= 1) {
            setOverlapAlertOpen(false);
          }
        }}
        onMergeAll={() => {
          const allIds = schedule.unresolvedOverlaps.flatMap((c) =>
            c.blocks.map((b) => b.occurrenceId)
          );
          updateSubjectsWithHistory((prev) => markOccurrencesAsMerged(prev, allIds));
          setOverlapAlertOpen(false);
          showToast('Merged all overlapping slots.');
        }}
        onEditBlock={(occId) => {
          const blk = schedule.blocks.find((b) => b.occurrenceId === occId);
          if (blk) {
            setOverlapAlertOpen(false);
            openBlockEditor(blk);
          }
        }}
      />

      {/* Off-screen per-day renderers for multi-image daily PNG export */}
      {isDailyTemplate && subjects.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed -left-[9999px] top-0 w-[760px]"
        >
          {schedule.days.map((day) => (
            <div
              key={day}
              ref={(el) => {
                dailyExportRefs.current[day] = el;
              }}
            >
              <TimetableRenderer
                meta={meta}
                schedule={schedule}
                template={activeTemplate}
                selectedDay={day}
              />
            </div>
          ))}
        </div>
      )}

      {/* Google One Tap for signed-out visitors */}
      <GoogleOneTap
        disabled={authLoading || Boolean(user) || viewMode === 'login-gate'}
        onError={(err) => showToast(formatFirebaseAuthError(err).message, 'err')}
      />

      {/* Share Settings Modal */}
      <AnimatedModalShell
        open={shareModalOpen && Boolean(shareId)}
        onClose={() => setShareModalOpen(false)}
        zIndexClass="z-50"
      >
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-[#080B12] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Public Share Link
                </h3>
                <p className="text-xs text-zinc-400">
                  Anyone with this link can view a read-only copy.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
              aria-label="Close share settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#1E2430] bg-[#0B0E16] p-2">
            <input
              type="text"
              readOnly
              value={
                typeof window !== 'undefined' && shareId
                  ? `${window.location.origin}/share/${shareId}`
                  : shareId
                  ? `/share/${shareId}`
                  : ''
              }
              className="min-w-0 flex-1 bg-transparent px-2 font-mono text-xs text-zinc-200 outline-none"
            />
            <button
              type="button"
              onClick={async () => {
                if (!shareId || typeof window === 'undefined') return;
                const url = `${window.location.origin}/share/${shareId}`;
                await navigator.clipboard?.writeText(url).catch(() => {});
                showToast('Shareable link copied!');
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#050811] transition hover:bg-zinc-200"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleMakePrivate(savedId, shareId)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              <Lock className="h-3.5 w-3.5" />
              Make Private
            </button>

            <div className="flex items-center gap-2">
              {shareId && (
                <a
                  href={`/share/${shareId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
              )}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleShareTimetable}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Sync Latest
              </button>
            </div>
          </div>
        </div>
      </AnimatedModalShell>

      {/* Sign Out Confirmation Modal */}
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
            Any unsaved changes to your current draft will be cleared from this session. Saved schedules remain safely stored in your account.
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

      {/* Clear Schedule Confirmation Modal */}
      <AnimatedModalShell
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        zIndexClass="z-50"
      >
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-[#080B12] p-6 shadow-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <RotateCcw className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            Reset current timetable?
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            This will clear all current subjects and start a blank schedule. If you saved this schedule previously, your saved copy remains safe in your account.
          </p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setClearConfirmOpen(false)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setClearConfirmOpen(false);
                handleClearAll();
                showToast('Schedule reset to empty state.');
              }}
              className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
            >
              Reset Schedule
            </button>
          </div>
        </div>
      </AnimatedModalShell>

      {/* Mobile Desktop-Recommended Notice (shown when logged in on mobile) */}
      <AnimatedModalShell
        open={mobileNoticeOpen}
        onClose={() => {
          sessionStorage.setItem('gridwiser_mobile_notice_dismissed', '1');
          setMobileNoticeOpen(false);
        }}
        zIndexClass="z-50"
      >
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-[#080B12] p-6 shadow-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
            <Monitor className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            Best Experienced on Desktop
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            You&apos;re using GridWiser on a mobile device. While we are actively striving to improve our mobile UI, some studio components and fixed timetable layouts may not work or look as intended on smaller screens. We recommend using a desktop device for the best experience—or you can continue to the website below.
          </p>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('gridwiser_mobile_notice_dismissed', '1');
              setMobileNoticeOpen(false);
            }}
            className="mt-5 w-full rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#050811] transition hover:bg-zinc-200"
          >
            Continue to Website
          </button>
        </div>
      </AnimatedModalShell>

      {/* Toast */}
      <AnimatePresence>
        {exportProgressText && (
          <motion.div
            key="export-progress"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={SPRING_PILL}
            className="no-print fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-blue-500/30 bg-[#0E1528]/95 px-4 py-2 text-xs font-medium text-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.25)] backdrop-blur-xl lg:bottom-16"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
            <span>{exportProgressText}</span>
          </motion.div>
        )}
        {toast && (
          <motion.div
            key={toast.text}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={SPRING_PILL}
            className="no-print fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#2B2B34] bg-[#141418]/95 px-4 py-2 text-xs font-medium text-zinc-100 shadow-2xl backdrop-blur-xl lg:bottom-5"
          >
            {toast.type === 'err' ? (
              <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
            ) : (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            )}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarNavButton({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-center justify-between overflow-hidden rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${active
        ? 'text-white'
        : 'text-zinc-400 hover:bg-[#141418] hover:text-zinc-200'
        }`}
    >
      {active && (
        <motion.span
          layoutId="studio-sidebar-pill"
          transition={SPRING_PILL}
          className="absolute inset-0 rounded-lg border border-[#27272F] bg-[#18181D] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        />
      )}
      <span className="relative z-10 flex items-center gap-2.5">
        <span className={active ? 'text-white' : 'text-zinc-500'}>{icon}</span>
        {label}
      </span>
      {badge && (
        <span className="relative z-10 rounded bg-[#0B0B0D] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
          {badge}
        </span>
      )}
    </button>
  );
}
