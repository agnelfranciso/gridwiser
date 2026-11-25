import React, { Suspense } from 'react';
import { FirestoreTemplateLoader } from '@/components/FirestoreTemplateLoader';

async function TemplateIdExtractor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FirestoreTemplateLoader shareId={id} />;
}

export default function SharedTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#08080A] text-zinc-300">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="font-mono text-xs text-zinc-500">Loading custom theme...</p>
        </div>
      }
    >
      <TemplateIdExtractor params={params} />
    </Suspense>
  );
}
