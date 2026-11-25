import {
  ALL_DAYS,
  type AnalyzedSchedule,
  type DayOfWeek,
  type MergedSlotCard,
  type OverlapConflict,
  type ScheduledBlock,
  type SubjectEntry,
  type TimetableMeta,
} from '@/types/timetable';

export function parseTimeToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return 9 * 60;
  return Math.max(0, Math.min(23 * 60 + 59, h * 60 + m));
}

export function formatTimeDisplay(hhmm: string, format: '12h' | '24h'): string {
  if (format === '24h') return hhmm;
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}

export function formatHourLabel(hour: number, format: '12h' | '24h'): string {
  const hh = String(hour).padStart(2, '0');
  return formatTimeDisplay(`${hh}:00`, format);
}

/**
 * Analyzes all user-entered subject occurrences, detects overlaps,
 * groups intentionally merged overlapping occurrences into unified multi-subject cards,
 * and flags unmerged overlaps for user confirmation.
 */
export function analyzeSchedule(
  subjects: SubjectEntry[],
  meta: TimetableMeta
): AnalyzedSchedule {
  const rawBlocks: Omit<ScheduledBlock, 'hasConflict' | 'lane' | 'laneCount'>[] = [];
  let minMinute = 24 * 60;
  let maxMinute = 0;
  let usesWeekend = meta.showWeekend;

  for (const subj of subjects) {
    for (const occ of subj.occurrences) {
      const startMin = parseTimeToMinutes(occ.startTime);
      const endMinRaw = parseTimeToMinutes(occ.endTime);
      const endMin = endMinRaw > startMin ? endMinRaw : Math.min(23 * 60 + 59, startMin + 60);

      if (occ.day === 'Sat' || occ.day === 'Sun') usesWeekend = true;
      minMinute = Math.min(minMinute, startMin);
      maxMinute = Math.max(maxMinute, endMin);

      rawBlocks.push({
        occurrenceId: occ.id,
        subjectId: subj.id,
        name: subj.name,
        code: subj.code,
        room: subj.room,
        instructor: subj.instructor,
        accentDot: subj.accentDot,
        day: occ.day,
        startTime: occ.startTime,
        endTime: occ.endTime,
        startMin,
        endMin,
        mergedOverlap: Boolean(occ.mergedOverlap),
      });
    }
  }

  const days: DayOfWeek[] = usesWeekend
    ? [...ALL_DAYS]
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const minHour =
    rawBlocks.length > 0 ? Math.max(5, Math.floor(minMinute / 60)) : 8;
  const maxHour =
    rawBlocks.length > 0 ? Math.min(23, Math.max(minHour + 2, Math.ceil(maxMinute / 60))) : 17;

  const finalBlocks: ScheduledBlock[] = [];
  const mergedGroups: MergedSlotCard[] = [];
  const unresolvedOverlaps: OverlapConflict[] = [];
  let conflictCount = 0;

  for (const day of days) {
    const dayBlocks = rawBlocks
      .filter((b) => b.day === day)
      .sort((a, b) => (a.startMin !== b.startMin ? a.startMin - b.startMin : a.endMin - b.endMin));

    // Connected overlap groups on this day
    const groups: (typeof dayBlocks)[] = [];
    for (const blk of dayBlocks) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.some((g) => blk.startMin < g.endMin && g.startMin < blk.endMin)) {
        lastGroup.push(blk);
      } else {
        groups.push([blk]);
      }
    }

    for (const group of groups) {
      if (group.length === 1) {
        const single = group[0];
        finalBlocks.push({
          ...single,
          hasConflict: false,
          lane: 0,
          laneCount: 1,
        });
        continue;
      }

      // Check if all blocks in this overlap group are approved as mergedOverlap
      const isFullyMerged = group.every((b) => b.mergedOverlap);

      if (isFullyMerged) {
        const groupStart = Math.min(...group.map((b) => b.startMin));
        const groupEnd = Math.max(...group.map((b) => b.endMin));
        const blocksInGroup: ScheduledBlock[] = group.map((b) => ({
          ...b,
          hasConflict: false,
          lane: 0,
          laneCount: 1,
        }));
        finalBlocks.push(...blocksInGroup);
        mergedGroups.push({
          id: `merged-${day}-${group.map((b) => b.occurrenceId).join('-')}`,
          day,
          startMin: groupStart,
          endMin: groupEnd,
          blocks: blocksInGroup,
        });
        continue;
      }

      // Unresolved overlap: assign lanes side-by-side and record conflict for user alert
      const laneEnds: number[] = [];
      const assigned: ScheduledBlock[] = [];

      for (const blk of group) {
        let placedLane = laneEnds.findIndex((end) => end <= blk.startMin);
        if (placedLane === -1) {
          placedLane = laneEnds.length;
          laneEnds.push(blk.endMin);
        } else {
          laneEnds[placedLane] = blk.endMin;
        }
        assigned.push({
          ...blk,
          hasConflict: true,
          lane: placedLane,
          laneCount: 1,
        });
      }

      const laneCount = Math.max(1, laneEnds.length);
      const withLanes = assigned.map((b) => ({ ...b, laneCount }));
      finalBlocks.push(...withLanes);
      conflictCount += 1;
      unresolvedOverlaps.push({
        id: `conflict-${day}-${group.map((b) => b.occurrenceId).join('-')}`,
        day,
        blocks: withLanes,
      });
    }
  }

  // Compute unique non-double-counted hours for merged blocks
  const mergedOccIds = new Set(
    mergedGroups.flatMap((g) => g.blocks.map((b) => b.occurrenceId))
  );
  const unmergedMinutes = finalBlocks
    .filter((b) => !mergedOccIds.has(b.occurrenceId))
    .reduce((acc, b) => acc + (b.endMin - b.startMin), 0);
  const mergedMinutes = mergedGroups.reduce((acc, g) => acc + (g.endMin - g.startMin), 0);
  const totalHours = Number(((unmergedMinutes + mergedMinutes) / 60).toFixed(1));

  let busiestDay: DayOfWeek | null = null;
  let maxDayMinutes = 0;
  for (const day of days) {
    const mins = finalBlocks
      .filter((b) => b.day === day)
      .reduce((acc, b) => acc + (b.endMin - b.startMin), 0);
    if (mins > maxDayMinutes) {
      maxDayMinutes = mins;
      busiestDay = day;
    }
  }

  return {
    days,
    minHour,
    maxHour,
    blocks: finalBlocks,
    mergedGroups,
    unresolvedOverlaps,
    stats: {
      totalSubjects: subjects.length,
      totalSessions: finalBlocks.length,
      totalHours,
      busiestDay,
      conflictCount,
    },
  };
}

/**
 * Helper to mark a set of occurrence IDs as intentionally merged in SubjectEntry[]
 */
export function markOccurrencesAsMerged(
  subjects: SubjectEntry[],
  occurrenceIds: string[]
): SubjectEntry[] {
  const idSet = new Set(occurrenceIds);
  return subjects.map((subj) => ({
    ...subj,
    occurrences: subj.occurrences.map((occ) =>
      idSet.has(occ.id) ? { ...occ, mergedOverlap: true } : occ
    ),
  }));
}

const DAY_TO_ICS_OFFSET: Record<DayOfWeek, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export function generateICSFromSubjects(
  meta: TimetableMeta,
  subjects: SubjectEntry[]
): string {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (1 - day + 7) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);

  const fmtDate = (d: Date, hhmm: string) => {
    const [hh = '09', mm = '00'] = hhmm.split(':');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${dt}T${hh.padStart(2, '0')}${mm.padStart(2, '0')}00`;
  };

  const escapeICS = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GridWiser//Timetable Studio//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeICS(meta.title || 'GridWiser Timetable')}`,
  ];

  for (const subj of subjects) {
    for (const occ of subj.occurrences) {
      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + DAY_TO_ICS_OFFSET[occ.day]);

      const summary = subj.code ? `${subj.code}: ${subj.name}` : subj.name;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${occ.id}@gridwiser.app`);
      lines.push(`DTSTART:${fmtDate(eventDate, occ.startTime)}`);
      lines.push(`DTEND:${fmtDate(eventDate, occ.endTime)}`);
      lines.push('RRULE:FREQ=WEEKLY;COUNT=16');
      lines.push(`SUMMARY:${escapeICS(summary)}`);
      if (subj.room) lines.push(`LOCATION:${escapeICS(subj.room)}`);
      if (subj.instructor) lines.push(`DESCRIPTION:${escapeICS(`Instructor: ${subj.instructor}`)}`);
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
