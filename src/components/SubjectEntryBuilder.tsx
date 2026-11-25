'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Trash2, Edit3, Check, X, Clock, Layers } from 'lucide-react';
import {
  ALL_DAYS,
  type DayOfWeek,
  type OverlapConflict,
  type SubjectEntry,
  type SubjectOccurrence,
} from '@/types/timetable';
import { SUBJECT_DOT_TONES } from '@/lib/themes';
import { analyzeSchedule, markOccurrencesAsMerged } from '@/lib/schedule-engine';
import { OverlapAlertModal } from '@/components/OverlapAlertModal';
import { SPRING_PILL, TRANSITION_FAST } from '@/components/MotionPrimitives';

let localSeq = 1;
function nextId(prefix: string): string {
  localSeq += 1;
  return `${prefix}-${Date.now()}-${localSeq}`;
}

const DEFAULT_DAYS_CYCLE: DayOfWeek[] = ['Mon', 'Wed', 'Fri', 'Tue', 'Thu', 'Sat', 'Sun'];

interface SubjectEntryBuilderProps {
  subjects: SubjectEntry[];
  timeFormat?: '12h' | '24h';
  onChangeSubjects: (next: SubjectEntry[]) => void;
  compact?: boolean;
}

export function SubjectEntryBuilder({
  subjects,
  timeFormat = '24h',
  onChangeSubjects,
  compact = false,
}: SubjectEntryBuilderProps) {
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [room, setRoom] = useState('');
  const [instructor, setInstructor] = useState('');
  const [accentDot, setAccentDot] = useState(SUBJECT_DOT_TONES[0]);
  const [occurrences, setOccurrences] = useState<SubjectOccurrence[]>([
    { id: 'init-1', day: 'Mon', startTime: '09:00', endTime: '10:00' },
  ]);

  // Pending overlap confirmation when adding/updating a subject
  const [pendingCandidateSubjects, setPendingCandidateSubjects] = useState<
    SubjectEntry[] | null
  >(null);
  const [pendingConflicts, setPendingConflicts] = useState<OverlapConflict[]>([]);

  const setOccurrenceCount = (count: number) => {
    const safe = Math.max(1, Math.min(7, count));
    setOccurrences((prev) => {
      if (safe === prev.length) return prev;
      if (safe < prev.length) return prev.slice(0, safe);
      const next = [...prev];
      const base = prev[prev.length - 1] ?? {
        startTime: '09:00',
        endTime: '10:00',
      };
      while (next.length < safe) {
        const usedDays = new Set(next.map((o) => o.day));
        const nextDay =
          DEFAULT_DAYS_CYCLE.find((d) => !usedDays.has(d)) ??
          DEFAULT_DAYS_CYCLE[next.length % DEFAULT_DAYS_CYCLE.length];
        next.push({
          id: nextId('occ'),
          day: nextDay,
          startTime: base.startTime,
          endTime: base.endTime,
        });
      }
      return next;
    });
  };

  const updateOccurrence = (
    idx: number,
    patch: Partial<Omit<SubjectOccurrence, 'id'>>
  ) => {
    setOccurrences((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, ...patch, mergedOverlap: false } : o))
    );
  };

  const resetForm = (nextToneIdx: number) => {
    setEditingSubjectId(null);
    setName('');
    setCode('');
    setRoom('');
    setInstructor('');
    setAccentDot(SUBJECT_DOT_TONES[nextToneIdx % SUBJECT_DOT_TONES.length]);
    setOccurrences([
      { id: nextId('occ'), day: 'Mon', startTime: '09:00', endTime: '10:00' },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanOccs = occurrences.map((o) => ({
      ...o,
      id: o.id.startsWith('init-') ? nextId('occ') : o.id,
    }));

    const entry: SubjectEntry = {
      id: editingSubjectId ?? nextId('subj'),
      name: name.trim(),
      code: code.trim(),
      room: room.trim(),
      instructor: instructor.trim(),
      accentDot,
      occurrences: cleanOccs,
    };

    const candidateList = editingSubjectId
      ? subjects.map((s) => (s.id === editingSubjectId ? entry : s))
      : [...subjects, entry];

    const check = analyzeSchedule(candidateList, {
      title: '',
      subtitle: '',
      timeFormat,
      showWeekend: true,
    });

    if (check.unresolvedOverlaps.length > 0) {
      // Alert user immediately before committing, allowing Merge or Edit
      setPendingCandidateSubjects(candidateList);
      setPendingConflicts(check.unresolvedOverlaps);
      return;
    }

    onChangeSubjects(candidateList);
    resetForm(candidateList.length);
  };

  const handleMergePending = (occurrenceIds: string[]) => {
    if (!pendingCandidateSubjects) return;
    const updated = markOccurrencesAsMerged(pendingCandidateSubjects, occurrenceIds);
    const recheck = analyzeSchedule(updated, {
      title: '',
      subtitle: '',
      timeFormat,
      showWeekend: true,
    });
    if (recheck.unresolvedOverlaps.length === 0) {
      onChangeSubjects(updated);
      setPendingCandidateSubjects(null);
      setPendingConflicts([]);
      resetForm(updated.length);
    } else {
      setPendingCandidateSubjects(updated);
      setPendingConflicts(recheck.unresolvedOverlaps);
    }
  };

  const handleMergeAllPending = () => {
    if (!pendingCandidateSubjects) return;
    const allIds = pendingConflicts.flatMap((c) => c.blocks.map((b) => b.occurrenceId));
    const updated = markOccurrencesAsMerged(pendingCandidateSubjects, allIds);
    onChangeSubjects(updated);
    setPendingCandidateSubjects(null);
    setPendingConflicts([]);
    resetForm(updated.length);
  };

  const startEdit = (subj: SubjectEntry) => {
    setEditingSubjectId(subj.id);
    setName(subj.name);
    setCode(subj.code);
    setRoom(subj.room);
    setInstructor(subj.instructor);
    setAccentDot(subj.accentDot);
    setOccurrences(subj.occurrences.map((o) => ({ ...o })));
  };

  const deleteSubject = (id: string) => {
    onChangeSubjects(subjects.filter((s) => s.id !== id));
    if (editingSubjectId === id) {
      resetForm(subjects.length);
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[#222228] bg-[#131317] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">
              {editingSubjectId ? 'Edit Subject' : 'Add Subject'}
            </h3>
            <p className="text-xs text-zinc-500">
              Specify the subject, weekly occurrences, and exact day/time for each session.
            </p>
          </div>
          {editingSubjectId && (
            <button
              type="button"
              onClick={() => resetForm(subjects.length)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#27272F] px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          )}
        </div>

        <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-12'}`}>
          <div className={compact ? '' : 'sm:col-span-5'}>
            <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
              Subject Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Structures"
              className="w-full rounded-lg border border-[#25252C] bg-[#0B0B0D] px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition focus:border-zinc-500"
            />
          </div>

          <div className={compact ? '' : 'sm:col-span-2'}>
            <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
              Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="CS 201"
              className="w-full rounded-lg border border-[#25252C] bg-[#0B0B0D] px-3 py-2 font-mono text-xs text-white placeholder-zinc-600 outline-none transition focus:border-zinc-500"
            />
          </div>

          <div className={compact ? '' : 'sm:col-span-3'}>
            <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
              Room / Location
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Room 304"
              className="w-full rounded-lg border border-[#25252C] bg-[#0B0B0D] px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition focus:border-zinc-500"
            />
          </div>

          <div className={compact ? '' : 'sm:col-span-2'}>
            <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
              Per Week
            </label>
            <select
              value={occurrences.length}
              onChange={(e) => setOccurrenceCount(Number(e.target.value))}
              className="w-full rounded-lg border border-[#25252C] bg-[#0B0B0D] px-2.5 py-2 text-xs text-white outline-none focus:border-zinc-500"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'time' : 'times'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`mt-3 grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
              Instructor (optional)
            </label>
            <input
              type="text"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="e.g. Prof. Alan Grant"
              className="w-full rounded-lg border border-[#25252C] bg-[#0B0B0D] px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
              Marker Dot
            </label>
            <div className="flex h-[34px] items-center gap-2 rounded-lg border border-[#25252C] bg-[#0B0B0D] px-3">
              {SUBJECT_DOT_TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setAccentDot(tone)}
                  className={`h-3.5 w-3.5 rounded-full transition-transform ${
                    accentDot === tone
                      ? 'scale-125 ring-2 ring-white/80'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: tone }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400">
              Weekly Occurrences ({occurrences.length})
            </span>
            <span className="text-[11px] text-zinc-500">Weekday & exact time</span>
          </div>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {occurrences.map((occ, idx) => (
                <motion.div
                  key={occ.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={TRANSITION_FAST}
                  className="grid grid-cols-2 gap-2 rounded-lg border border-[#222229] bg-[#0B0B0D] p-2.5 sm:grid-cols-[auto_1fr_1fr_1fr] sm:items-center sm:p-2"
                >
                <div className="col-span-2 flex items-center gap-2 sm:contents">
                  <span className="px-1 font-mono text-[10px] text-zinc-500">
                    #{idx + 1}
                  </span>

                  <select
                    value={occ.day}
                    onChange={(e) =>
                      updateOccurrence(idx, { day: e.target.value as DayOfWeek })
                    }
                    className="flex-1 rounded-md border border-[#25252C] bg-[#141418] px-2.5 py-1.5 text-xs font-medium text-zinc-100 outline-none sm:flex-initial"
                  >
                    {ALL_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="time"
                  value={occ.startTime}
                  onChange={(e) => updateOccurrence(idx, { startTime: e.target.value })}
                  aria-label={`Occurrence ${idx + 1} start time`}
                  className="w-full rounded-md border border-[#25252C] bg-[#141418] px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none"
                />

                <input
                  type="time"
                  value={occ.endTime}
                  onChange={(e) => updateOccurrence(idx, { endTime: e.target.value })}
                  aria-label={`Occurrence ${idx + 1} end time`}
                  className="w-full rounded-md border border-[#25252C] bg-[#141418] px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none"
                />
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!name.trim()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200 disabled:opacity-40 sm:w-auto sm:py-2"
          >
            {editingSubjectId ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Update Subject
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Add Subject
              </>
            )}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Entered Subjects ({subjects.length})</span>
          {subjects.length > 0 && (
            <span>
              {subjects.reduce((acc, s) => acc + s.occurrences.length, 0)} weekly sessions
            </span>
          )}
        </div>

        {subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={TRANSITION_FAST}
            className="rounded-xl border border-dashed border-[#25252C] bg-[#0F0F12]/50 py-10 text-center"
          >
            <Clock className="mx-auto mb-2 h-5 w-5 text-zinc-600" />
            <p className="text-xs font-medium text-zinc-400">No subjects added yet</p>
            <p className="mt-0.5 text-[11px] text-zinc-600">
              Add your first subject and its weekly class times above.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {subjects.map((subj) => (
                <motion.div
                  key={subj.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={SPRING_PILL}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-[#222228] bg-[#131317] p-3.5 sm:flex-row sm:items-center"
                >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: subj.accentDot }}
                    />
                    {subj.code && (
                      <span className="rounded border border-[#27272F] bg-[#0B0B0D] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                        {subj.code}
                      </span>
                    )}
                    <span className="truncate text-xs font-semibold text-white">
                      {subj.name}
                    </span>
                    {subj.room && (
                      <span className="text-[11px] text-zinc-500">· {subj.room}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pl-4">
                    {subj.occurrences.map((occ) => (
                      <span
                        key={occ.id}
                        className="inline-flex items-center gap-1 rounded-md border border-[#22222A] bg-[#0B0B0D] px-2 py-0.5 font-mono text-[10px] text-zinc-300"
                      >
                        {occ.day} {occ.startTime}–{occ.endTime}
                        {occ.mergedOverlap && (
                          <Layers
                            className="h-2.5 w-2.5 text-zinc-400"
                            aria-label="Merged overlap"
                          />
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => startEdit(subj)}
                    className="rounded-lg border border-[#25252C] bg-[#0B0B0D] p-1.5 text-zinc-400 hover:border-zinc-600 hover:text-white"
                    title="Edit subject"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSubject(subj.id)}
                    className="rounded-lg border border-[#25252C] bg-[#0B0B0D] p-1.5 text-zinc-400 hover:border-zinc-600 hover:text-rose-400"
                    title="Delete subject"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Overlap Detection Modal when adding/editing a subject */}
      <OverlapAlertModal
        conflicts={pendingConflicts}
        timeFormat={timeFormat}
        onClose={() => {
          setPendingCandidateSubjects(null);
          setPendingConflicts([]);
        }}
        onMergeConflict={handleMergePending}
        onMergeAll={handleMergeAllPending}
      />
    </div>
  );
}
