'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSharedCustomTemplate } from '@/lib/firestore-timetables';
import { SharedTemplateViewClient } from '@/components/SharedTemplateViewClient';
import { GridWiseLogoMark } from '@/components/GridWiseLogo';
import type { CustomTemplateDefinition } from '@/types/timetable';

export function FirestoreTemplateLoader({ shareId }: { shareId: string }) {
  const [template, setTemplate] = useState<CustomTemplateDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    let isCancelled = false;

    async function load() {
      try {
        const tpl = await getSharedCustomTemplate(shareId);
        if (isCancelled) return;
        if (!tpl) {
          setError(true);
        } else {
          setTemplate(tpl);
        }
      } catch {
        if (!isCancelled) setError(true);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#08080A] text-zinc-300">
        <GridWiseLogoMark size={40} tone="dark" animated />
        <p className="font-mono text-xs text-zinc-500">Loading custom theme...</p>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#08080A] px-4 text-center">
        <div className="rounded-2xl border border-white/10 bg-[#121216] p-6 max-w-sm">
          <h2 className="text-base font-semibold text-white">Theme Not Found</h2>
          <p className="mt-2 text-xs text-zinc-400">
            This theme link might have expired or been deleted by its creator.
          </p>
          <Link
            href="/theme-creator"
            className="mt-5 inline-block w-full rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#09090B] transition hover:bg-zinc-200"
          >
            Create Your Own Theme
          </Link>
        </div>
      </div>
    );
  }

  return <SharedTemplateViewClient template={template} />;
}
