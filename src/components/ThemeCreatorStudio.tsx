'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Palette,
  Sparkles,
  Save,
  Share2,
  Copy,
  Check,
  Type,
  Layout,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import {
  deleteUserCustomTemplate,
  listUserCustomTemplates,
  publishSharedCustomTemplate,
  saveUserCustomTemplate,
} from '@/lib/firestore-timetables';
import { PRESET_TEMPLATES } from '@/lib/themes';
import { CURATED_THEME_PALETTES, type CuratedPalettePreset } from '@/lib/ai-theme-parser';
import { TimetableRenderer } from '@/components/TimetableRenderer';
import { ThemeAiModal } from '@/components/ThemeAiModal';
import {
  AnimatedModalShell,
  SPRING_PILL,
} from '@/components/MotionPrimitives';
import type {
  AnalyzedSchedule,
  CustomTemplateDefinition,
  DayOfWeek,
  PresetLayoutKind,
  TemplateFontFamily,
  TimetableMeta,
} from '@/types/timetable';
import { toPresetTemplate } from '@/types/timetable';

// Mock schedule data for previewing the theme live
const SAMPLE_META: TimetableMeta = {
  title: 'Engineering Term 4',
  subtitle: 'Automated Room Allocations',
  timeFormat: '24h',
  showWeekend: false,
};

const SAMPLE_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const SAMPLE_SCHEDULE: AnalyzedSchedule = {
  days: SAMPLE_DAYS,
  minHour: 8,
  maxHour: 18,
  blocks: [
    {
      occurrenceId: 'o1',
      subjectId: 's1',
      name: 'Advanced Algorithms',
      code: 'CS-401',
      room: 'Hall B',
      instructor: 'Dr. Aris Thorne',
      accentDot: '#3B82F6',
      day: 'Mon',
      startTime: '09:00',
      endTime: '10:30',
      startMin: 540,
      endMin: 630,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o3',
      subjectId: 's2',
      name: 'Embedded Systems Lab',
      code: 'EE-310',
      room: 'Lab 4',
      instructor: 'Prof. Miller',
      accentDot: '#10B981',
      day: 'Mon',
      startTime: '11:00',
      endTime: '13:00',
      startMin: 660,
      endMin: 780,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o5',
      subjectId: 's3',
      name: 'Distributed Cloud Architecture',
      code: 'CS-420',
      room: 'Virtual 2',
      instructor: 'Sarah Jenkins',
      accentDot: '#F59E0B',
      day: 'Tue',
      startTime: '10:00',
      endTime: '11:30',
      startMin: 600,
      endMin: 690,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o2',
      subjectId: 's1',
      name: 'Advanced Algorithms',
      code: 'CS-401',
      room: 'Hall B',
      instructor: 'Dr. Aris Thorne',
      accentDot: '#3B82F6',
      day: 'Wed',
      startTime: '09:00',
      endTime: '10:30',
      startMin: 540,
      endMin: 630,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o7',
      subjectId: 's4',
      name: 'Quantum Logic & Cryptography',
      code: 'CS-480',
      room: 'Seminar Room',
      instructor: 'Dr. V. Rao',
      accentDot: '#EC4899',
      day: 'Wed',
      startTime: '13:00',
      endTime: '14:30',
      startMin: 780,
      endMin: 870,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o8',
      subjectId: 's4',
      name: 'Quantum Logic & Cryptography',
      code: 'CS-480',
      room: 'Seminar Room',
      instructor: 'Dr. V. Rao',
      accentDot: '#EC4899',
      day: 'Thu',
      startTime: '10:00',
      endTime: '11:30',
      startMin: 600,
      endMin: 690,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o4',
      subjectId: 's2',
      name: 'Embedded Systems Lab',
      code: 'EE-310',
      room: 'Lab 4',
      instructor: 'Prof. Miller',
      accentDot: '#10B981',
      day: 'Thu',
      startTime: '14:00',
      endTime: '16:00',
      startMin: 840,
      endMin: 960,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
    {
      occurrenceId: 'o6',
      subjectId: 's3',
      name: 'Distributed Cloud Architecture',
      code: 'CS-420',
      room: 'Virtual 2',
      instructor: 'Sarah Jenkins',
      accentDot: '#F59E0B',
      day: 'Fri',
      startTime: '10:00',
      endTime: '11:30',
      startMin: 600,
      endMin: 690,
      mergedOverlap: false,
      hasConflict: false,
      lane: 0,
      laneCount: 1,
    },
  ],
  mergedGroups: [],
  unresolvedOverlaps: [],
  stats: {
    totalSubjects: 4,
    totalSessions: 8,
    totalHours: 13,
    busiestDay: 'Mon',
    conflictCount: 0,
  },
};

const AVAILABLE_LAYOUTS: Array<{ id: PresetLayoutKind; label: string; desc: string }> = [
  { id: 'cron-sidebar-grid', label: 'Cron Studio (Grid)', desc: 'Pro horizontal time axis & subtle lanes' },
  { id: 'bento-dashboard', label: 'Sapphire Bento', desc: 'Asymmetric widget cards with weekly focus tiles' },
  { id: 'crimson-pulse', label: 'Crimson Pulse', desc: 'Ruby gradient banner with summary load bar' },
  { id: 'horizontal-timeline', label: 'Swiss Timeline', desc: 'Clean horizontal day rows' },
  { id: 'magazine-spread', label: 'Editorial Journal', desc: 'Serif typographic newspaper aesthetic' },
  { id: 'day-columns', label: 'Linear Columns', desc: 'Vertical day column lanes' },
  { id: 'terminal-table', label: 'Terminal Index', desc: 'Monospace engineering monospace table' },
  { id: 'poster-tiles', label: 'Poster Tiles', desc: 'Punchy retro bold cards' },
];

const AVAILABLE_FONTS: Array<{ id: TemplateFontFamily; label: string }> = [
  { id: 'inter', label: 'Inter' },
  { id: 'geist', label: 'Geist' },
  { id: 'plus-jakarta', label: 'Plus Jakarta' },
  { id: 'space-grotesk', label: 'Space Grotesk' },
  { id: 'dm-sans', label: 'DM Sans' },
  { id: 'newsreader', label: 'Newsreader (Serif)' },
  { id: 'syne', label: 'Syne (Display)' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono' },
];

export function ThemeCreatorStudio() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'colors' | 'layout' | 'typography' | 'saved'>('colors');

  // Working template definition
  const [template, setTemplate] = useState<CustomTemplateDefinition>({
    id: 'custom-draft',
    name: 'Cyberpunk Neon',
    category: 'Futuristic',
    description: 'High contrast dark canvas with hot pink accent borders.',
    layout: 'cron-sidebar-grid',
    bgPattern: 'dots',
    mode: 'dark',
    displayFont: 'space-grotesk',
    bodyFont: 'inter',
    monoFamily: 'geist-mono',
    radiusPx: 14,
    tokens: {
      canvasBg: '#090812',
      surfaceBg: '#120F24',
      cardBg: '#191533',
      cardElevatedBg: '#231E44',
      border: '#312A5C',
      borderStrong: '#4B3F8A',
      text: '#F3F0FF',
      textMuted: '#9D95C4',
      accent: '#EC4899',
      accentSoft: 'rgba(236, 72, 153, 0.16)',
    },
  });

  const [savedTemplates, setSavedTemplates] = useState<CustomTemplateDefinition[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (text: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser) {
        try {
          const list = await listUserCustomTemplates(currUser.uid);
          setSavedTemplates(list);
        } catch {
          // ignore
        }
      }
    });
    return () => unsub();
  }, []);

  const handleApplyPresetBase = (presetId: string) => {
    const base = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!base) return;
    setTemplate((prev) => ({
      ...prev,
      name: `${base.name} (Custom Remix)`,
      layout: base.layout,
      bgPattern: base.bgPattern,
      mode: base.mode,
      displayFont: base.displayFont,
      bodyFont: base.bodyFont,
      monoFamily: base.monoFamily,
      radiusPx: base.radiusPx,
      tokens: { ...base.tokens },
    }));
    showToast(`Loaded base style from "${base.name}"`);
  };

  const handleSaveTemplate = async () => {
    if (!user) {
      showToast('Please sign in to save your custom theme.', 'err');
      return;
    }
    setIsSaving(true);
    try {
      const templateId = await saveUserCustomTemplate(
        user.uid,
        template,
        template.id && !template.id.startsWith('custom-draft') && template.id.startsWith('custom-')
          ? template.id
          : null
      );
      setTemplate((prev) => ({ ...prev, id: templateId }));
      const updated = await listUserCustomTemplates(user.uid);
      setSavedTemplates(updated);
      showToast('Theme saved to your account!');
    } catch (err) {
      console.error('Save custom template error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save theme. Please try again.';
      showToast(msg, 'err');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareTemplate = async () => {
    if (!user) {
      showToast('Please sign in to publish and share your theme.', 'err');
      return;
    }
    setIsSaving(true);
    try {
      const pubShareId = await publishSharedCustomTemplate(
        user.uid,
        template,
        user.displayName ?? 'Creator',
        shareId
      );
      setShareId(pubShareId);
      setShareModalOpen(true);
      showToast('Public theme link generated!');
    } catch {
      showToast('Could not share theme.', 'err');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    if (!user) return;
    try {
      await deleteUserCustomTemplate(user.uid, id);
      setSavedTemplates((prev) => prev.filter((t) => t.id !== id));
      showToast('Deleted custom theme.');
    } catch {
      showToast('Delete failed.', 'err');
    }
  };

  const activePresetPreview = useMemo(() => toPresetTemplate(template), [template]);

  return (
    <div className="flex min-h-screen flex-col bg-[#08080A] text-zinc-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#1E1E24] bg-[#0E0E12]/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#26262F] bg-[#141418] px-2.5 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Studio</span>
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-semibold tracking-tight text-white sm:text-sm">
              Theme Creator
            </span>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              Beta
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Theme Generator</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleShareTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#272732] bg-[#131318] px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Theme'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Editor Sidebar on Left, Live Canvas on Right */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Control Panel */}
        <aside className="w-full shrink-0 border-b border-[#1E1E24] bg-[#0C0C10] lg:w-96 lg:border-b-0 lg:border-r">
          {/* Subnav Tabs */}
          <div className="flex border-b border-[#1E1E24] px-2 pt-2">
            {[
              { id: 'colors', label: 'Colors', icon: <Palette className="h-3.5 w-3.5" /> },
              { id: 'layout', label: 'Layout & Frame', icon: <Layout className="h-3.5 w-3.5" /> },
              { id: 'typography', label: 'Fonts', icon: <Type className="h-3.5 w-3.5" /> },
              { id: 'saved', label: `Saved (${savedTemplates.length})`, icon: <FolderOpen className="h-3.5 w-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-medium transition ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto p-4 space-y-5">
            {/* Template Identity */}
            <div className="rounded-xl border border-[#202026] bg-[#121216] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Theme Identity</span>
                <button
                  type="button"
                  onClick={() => setAiModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Generate with AI</span>
                </button>
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400">Theme Name</label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  placeholder="e.g. Midnight Cyber"
                  className="mt-1 w-full rounded-lg border border-[#262630] bg-[#0A0A0D] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400">Description</label>
                <input
                  type="text"
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  placeholder="A short note on this aesthetic..."
                  className="mt-1 w-full rounded-lg border border-[#262630] bg-[#0A0A0D] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* TAB 1: COLORS */}
            {activeTab === 'colors' && (
              <div className="space-y-4">
                {/* Curated Aesthetic Palettes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">
                      Curated Aesthetic Palettes
                    </span>
                    <button
                      type="button"
                      onClick={() => setAiModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>AI Generate</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {CURATED_THEME_PALETTES.map((pal) => (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => {
                          setTemplate((prev) => ({
                            ...prev,
                            name: pal.name,
                            category: pal.category,
                            description: pal.description,
                            layout: pal.layout,
                            mode: pal.mode,
                            bgPattern: pal.bgPattern,
                            displayFont: pal.displayFont,
                            bodyFont: pal.bodyFont,
                            monoFamily: pal.monoFamily,
                            radiusPx: pal.radiusPx,
                            tokens: { ...pal.tokens },
                          }));
                          showToast(`Applied aesthetic palette: ${pal.name}`);
                        }}
                        className="flex flex-col items-start rounded-xl border border-[#22222C] bg-[#121217] p-2.5 text-left transition hover:border-[#383848] hover:bg-[#16161D]"
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="truncate text-xs font-semibold text-white">
                            {pal.name}
                          </span>
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: pal.tokens.accent }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500">{pal.category}</span>
                        <div className="mt-2 flex w-full gap-1">
                          <span
                            className="h-3 flex-1 rounded-sm border border-white/10"
                            style={{ backgroundColor: pal.tokens.canvasBg }}
                          />
                          <span
                            className="h-3 flex-1 rounded-sm border border-white/10"
                            style={{ backgroundColor: pal.tokens.surfaceBg }}
                          />
                          <span
                            className="h-3 flex-1 rounded-sm border border-white/10"
                            style={{ backgroundColor: pal.tokens.cardBg }}
                          />
                          <span
                            className="h-3 flex-1 rounded-sm border border-white/10"
                            style={{ backgroundColor: pal.tokens.accent }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-zinc-400">Default Presets</span>
                  <div className="flex gap-1 overflow-x-auto text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleApplyPresetBase('cron-studio')}
                      className="rounded border border-[#24242C] px-2 py-0.5 text-zinc-400 hover:text-white"
                    >
                      Cron
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetBase('bento-workspace')}
                      className="rounded border border-[#24242C] px-2 py-0.5 text-zinc-400 hover:text-white"
                    >
                      Bento
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetBase('crimson-pulse')}
                      className="rounded border border-[#24242C] px-2 py-0.5 text-zinc-400 hover:text-white"
                    >
                      Crimson
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetBase('terminal-console')}
                      className="rounded border border-[#24242C] px-2 py-0.5 text-zinc-400 hover:text-white"
                    >
                      Terminal
                    </button>
                  </div>
                </div>

                {/* Base Mode Toggle */}
                <div>
                  <label className="text-[11px] font-medium text-zinc-400">Color Mode</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {(['dark', 'light'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTemplate({ ...template, mode: m })}
                        className={`rounded-lg border py-1.5 text-xs font-medium capitalize transition ${
                          template.mode === m
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-[#22222A] bg-[#121215] text-zinc-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Token Pickers */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Surface & Cards
                  </h4>

                  <ColorPickerRow
                    label="Canvas Background"
                    value={template.tokens.canvasBg}
                    onChange={(val) =>
                      setTemplate({
                        ...template,
                        tokens: { ...template.tokens, canvasBg: val },
                      })
                    }
                  />

                  <ColorPickerRow
                    label="Surface Container"
                    value={template.tokens.surfaceBg}
                    onChange={(val) =>
                      setTemplate({
                        ...template,
                        tokens: { ...template.tokens, surfaceBg: val },
                      })
                    }
                  />

                  <ColorPickerRow
                    label="Card Background"
                    value={template.tokens.cardBg}
                    onChange={(val) =>
                      setTemplate({
                        ...template,
                        tokens: { ...template.tokens, cardBg: val },
                      })
                    }
                  />

                  <ColorPickerRow
                    label="Elevated Card"
                    value={template.tokens.cardElevatedBg}
                    onChange={(val) =>
                      setTemplate({
                        ...template,
                        tokens: { ...template.tokens, cardElevatedBg: val },
                      })
                    }
                  />

                  <h4 className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Accents & Borders
                  </h4>

                  <ColorPickerRow
                    label="Primary Accent"
                    value={template.tokens.accent}
                    onChange={(val) =>
                      setTemplate({
                        ...template,
                        tokens: {
                          ...template.tokens,
                          accent: val,
                          accentSoft: `${val}26`,
                        },
                      })
                    }
                  />

                  <ColorPickerRow
                    label="Border Color"
                    value={template.tokens.border}
                    onChange={(val) =>
                      setTemplate({
                        ...template,
                        tokens: { ...template.tokens, border: val },
                      })
                    }
                  />

                  <ColorPickerRow
                    label="Strong / Active Border"
                    value={template.tokens.borderStrong}
                    onChange={(val) =>
                      setTemplate({
                        ...template,
                        tokens: { ...template.tokens, borderStrong: val },
                      })
                    }
                  />

                  <h4 className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Typography Colors
                  </h4>

                  <ColorPickerRow
                    label="Primary Text"
                    value={template.tokens.text}
                    onChange={(val) =>
                      setTemplate({
                        ...template,
                        tokens: { ...template.tokens, text: val },
                      })
                    }
                  />

                  <ColorPickerRow
                    label="Muted Text"
                    value={template.tokens.textMuted}
                    onChange={(val) =>
                      setTemplate({
                        ...template,
                        tokens: { ...template.tokens, textMuted: val },
                      })
                    }
                  />

                  <h4 className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Header Banner Gradient (Optional)
                  </h4>
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={template.tokens.headerBannerBg || ''}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          tokens: { ...template.tokens, headerBannerBg: e.target.value },
                        })
                      }
                      placeholder="e.g. radial-gradient(85% 120% at 80% 0%, rgba(225, 29, 72, 0.6) 0%, transparent 80%)"
                      className="w-full rounded-lg border border-[#262630] bg-[#0A0A0D] px-2.5 py-1.5 font-mono text-[11px] text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-zinc-500">
                      CSS linear or radial gradient for top banners (especially prominent on Bento & Crimson Pulse layouts).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LAYOUT & FRAME */}
            {activeTab === 'layout' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-zinc-400">Architectural Layout</label>
                  <div className="mt-1.5 space-y-1.5">
                    {AVAILABLE_LAYOUTS.map((lay) => (
                      <button
                        key={lay.id}
                        type="button"
                        onClick={() => setTemplate({ ...template, layout: lay.id })}
                        className={`flex w-full flex-col rounded-lg border p-2 text-left transition ${
                          template.layout === lay.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-[#22222A] bg-[#121215] hover:border-[#2C2C36]'
                        }`}
                      >
                        <span className="text-xs font-medium text-white">{lay.label}</span>
                        <span className="text-[10px] text-zinc-500">{lay.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-400">Corner Radius ({template.radiusPx}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="28"
                    step="2"
                    value={template.radiusPx}
                    onChange={(e) => setTemplate({ ...template, radiusPx: Number(e.target.value) })}
                    className="mt-2 w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-400">Background Pattern</label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {(['solid', 'dots', 'grid'] as const).map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => setTemplate({ ...template, bgPattern: pat })}
                        className={`rounded-lg border py-1.5 text-xs font-medium capitalize transition ${
                          template.bgPattern === pat
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-[#22222A] bg-[#121215] text-zinc-400'
                        }`}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TYPOGRAPHY */}
            {activeTab === 'typography' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-zinc-400">Display / Header Font</label>
                  <select
                    value={template.displayFont}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        displayFont: e.target.value as TemplateFontFamily,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[#272732] bg-[#121216] px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-400">Body Font</label>
                  <select
                    value={template.bodyFont}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        bodyFont: e.target.value as TemplateFontFamily,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[#272732] bg-[#121216] px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-400">Timestamp / Monospace Font</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {(['geist-mono', 'jetbrains-mono'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTemplate({ ...template, monoFamily: m })}
                        className={`rounded-lg border py-1.5 text-xs font-mono transition ${
                          template.monoFamily === m
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-[#22222A] bg-[#121215] text-zinc-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SAVED CUSTOM TEMPLATES */}
            {activeTab === 'saved' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">Your Custom Themes</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplate({
                        id: `custom-${Date.now()}`,
                        name: 'New Custom Theme',
                        category: 'Custom',
                        description: 'A new tailored aesthetic.',
                        layout: 'cron-sidebar-grid',
                        bgPattern: 'solid',
                        mode: 'dark',
                        displayFont: 'inter',
                        bodyFont: 'inter',
                        monoFamily: 'geist-mono',
                        radiusPx: 12,
                        tokens: {
                          canvasBg: '#09090B',
                          surfaceBg: '#121215',
                          cardBg: '#18181D',
                          cardElevatedBg: '#202026',
                          border: '#272730',
                          borderStrong: '#383844',
                          text: '#FAFAFA',
                          textMuted: '#A1A1AA',
                          accent: '#3B82F6',
                          accentSoft: 'rgba(59, 130, 246, 0.16)',
                        },
                      });
                      showToast('Started new blank theme draft.');
                    }}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    + New Theme
                  </button>
                </div>

                {savedTemplates.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#24242C] p-6 text-center">
                    <p className="text-xs text-zinc-500">
                      No saved custom themes yet. Customize the colors and click &quot;Save Theme&quot; above!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedTemplates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-xl border border-[#202028] bg-[#121217] p-2.5"
                      >
                        <div
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5"
                          onClick={() => {
                            setTemplate(t);
                            showToast(`Loaded "${t.name}"`);
                          }}
                        >
                          <div
                            className="h-6 w-6 shrink-0 rounded-md border border-white/20"
                            style={{ backgroundColor: t.tokens.accent }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white">{t.name}</p>
                            <p className="truncate text-[10px] text-zinc-500">
                              {t.layout} · {t.mode}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteSaved(t.id)}
                            className="rounded p-1 text-zinc-500 transition hover:bg-white/[0.08] hover:text-rose-400"
                            title="Delete theme"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Right Live Canvas Preview */}
        <main className="flex-1 overflow-x-auto p-4 lg:p-8">
          <div className="mx-auto max-w-[1240px] space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-2 font-mono text-[11px]">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                Live Architecture Preview · Real-time Rendering
              </span>
              <span className="font-mono text-[11px] text-zinc-500">
                {template.layout} · {template.mode} mode
              </span>
            </div>

            {/* Timetable Live Canvas */}
            <div className="overflow-hidden rounded-2xl border border-[#22222B] shadow-2xl">
              <TimetableRenderer
                meta={SAMPLE_META}
                schedule={SAMPLE_SCHEDULE}
                template={activePresetPreview}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Share Modal */}
      <AnimatedModalShell
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        zIndexClass="z-50"
      >
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-[#0A0D16] p-6 shadow-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
            <Share2 className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            Share Your Custom Theme
          </h3>
          <p className="mt-1.5 text-xs text-zinc-400">
            Anyone with this link can preview your theme live and clone it into their own timetable studio.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#262634] bg-[#12131C] p-2">
            <input
              type="text"
              readOnly
              value={typeof window !== 'undefined' ? `${window.location.origin}/template/${shareId}` : ''}
              className="flex-1 bg-transparent px-2 font-mono text-xs text-zinc-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && shareId) {
                  navigator.clipboard.writeText(`${window.location.origin}/template/${shareId}`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                  showToast('Copied public theme link!');
                }
              }}
              className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08]"
            >
              Done
            </button>
          </div>
        </div>
      </AnimatedModalShell>

      {/* AI Theme Generator Modal */}
      <ThemeAiModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApplyTheme={(parsedTheme) => {
          setTemplate((prev) => ({
            ...prev,
            ...parsedTheme,
            tokens: {
              ...prev.tokens,
              ...(parsedTheme.tokens || {}),
            },
          }));
          showToast(`Applied AI Theme "${parsedTheme.name || 'Custom'}"!`);
        }}
      />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={SPRING_PILL}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-blue-500/30 bg-[#0E1528]/95 px-4 py-2 text-xs font-medium text-blue-200 shadow-2xl backdrop-blur-xl"
          >
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ColorPickerRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#1E1E24] bg-[#101014] px-3 py-2">
      <span className="text-xs text-zinc-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 rounded border border-[#2B2B36] bg-[#0A0A0D] px-1.5 py-0.5 font-mono text-[11px] text-zinc-200 focus:outline-none"
        />
        <input
          type="color"
          value={value.startsWith('#') ? value : '#3B82F6'}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border border-white/20 bg-transparent p-0"
        />
      </div>
    </div>
  );
}
