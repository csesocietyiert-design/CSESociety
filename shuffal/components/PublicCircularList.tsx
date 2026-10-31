'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchPublicCirculars } from '@/lib/circulars-client';
import type { CircularRecord } from '@/lib/circulars';

function formatUploadDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PublicCircularList() {
  const [circulars, setCirculars] = useState<CircularRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchPublicCirculars()
      .then((items) => { if (active) setCirculars(items); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load circulars');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const retryLoading = async () => {
    setLoading(true);
    setError('');
    try {
      setCirculars(await fetchPublicCirculars());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load circulars');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-6 text-slate-400">Loading circulars...</p>;
  }

  if (error) {
    return (
      <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/5 p-6">
        <p role="alert" className="text-rose-200">{error}</p>
        <button type="button" onClick={() => void retryLoading()} className="mt-3 min-h-11 text-sm font-medium text-blue-300 underline underline-offset-4">
          Try again
        </button>
      </div>
    );
  }

  if (circulars.length === 0) {
    return <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-6 text-slate-300">There are no circulars published yet. Please check back for updates.</p>;
  }

  return (
    <ol className="mt-4 space-y-3">
      {circulars.map((circular, index) => (
        <li key={circular.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-5 transition hover:border-blue-400/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                {index === 0 ? 'Latest circular' : 'Circular'} · Uploaded {formatUploadDate(circular.uploaded_at)}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">{circular.title}</h3>
              {circular.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{circular.description}</p>}
            </div>
            <Link
              href={`/circular/${circular.id}`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-blue-400/30 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:border-blue-300 hover:bg-blue-500/10 hover:text-white"
            >
              Open circular
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}
