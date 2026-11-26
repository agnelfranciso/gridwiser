import type {
  ExamEntry,
  ExamTimetableMeta,
  ExamType,
} from '@/types/timetable';

const ACCENT_PALETTE = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#6366F1',
];

export const EXAM_AI_EXTRACTION_PROMPT = `You are a precision academic exam schedule parser.
Extract ALL exams from the timetable image, PDF, or text I provide and return ONLY valid JSON (no markdown explanation outside the JSON) matching this exact schema:

{
  "title": "End-Semester Examinations · Fall 2026",
  "subtitle": "B.Tech Computer Science · Hall Ticket Schedule",
  "timeFormat": "12h",
  "exams": [
    {
      "subjectName": "Data Structures and Algorithms",
      "courseCode": "CS-301",
      "examDate": "2026-12-14",
      "startTime": "09:30",
      "endTime": "12:30",
      "venue": "Main Exam Hall A",
      "seatNumber": "Row 4 · Seat 18",
      "examType": "Final",
      "notes": "Scientific calculator allowed"
    }
  ]
}

STRICT RULES:
1. "examDate" MUST be ISO format "YYYY-MM-DD". If the year is missing, infer the upcoming academic year.
2. "startTime" and "endTime" MUST be 24-hour "HH:MM" (e.g. "09:30", "14:00").
3. "examType" MUST be one of: "Midterm", "Final", "Practical", "Viva", "Quiz". Default to "Final" if unclear.
4. Keep "venue", "seatNumber", and "notes" concise strings (or empty string "" if unknown).
5. Output ONLY raw JSON.`;

function normalizeTime24(input: string, fallback: string): string {
  const clean = String(input || '').trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!match) return fallback;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3];
  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  if (h < 0 || h > 23 || m < 0 || m > 59) return fallback;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function normalizeIsoDate(input: string): string {
  const clean = String(input || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

const VALID_EXAM_TYPES: ExamType[] = ['Midterm', 'Final', 'Practical', 'Viva', 'Quiz'];

export function parseExamAiJson(rawInput: string): {
  meta: Partial<ExamTimetableMeta>;
  exams: ExamEntry[];
} {
  let cleaned = rawInput.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JSON format. Make sure you pasted the complete JSON block from your AI.');
  }

  const rawExams = Array.isArray(parsed.exams) ? parsed.exams : [];
  if (rawExams.length === 0) {
    throw new Error('No exams found in the JSON "exams" array.');
  }

  const exams: ExamEntry[] = rawExams.slice(0, 60).map((item, idx) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const rawType = String(row.examType || 'Final').trim();
    const matchedType =
      VALID_EXAM_TYPES.find((t) => t.toLowerCase() === rawType.toLowerCase()) ?? 'Final';

    return {
      id: `exam-${Date.now()}-${idx}`,
      subjectName: String(row.subjectName || row.name || `Exam ${idx + 1}`).slice(0, 100),
      courseCode: String(row.courseCode || row.code || '').slice(0, 24),
      examDate: normalizeIsoDate(String(row.examDate || row.date || '')),
      startTime: normalizeTime24(String(row.startTime || ''), '09:30'),
      endTime: normalizeTime24(String(row.endTime || ''), '12:30'),
      venue: String(row.venue || row.room || '').slice(0, 80),
      seatNumber: String(row.seatNumber || row.seat || '').slice(0, 40),
      examType: matchedType,
      notes: String(row.notes || '').slice(0, 140),
      accentDot: ACCENT_PALETTE[idx % ACCENT_PALETTE.length],
    };
  });

  return {
    meta: {
      title: typeof parsed.title === 'string' ? parsed.title.slice(0, 120) : undefined,
      subtitle: typeof parsed.subtitle === 'string' ? parsed.subtitle.slice(0, 160) : undefined,
      timeFormat: parsed.timeFormat === '24h' ? '24h' : '12h',
    },
    exams,
  };
}

export function generateExamICS(exams: ExamEntry[], meta: ExamTimetableMeta): string {
  const escapeICS = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const sorted = [...exams].sort((a, b) =>
    `${a.examDate}T${a.startTime}`.localeCompare(`${b.examDate}T${b.startTime}`)
  );

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GridWiser//Exam Timetable//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeICS(meta.title || 'Exam Timetable')}`,
  ];

  sorted.forEach((ex, i) => {
    const dateCompact = ex.examDate.replace(/-/g, '');
    const startCompact = `${ex.startTime.replace(':', '')}00`;
    const endCompact = `${ex.endTime.replace(':', '')}00`;
    const summary = ex.courseCode
      ? `${ex.courseCode}: ${ex.subjectName} (${ex.examType || 'Exam'})`
      : `${ex.subjectName} (${ex.examType || 'Exam'})`;
    const descParts = [
      ex.examType ? `Type: ${ex.examType}` : '',
      ex.seatNumber ? `Seat: ${ex.seatNumber}` : '',
      ex.notes ? `Notes: ${ex.notes}` : '',
    ].filter(Boolean);

    lines.push(
      'BEGIN:VEVENT',
      `UID:gridwiser-exam-${ex.id}-${i}@gridwiser.app`,
      `DTSTART:${dateCompact}T${startCompact}`,
      `DTEND:${dateCompact}T${endCompact}`,
      `SUMMARY:${escapeICS(summary)}`,
      ex.venue ? `LOCATION:${escapeICS(ex.venue)}` : '',
      descParts.length > 0 ? `DESCRIPTION:${escapeICS(descParts.join(' | '))}` : '',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).join('\r\n');
}
