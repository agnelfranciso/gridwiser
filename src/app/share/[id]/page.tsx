import React, { Suspense } from 'react';
import { FirestoreShareLoader } from '@/components/FirestoreShareLoader';

async function ShareIdExtractor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FirestoreShareLoader shareId={id} />;
}

export default function SharePage({ params }: PageProps<'/share/[id]'>) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#09090B] text-zinc-300">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="font-mono text-xs text-zinc-500">Loading timetable...</p>
        </div>
      }
    >
      <ShareIdExtractor params={params} />
    </Suspense>
  );
}
