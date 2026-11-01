'use client';

import { useEffect, useState } from 'react';
import { getCircularDisplayDescription, getCircularDisplayTitle, type CircularRecord } from '@/lib/circulars';

function formatUploadDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCircularDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
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

  if (loading) return <p role="status" className="py-8 text-slate-400">Loading circular...</p>;
  if (error) return <p role="alert" className="border-b border-rose-400/30 py-6 text-rose-200">{error}</p>;
  if (!circular) return <p className="border-b border-[#25445b] py-6 text-slate-300">This circular could not be found.</p>;

  const description = getCircularDisplayDescription(circular);

  return (
    <article className="border-b border-[#25445b] py-7 sm:py-9">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <p className="font-semibold text-sky-200">Date: {formatCircularDate(circular.circular_date)}</p>
        <p className="text-slate-300">Category: {circular.category}</p>
        <p className="text-slate-400">Uploaded: {formatUploadDate(circular.uploaded_at)}</p>
      </div>
      <h2 className="mt-3 text-2xl font-bold text-white [overflow-wrap:anywhere] sm:text-3xl">{getCircularDisplayTitle(circular)}</h2>
      {description && <p className="mt-4 max-w-4xl whitespace-pre-wrap leading-7 text-slate-300">{description}</p>}
      <a
        href={`/circulars/${circular.id}/pdf`}
        target="_blank"
        rel="noreferrer"
        className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:from-sky-500 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
      >
        View or download PDF
      </a>
    </article>
  );
}
