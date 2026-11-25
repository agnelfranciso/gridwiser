'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSharedTimetable } from '@/lib/firestore-timetables';
import type { SavedTimetableRecord } from '@/types/timetable';
import { ShareViewClient } from '@/components/ShareViewClient';
import { GridWiseLogoMark } from '@/components/GridWiseLogo';

export function FirestoreShareLoader({ shareId }: { shareId: string }) {
  const [timetable, setTimetable] = useState<SavedTimetableRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSharedTimetable(shareId)
      .then((rec) => {
        if (!cancelled) setTimetable(rec);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#09090B] text-zinc-300">
        <GridWiseLogoMark size={36} tone="dark" />
        <p className="font-mono text-xs text-zinc-500">Loading shared timetable...</p>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#09090B] text-zinc-300">
        <GridWiseLogoMark size={36} tone="dark" />
        <h1 className="text-base font-semibold text-white">Timetable not found</h1>
        <p className="text-xs text-zinc-500">
          This share link may have been removed or does not exist.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-zinc-200"
        >
          Back to GridWise
        </Link>
      </div>
    );
  }

  return <ShareViewClient timetable={timetable} />;
}
