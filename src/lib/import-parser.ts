import type { DayOfWeek, SubjectEntry, TimetableMeta } from '@/types/timetable';
import { SUBJECT_DOT_TONES } from '@/lib/themes';

export const AI_IMPORT_PROMPT = `Analyze the attached timetable (image, PDF, or text) and extract every subject/class and its weekly schedule into valid JSON.

Rules:
1. Return ONLY raw JSON (no markdown fences, no explanations).
2. Group repeated classes of the same subject under one subject entry with multiple items in "occurrences".
3. "day" MUST be one of: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun".
4. "startTime" and "endTime" MUST be 24-hour "HH:mm" format (e.g. "09:00", "14:30").
5. Leave optional fields like "code", "room", or "instructor" as "" if not shown.

Use this exact JSON format:
{
  "meta": {
    "title": "Timetable Title",
    "subtitle": "Semester / Department / Term",
    "timeFormat": "24h"
  },
  "subjects": [
    {
      "name": "Data Structures",
      "code": "CS 201",
      "room": "Room 304",
      "instructor": "Prof. Alan Grant",
      "occurrences": [
        { "day": "Mon", "startTime": "09:00", "endTime": "10:00" },
        { "day": "Wed", "startTime": "09:00", "endTime": "10:00" }
      ]
    }
  ]
}`;

const DAY_ALIASES: Record<string, DayOfWeek> = {
  mon: 'Mon',
  monday: 'Mon',
  tue: 'Tue',
  tues: 'Tue',
  tuesday: 'Tue',
  wed: 'Wed',
  wednesday: 'Wed',
  thu: 'Thu',
  thur: 'Thu',
  thurs: 'Thu',
  thursday: 'Thu',
  fri: 'Fri',
  friday: 'Fri',
  sat: 'Sat',
  saturday: 'Sat',
  sun: 'Sun',
  sunday: 'Sun',
};

function normalizeDay(raw: unknown): DayOfWeek | null {
  if (typeof raw !== 'string') return null;
  const key = raw.trim().toLowerCase();
  return DAY_ALIASES[key] ?? null;
}

function normalizeTime(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // Match 24h HH:mm or H:mm
  const match24 = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (match24) {
    const h = Number(match24[1]);
    const m = Number(match24[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  // Match 12h like "9:00 AM" or "02:30 pm"
  const match12 = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(trimmed);
  if (match12) {
    let h = Number(match12[1]);
    const m = Number(match12[2]);
    const period = match12[3].toLowerCase();
    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
      if (period === 'pm' && h !== 12) h += 12;
      if (period === 'am' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  return null;
}

export interface ParsedImportResult {
  meta: Partial<TimetableMeta>;
  subjects: SubjectEntry[];
  sessionCount: number;
}

export function parseImportedTimetableJson(rawInput: string): ParsedImportResult {
  let cleaned = rawInput.trim();
  if (!cleaned) {
    throw new Error('Paste the JSON output from your AI or upload a .json file.');
  }

  // Strip accidental markdown ```json fences
  const fenceMatch = /```(?:json)?\s*([\s\S]*?)```/i.exec(cleaned);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Invalid JSON syntax. Make sure you copied the complete JSON object.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Expected a JSON object at root.');
  }

  const root = parsed as Record<string, unknown>;
  const rawMeta = (root.meta && typeof root.meta === 'object' ? root.meta : {}) as Record<
    string,
    unknown
  >;

  const rawSubjects = Array.isArray(root.subjects) ? root.subjects : null;
  if (!rawSubjects || rawSubjects.length === 0) {
    throw new Error('JSON must include a non-empty "subjects" array.');
  }

  const stamp = Date.now();
  const subjects: SubjectEntry[] = [];
  let sessionCount = 0;

  rawSubjects.forEach((item, sIdx) => {
    if (!item || typeof item !== 'object') return;
    const obj = item as Record<string, unknown>;
    const name = typeof obj.name === 'string' ? obj.name.trim() : '';
    if (!name) return;

    const rawOccs = Array.isArray(obj.occurrences) ? obj.occurrences : [];
    const occurrences = rawOccs
      .map((occ, oIdx) => {
        if (!occ || typeof occ !== 'object') return null;
        const o = occ as Record<string, unknown>;
        const day = normalizeDay(o.day);
        const startTime = normalizeTime(o.startTime);
        const endTime = normalizeTime(o.endTime);
        if (!day || !startTime || !endTime) return null;
        return {
          id: `imp-occ-${stamp}-${sIdx}-${oIdx}`,
          day,
          startTime,
          endTime,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (occurrences.length === 0) return;

    sessionCount += occurrences.length;
    subjects.push({
      id: `imp-subj-${stamp}-${sIdx}`,
      name,
      code: typeof obj.code === 'string' ? obj.code.trim() : '',
      room: typeof obj.room === 'string' ? obj.room.trim() : '',
      instructor: typeof obj.instructor === 'string' ? obj.instructor.trim() : '',
      accentDot:
        typeof obj.accentDot === 'string' && obj.accentDot.startsWith('#')
          ? obj.accentDot
          : SUBJECT_DOT_TONES[sIdx % SUBJECT_DOT_TONES.length],
      occurrences,
    });
  });

  if (subjects.length === 0) {
    throw new Error(
      'No valid subjects with occurrences were found. Check that days use Mon–Sun and times use HH:mm.'
    );
  }

  const meta: Partial<TimetableMeta> = {};
  if (typeof rawMeta.title === 'string' && rawMeta.title.trim()) {
    meta.title = rawMeta.title.trim();
  }
  if (typeof rawMeta.subtitle === 'string') {
    meta.subtitle = rawMeta.subtitle.trim();
  }
  if (rawMeta.timeFormat === '12h' || rawMeta.timeFormat === '24h') {
    meta.timeFormat = rawMeta.timeFormat;
  }

  return { meta, subjects, sessionCount };
}
