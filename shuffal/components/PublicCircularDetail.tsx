'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CircularRecord } from '@/lib/circulars';

function formatUploadDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PublicCircularDetail({ id }: { id: string }) {
  const [circular, setCircular] = useState<CircularRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadCircular = async () => {
      try {
        const response = await fetch(`/api/circulars/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const payload = await response.json() as { circular?: CircularRecord; error?: string };
        if (!response.ok) throw new Error(payload.error || 'Could not load circular');
        if (active) setCircular(payload.circular || null);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load circular');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadCircular();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <p className="mt-8 text-slate-400">Loading circular...</p>;
  if (error) return <p role="alert" className="mt-8 rounded-xl border border-rose-400/30 bg-rose-400/5 p-5 text-rose-200">{error}</p>;
  if (!circular) return <p className="mt-8 rounded-xl border border-slate-700 bg-slate-900/70 p-5 text-slate-300">This circular could not be found.</p>;

  return (
    <article className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-6 sm:p-8">
      <p className="text-sm font-medium text-blue-300">Uploaded {formatUploadDate(circular.uploaded_at)}</p>
      <h1 className="mt-3 break-words text-2xl font-bold text-white sm:text-3xl">{circular.title}</h1>
      {circular.description && <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">{circular.description}</p>}
      <a
        href={`/api/circulars/${circular.id}/file`}
        target="_blank"
        rel="noreferrer"
        className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        View or download PDF
      </a>
      <p className="mt-6 text-sm text-slate-400">
        <Link href="/circulars" className="font-medium text-blue-300 underline underline-offset-4 hover:text-white">Back to all circulars</Link>
      </p>
    </article>
  );
}
