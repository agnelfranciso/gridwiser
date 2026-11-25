export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const ALL_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface SubjectOccurrence {
  id: string;
  day: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  mergedOverlap?: boolean;
}

export interface SubjectEntry {
  id: string;
  name: string;
  code: string;
  room: string;
  instructor: string;
  accentDot: string;
  occurrences: SubjectOccurrence[];
}

export interface TimetableMeta {
  title: string;
  subtitle: string;
  timeFormat: '12h' | '24h';
  showWeekend: boolean;
}

export type PresetTemplateId =
  | 'cron-studio'
  | 'swiss-horizontal'
  | 'bento-workspace'
  | 'editorial-journal'
  | 'linear-columns'
  | 'terminal-console'
  | 'gallery-paper'
  | 'poster-tiles'
  | 'precision-athletic'
  | 'acid-daily-poster'
  | 'editorial-daily-deck'
  | 'exhibition-blue-daily'
  | 'crimson-pulse';

export type PresetLayoutKind =
  | 'cron-sidebar-grid'
  | 'horizontal-timeline'
  | 'bento-dashboard'
  | 'magazine-spread'
  | 'day-columns'
  | 'terminal-table'
  | 'crimson-pulse'
  | 'editorial-light-grid'
  | 'poster-tiles'
  | 'athletic-columns'
  | 'daily-poster'
  | 'daily-deck'
  | 'exhibition-daily';

export type TemplateFontFamily =
  | 'inter'
  | 'geist'
  | 'plus-jakarta'
  | 'space-grotesk'
  | 'dm-sans'
  | 'newsreader'
  | 'jetbrains-mono'
  | 'syne'
  | 'outfit';

export interface PresetTemplate {
  id: PresetTemplateId;
  name: string;
  category: string;
  layoutLabel: string;
  description: string;
  layout: PresetLayoutKind;
  bgPattern: 'solid' | 'dots' | 'grid';
  mode: 'dark' | 'light';
  displayFont: TemplateFontFamily;
  bodyFont: TemplateFontFamily;
  monoFamily: 'geist-mono' | 'jetbrains-mono';
  radiusPx: number;
  tokens: {
    canvasBg: string;
    surfaceBg: string;
    cardBg: string;
    cardElevatedBg: string;
    border: string;
    borderStrong: string;
    text: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
    headerBannerBg?: string;
  };
}

export interface ScheduledBlock {
  occurrenceId: string;
  subjectId: string;
  name: string;
  code: string;
  room: string;
  instructor: string;
  accentDot: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  startMin: number;
  endMin: number;
  mergedOverlap: boolean;
  hasConflict: boolean;
  lane: number;
  laneCount: number;
}

export interface MergedSlotCard {
  id: string;
  day: DayOfWeek;
  startMin: number;
  endMin: number;
  blocks: ScheduledBlock[];
}

export interface OverlapConflict {
  id: string;
  day: DayOfWeek;
  blocks: ScheduledBlock[];
}

export interface AnalyzedSchedule {
  days: DayOfWeek[];
  minHour: number;
  maxHour: number;
  blocks: ScheduledBlock[];
  mergedGroups: MergedSlotCard[];
  unresolvedOverlaps: OverlapConflict[];
  stats: {
    totalSubjects: number;
    totalSessions: number;
    totalHours: number;
    busiestDay: DayOfWeek | null;
    conflictCount: number;
  };
}

export interface SavedTimetableRecord {
  id: string;
  meta: TimetableMeta;
  subjects: SubjectEntry[];
  templateId: PresetTemplateId;
  createdAt: string;
  updatedAt: string;
}

export interface SavedTimetableSummary {
  id: string;
  title: string;
  subtitle: string;
  subjectCount: number;
  sessionCount: number;
  templateId: PresetTemplateId;
  templateName: string;
  canvasBg: string;
  accent: string;
  shareId?: string | null;
  updatedAt: string;
}
