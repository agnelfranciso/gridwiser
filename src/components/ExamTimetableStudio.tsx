'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  ArrowLeft,
  CalendarPlus,
  ChevronDown,
  Copy,
  Download,
  FileJson,
  GraduationCap,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Printer,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  deleteUserExamTimetable,
  duplicateUserExamTimetable,
  getUserExamTimetable,
  getUserTimetable,
  listUserExamTimetables,
  saveUserExamTimetable,
} from '@/lib/firestore-timetables';
import { generateExamICS } from '@/lib/exam-ai-parser';
import { safeToPng } from '@/lib/export-image';
import {
  exportTimetableWallpaper,
  type WallpaperFormat,
} from '@/lib/wallpaper-export';
import { ExamAiModal } from '@/components/ExamAiModal';
import { ExamTimetableRenderer } from '@/components/ExamTimetableRenderer';
import { GridDatePicker } from '@/components/GridDatePicker';
import { GridTimePicker } from '@/components/GridTimePicker';
import type {
  ExamEntry,
  ExamTimetableMeta,
  ExamType,
  PresetTemplate,
  PresetTemplateId,
  SavedExamTimetableSummary,
  SavedTimetableSummary,
  SubjectEntry,
} from '@/types/timetable';

const ACCENT_DOTS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#6366F1',
];

const EXAM_TYPES: ExamType[] = ['Final', 'Midterm', 'Practical', 'Viva', 'Quiz'];

interface ExamTimetableStudioProps {
  user: User | null;
  allTemplates: PresetTemplate[];
  savedTimetables: SavedTimetableSummary[];
  currentSubjects: SubjectEntry[];
  initialTemplateId: PresetTemplateId;
  onToast: (text: string, type?: 'ok' | 'err') => void;
}

export function ExamTimetableStudio({
  user,
  allTemplates,
  savedTimetables,
  currentSubjects,
  initialTemplateId,
  onToast,
}: ExamTimetableStudioProps) {
  const [view, setView] = useState<'hub' | 'editor'>('hub');
  const [examList, setExamList] = useState<SavedExamTimetableSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [savedExamId, setSavedExamId] = useState<string | null>(null);
  const [meta, setMeta] = useState<ExamTimetableMeta>({
    title: 'End-Semester Examinations',
    subtitle: 'Official Exam Schedule',
    timeFormat: '12h',
  });
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [templateId, setTemplateId] = useState<PresetTemplateId>(initialTemplateId);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingWallpaper, setExportingWallpaper] = useState<WallpaperFormat | null>(null);

  // Manual form state
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [formSubject, setFormSubject] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formStart, setFormStart] = useState('09:30');
  const [formEnd, setFormEnd] = useState('12:30');
  const [formVenue, setFormVenue] = useState('');
  const [formSeat, setFormSeat] = useState('');
  const [formType, setFormType] = useState<ExamType>('Final');
  const [formNotes, setFormNotes] = useState('');

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const activeTemplate = useMemo(
    () => allTemplates.find((t) => t.id === templateId) ?? allTemplates[0],
    [allTemplates, templateId]
  );

  const refreshExamList = useCallback(async () => {
    if (!user) return;
    const items = await listUserExamTimetables(user.uid);
    setExamList(items);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    listUserExamTimetables(user.uid)
      .then((items) => {
        if (active) setExamList(items);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingList(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

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

  const resetManualForm = () => {
    setEditingExamId(null);
    setFormSubject('');
    setFormCode('');
    setFormVenue('');
    setFormSeat('');
    setFormNotes('');
    setFormType('Final');
  };

  const handleStartBlank = (openAi = false) => {
    setSavedExamId(null);
    setMeta({
      title: 'End-Semester Examinations',
      subtitle: 'Official Exam Schedule',
      timeFormat: '12h',
    });
    setExams([]);
    resetManualForm();
    setView('editor');
    if (openAi) {
      setAiModalOpen(true);
    }
  };

  const handleOpenExistingExam = async (id: string) => {
    if (!user) return;
    try {
      const rec = await getUserExamTimetable(user.uid, id);
      if (!rec) {
        onToast('Exam timetable not found.', 'err');
        return;
      }
      setSavedExamId(rec.id);
      setMeta(rec.meta);
      setExams(rec.exams);
      setTemplateId(rec.templateId);
      resetManualForm();
      setView('editor');
    } catch {
      onToast('Could not load exam timetable.', 'err');
    }
  };

  const handleDuplicateExam = async (id: string, openAfter = false) => {
    if (!user) return;
    try {
      const copy = await duplicateUserExamTimetable(user.uid, id);
      if (!copy) return;
      await refreshExamList();
      onToast(`Duplicated "${copy.meta.title}"`);
      if (openAfter) {
        setSavedExamId(copy.id);
        setMeta(copy.meta);
        setExams(copy.exams);
        setTemplateId(copy.templateId);
        resetManualForm();
        setView('editor');
      }
    } catch {
      onToast('Could not duplicate exam timetable.', 'err');
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!user) return;
    try {
      await deleteUserExamTimetable(user.uid, id);
      setExamList((prev) => prev.filter((item) => item.id !== id));
      if (savedExamId === id) {
        setSavedExamId(null);
      }
      onToast('Deleted exam timetable.');
    } catch {
      onToast('Could not delete exam timetable.', 'err');
    }
  };

  const handleSeedFromSubjects = (sourceTitle: string, sourceSubjects: SubjectEntry[], tplId?: PresetTemplateId) => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 7);

    const seeded: ExamEntry[] = sourceSubjects.map((sub, idx) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + idx * 2);
      return {
        id: `exam-seed-${Date.now()}-${idx}`,
        subjectName: sub.name,
        courseCode: sub.code || '',
        examDate: d.toISOString().slice(0, 10),
        startTime: '09:30',
        endTime: '12:30',
        venue: sub.room || 'Main Exam Hall',
        seatNumber: '',
        examType: 'Final',
        notes: '',
        accentDot: sub.accentDot || ACCENT_DOTS[idx % ACCENT_DOTS.length],
      };
    });

    setSavedExamId(null);
    setMeta({
      title: `${sourceTitle || 'Semester'} · Exams`,
      subtitle: 'Adjust dates, halls & seat numbers below',
      timeFormat: '12h',
    });
    setExams(seeded);
    if (tplId) setTemplateId(tplId);
    resetManualForm();
    setView('editor');
    onToast(`Loaded ${seeded.length} subjects into Exam Timetable — update dates & halls.`);
  };

  const handleSeedFromSavedTimetable = async (summary: SavedTimetableSummary) => {
    if (!user) return;
    try {
      const rec = await getUserTimetable(user.uid, summary.id);
      if (!rec) return;
      handleSeedFromSubjects(rec.meta.title, rec.subjects, rec.templateId);
    } catch {
      onToast('Could not load weekly timetable.', 'err');
    }
  };

  const handleSaveCurrent = async () => {
    if (!user) {
      onToast('Please sign in to save your exam timetable.', 'err');
      return;
    }
    setSaving(true);
    try {
      const id = await saveUserExamTimetable(
        user.uid,
        { meta, exams, templateId },
        savedExamId
      );
      setSavedExamId(id);
      await refreshExamList();
      onToast(savedExamId ? 'Exam timetable updated!' : 'Exam timetable saved!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save exam timetable.';
      onToast(msg, 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitExamForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) {
      onToast('Enter a subject name.', 'err');
      return;
    }
    if (!formDate) {
      onToast('Select an exam date.', 'err');
      return;
    }

    if (editingExamId) {
      setExams((prev) =>
        prev.map((item) =>
          item.id === editingExamId
            ? {
                ...item,
                subjectName: formSubject.trim(),
                courseCode: formCode.trim(),
                examDate: formDate,
                startTime: formStart,
                endTime: formEnd,
                venue: formVenue.trim(),
                seatNumber: formSeat.trim(),
                examType: formType,
                notes: formNotes.trim(),
              }
            : item
        )
      );
      onToast('Updated exam entry.');
    } else {
      const next: ExamEntry = {
        id: `exam-${Date.now()}`,
        subjectName: formSubject.trim(),
        courseCode: formCode.trim(),
        examDate: formDate,
        startTime: formStart,
        endTime: formEnd,
        venue: formVenue.trim(),
        seatNumber: formSeat.trim(),
        examType: formType,
        notes: formNotes.trim(),
        accentDot: ACCENT_DOTS[exams.length % ACCENT_DOTS.length],
      };
      setExams((prev) => [...prev, next]);
      onToast(`Added ${next.subjectName}`);
    }
    resetManualForm();
  };

  const startEditExamEntry = (exam: ExamEntry) => {
    setEditingExamId(exam.id);
    setFormSubject(exam.subjectName);
    setFormCode(exam.courseCode);
    setFormDate(exam.examDate);
    setFormStart(exam.startTime);
    setFormEnd(exam.endTime);
    setFormVenue(exam.venue);
    setFormSeat(exam.seatNumber ?? '');
    setFormType(exam.examType ?? 'Final');
    setFormNotes(exam.notes ?? '');
  };

  // Exports (PNG, PDF, Wallpaper, ICS, JSON — NO Share)
  const fileSlug =
    (meta.title || 'gridwiser-exams')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'gridwiser-exams';

  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    setExportingPng(true);
    try {
      const dataUrl = await safeToPng(canvasRef.current, {
        pixelRatio: 3,
        backgroundColor: activeTemplate.tokens.canvasBg,
      });
      const link = document.createElement('a');
      link.download = `${fileSlug}.png`;
      link.href = dataUrl;
      link.click();
      onToast('Exported 3× Exam PNG.');
    } catch {
      onToast('PNG export failed.', 'err');
    } finally {
      setExportingPng(false);
    }
  };

  const handleExportPdf = async () => {
    if (!canvasRef.current) return;
    setExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const dataUrl = await safeToPng(canvasRef.current, {
        pixelRatio: 3,
        backgroundColor: activeTemplate.tokens.canvasBg,
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });
      const pad = 24;
      const w = Math.round(img.naturalWidth / 3);
      const h = Math.round(img.naturalHeight / 3);
      const pageW = w + pad * 2;
      const pageH = h + pad * 2;
      const pdf = new jsPDF({
        orientation: pageW >= pageH ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pageW, pageH],
        hotfixes: ['px_scaling'],
      });
      pdf.setFillColor(activeTemplate.tokens.canvasBg);
      pdf.rect(0, 0, pageW, pageH, 'F');
      pdf.addImage(dataUrl, 'PNG', pad, pad, w, h);
      pdf.save(`${fileSlug}.pdf`);
      onToast('Exported Exam PDF.');
    } catch {
      onToast('PDF export failed.', 'err');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportWallpaper = async (format: WallpaperFormat) => {
    if (!canvasRef.current) return;
    setExportingWallpaper(format);
    try {
      await exportTimetableWallpaper({
        node: canvasRef.current,
        template: activeTemplate,
        title: meta.title || 'Exam Timetable',
        format,
      });
      onToast(
        format === 'lockscreen'
          ? 'Downloaded 9:16 Phone Lockscreen!'
          : 'Downloaded 16:9 Desktop Wallpaper!'
      );
    } catch {
      onToast('Wallpaper export failed.', 'err');
    } finally {
      setExportingWallpaper(null);
    }
  };

  const handleExportIcs = () => {
    if (exams.length === 0) {
      onToast('Add exams before exporting .ICS calendar.', 'err');
      return;
    }
    const ics = generateExamICS(exams, meta);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileSlug}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Downloaded .ICS Exam Calendar.');
  };

  const handleExportJson = () => {
    const payload = JSON.stringify({ meta, exams, templateId }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileSlug}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Downloaded Exam JSON backup.');
  };

  const sortedExams = useMemo(
    () =>
      [...exams].sort((a, b) =>
        `${a.examDate}T${a.startTime}`.localeCompare(`${b.examDate}T${b.startTime}`)
      ),
    [exams]
  );

  // =========================================================================
  // HUB / CHOOSER VIEW
  // =========================================================================
  if (view === 'hub') {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#1E1E26] pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
              <GraduationCap className="h-3 w-3" />
              Private · Export Only
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-white">
              Exam Timetable Generator
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Create a new chronological exam schedule, import from AI, or duplicate &amp; edit an existing timetable.
            </p>
          </div>
        </div>

        {/* Step 1: Create New vs Import */}
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleStartBlank(false)}
            className="group flex items-start gap-4 rounded-2xl border border-[#22222C] bg-[#111116] p-5 text-left transition hover:border-blue-500/50 hover:bg-[#141620]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Create Exam Timetable Manually</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Start fresh and enter each exam&apos;s date, time, hall/venue, seat number, and notes.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleStartBlank(true)}
            className="group flex items-start gap-4 rounded-2xl border border-[#22222C] bg-[#111116] p-5 text-left transition hover:border-violet-500/50 hover:bg-[#151320]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Create Using AI Prompt</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Copy our Exam AI prompt, paste your university date-sheet into ChatGPT/Claude/local AI, and import the JSON.
              </p>
            </div>
          </button>
        </div>

        {/* Step 2: Existing Saved Exam Timetables (Edit / Duplicate / Delete) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Your Saved Exam Timetables ({examList.length})
            </h2>
          </div>

          {loadingList ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#202026] bg-[#101014] p-5 text-xs text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading exam timetables...
            </div>
          ) : examList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#262630] bg-[#0D0D11] p-6 text-center text-xs text-zinc-500">
              No saved exam timetables yet. Create one above or convert one of your existing class timetables below.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {examList.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-[#22222B] bg-[#111115] p-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-white">
                        {item.title}
                      </h3>
                      <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/70 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                        {item.examCount} exams
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="mt-1 truncate text-xs text-zinc-400">{item.subtitle}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => void handleOpenExistingExam(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-[#09090B] transition hover:bg-zinc-200"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDuplicateExam(item.id, true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#2A2A35] bg-[#181820] px-3 py-1.5 text-[11px] font-medium text-zinc-200 transition hover:border-zinc-500"
                    >
                      <Copy className="h-3 w-3" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteExam(item.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1.5 text-[11px] text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                      title="Delete exam timetable"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Convert from Existing Class Timetables */}
        {(currentSubjects.length > 0 || savedTimetables.length > 0) && (
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Use Subjects from an Existing Timetable
              </h2>
              <p className="text-xs text-zinc-500">
                Pre-fill your exam schedule with subjects from any weekly timetable, then add exam dates &amp; halls.
              </p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {currentSubjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSeedFromSubjects('Current Studio', currentSubjects, initialTemplateId)}
                  className="flex items-center justify-between rounded-xl border border-[#22222C] bg-[#101014] px-3.5 py-3 text-left transition hover:border-blue-500/40"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-white">
                      Current Active Subjects
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {currentSubjects.length} subjects
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-blue-500/15 px-2 py-1 text-[10px] font-semibold text-blue-300">
                    Use
                  </span>
                </button>
              )}
              {savedTimetables.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => void handleSeedFromSavedTimetable(st)}
                  className="flex items-center justify-between rounded-xl border border-[#22222C] bg-[#101014] px-3.5 py-3 text-left transition hover:border-blue-500/40"
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate text-xs font-semibold text-white">
                      {st.title || 'Untitled Timetable'}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {st.subjectCount} subjects
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-zinc-200">
                    Use
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <ExamAiModal
          open={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          onImport={(payload) => {
            setMeta((prev) => ({ ...prev, ...payload.meta }));
            setExams(payload.exams);
            onToast(`Imported ${payload.exams.length} exams!`);
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // EDITOR + LIVE PREVIEW VIEW
  // =========================================================================
  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      {/* Top Toolbar (No Share Button) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#202026] bg-[#121215] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('hub')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#282832] bg-[#0B0B0E] px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Exam Schedules
          </button>
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-violet-300 transition hover:bg-violet-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Import
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {savedExamId && (
            <button
              type="button"
              onClick={() => void handleDuplicateExam(savedExamId, true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#282832] bg-[#0B0B0E] px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 transition hover:border-zinc-500"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveCurrent()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#282832] bg-[#181820] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:border-zinc-500 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savedExamId ? 'Update' : 'Save'}
          </button>

          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportMenuOpen((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-[#09090B] transition hover:bg-zinc-200"
            >
              Export
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-[#27272F] bg-[#0D0E12] p-1.5 shadow-2xl">
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
                    {exportingPng ? 'Rendering...' : '3× Ultra Retina'}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">PNG</span>
                </button>
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
                    {exportingPdf ? 'Exporting...' : 'Print-Ready'}
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
                    Phone Lockscreen
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
                    Desktop Wallpaper
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
                    Exam Calendar Feed
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
                    Exam Backup
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Theme Quick Switcher */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[#202026] bg-[#101014] px-3 py-2">
        <span className="mr-1 shrink-0 text-[11px] text-zinc-500">Theme:</span>
        {allTemplates.map((tpl) => {
          const active = tpl.id === templateId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setTemplateId(tpl.id)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                active
                  ? 'bg-white text-[#09090B]'
                  : 'text-zinc-400 hover:bg-[#1C1C22] hover:text-zinc-200'
              }`}
            >
              {tpl.name}
            </button>
          );
        })}
      </div>

      {/* Split Builder & Chronological Exam Preview */}
      <div className="grid items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left Manual Exam Builder */}
        <div className="space-y-4 rounded-2xl border border-[#202026] bg-[#101014] p-4">
          <div className="space-y-2.5 border-b border-[#1E1E24] pb-3.5">
            <div className="text-xs font-semibold text-white">Exam Session Info</div>
            <input
              type="text"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              placeholder="Exam Title (e.g. Fall Finals 2026)"
              className="w-full rounded-lg border border-[#25252E] bg-[#0A0A0D] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={meta.subtitle}
                onChange={(e) => setMeta({ ...meta, subtitle: e.target.value })}
                placeholder="Subtitle / Branch"
                className="flex-1 rounded-lg border border-[#25252E] bg-[#0A0A0D] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setMeta({
                    ...meta,
                    timeFormat: meta.timeFormat === '12h' ? '24h' : '12h',
                  })
                }
                className="rounded-lg border border-[#25252E] bg-[#0A0A0D] px-2.5 py-1.5 font-mono text-[11px] text-zinc-300"
              >
                {meta.timeFormat}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmitExamForm} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                {editingExamId ? 'Edit Exam Entry' : 'Add Exam Manually'}
              </span>
              {editingExamId && (
                <button
                  type="button"
                  onClick={resetManualForm}
                  className="text-[11px] text-zinc-400 hover:text-white"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <input
              type="text"
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              placeholder="Subject Name *"
              className="w-full rounded-lg border border-[#25252E] bg-[#0A0A0D] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Course Code"
                className="rounded-lg border border-[#25252E] bg-[#0A0A0D] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as ExamType)}
                className="rounded-lg border border-[#25252E] bg-[#0A0A0D] px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <GridDatePicker
                value={formDate}
                onChange={setFormDate}
                placeholder="Exam date"
              />
              <GridTimePicker
                value={formStart}
                onChange={setFormStart}
                timeFormat={meta.timeFormat}
              />
              <GridTimePicker
                value={formEnd}
                onChange={setFormEnd}
                timeFormat={meta.timeFormat}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
                placeholder="Venue / Exam Hall"
                className="rounded-lg border border-[#25252E] bg-[#0A0A0D] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                value={formSeat}
                onChange={(e) => setFormSeat(e.target.value)}
                placeholder="Seat / Roll No."
                className="rounded-lg border border-[#25252E] bg-[#0A0A0D] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Notes (e.g. Calculator allowed)"
              className="w-full rounded-lg border border-[#25252E] bg-[#0A0A0D] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
            >
              <Plus className="h-3.5 w-3.5" />
              {editingExamId ? 'Update Exam Entry' : 'Add Exam'}
            </button>
          </form>

          {sortedExams.length > 0 && (
            <div className="space-y-1.5 border-t border-[#1E1E24] pt-3">
              <div className="text-[11px] font-medium text-zinc-400">
                Scheduled Exams ({sortedExams.length})
              </div>
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {sortedExams.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#1E1E26] bg-[#0B0B0E] px-2.5 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => startEditExamEntry(ex)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-xs font-medium text-white">
                        {ex.subjectName}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500">
                        {ex.examDate} · {ex.startTime}–{ex.endTime}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExams((prev) => prev.filter((item) => item.id !== ex.id))
                      }
                      className="rounded p-1 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                      title="Remove exam"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Live Chronological Exam Preview */}
        <div className="min-w-0 overflow-x-auto">
          <ExamTimetableRenderer
            meta={meta}
            exams={exams}
            template={activeTemplate}
            canvasRef={canvasRef}
            onClickExam={startEditExamEntry}
          />
          <p className="mt-2 text-center text-[11px] text-zinc-500">
            Click any exam row above to edit its date, time, hall, or seat number. Exam schedules are private and export-only.
          </p>
        </div>
      </div>

      <ExamAiModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onImport={(payload) => {
          setMeta((prev) => ({ ...prev, ...payload.meta }));
          setExams(payload.exams);
          onToast(`Imported ${payload.exams.length} exams!`);
        }}
      />
    </div>
  );
}
