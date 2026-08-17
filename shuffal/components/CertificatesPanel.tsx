'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/store';

type CertificateCard = {
  id: string;
  eventName: string;
  date: string;
  driveLink: string;
  createdBy?: string;
  createdAt?: string;
};

export default function CertificatesPanel() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'faculty';
  const [cards, setCards] = useState<CertificateCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CertificateCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch certificates from database
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/certificates');
        if (!response.ok) {
          throw new Error('Failed to fetch certificates');
        }
        const data = await response.json();
        setCards(data.certificates || []);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError(err instanceof Error ? err.message : 'Failed to load certificates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const totalCertificates = useMemo(() => cards.length, [cards]);

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetch(`/api/certificates/${cardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete certificate');
      }

      setCards((current) => current.filter((card) => card.id !== cardId));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting certificate:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete certificate');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventName.trim() || !date || !driveLink.trim() || !user?.id) {
      return;
    }

    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: eventName.trim(),
          date,
          driveLink: driveLink.trim(),
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create certificate');
      }

      const data = await response.json();
      setCards((current) => [data.certificate, ...current]);
      setEventName('');
      setDate('');
      setDriveLink('');
      setShowForm(false);
    } catch (err) {
      console.error('Error creating certificate:', err);
      setError(err instanceof Error ? err.message : 'Failed to create certificate');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-blue-300">CSE Society</p>
          <h1 className="mt-2 text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Certificates
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/25"
        >
          <span className="text-xl leading-none">+</span>
          {showForm ? 'Close' : 'Add Certificate'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 shadow-[0_0_30px_rgba(0,0,0,0.25)] backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-slate-200">Event Name</label>
              <input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Hackathon 2026"
                className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-slate-200">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm text-white focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-slate-200">Google Drive Link</label>
              <input
                type="url"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                Save Card
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center text-slate-400 py-10">
            Loading certificates...
          </div>
        ) : cards.length > 0 ? (
          cards.map((card) => (
          <div
            key={card.id}
            className="group relative rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-blue-400/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]"
          >
            {isAdmin && (
              <button
                type="button"
                aria-label={`Delete ${card.eventName}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteTarget(card);
                }}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-red-200 transition hover:bg-red-500/20"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1h3a1 1 0 1 1 0 2h-1v11a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V5H5a1 1 0 0 1 0-2h4Zm2 4a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm4 0a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1ZM7 5h10v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5Z"/>
                </svg>
              </button>
            )}

            <a
              href={card.driveLink}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <div className="mb-4 flex items-center justify-between gap-3 pr-12">
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-green-300">
                  Verified
                </span>
                <span className="text-xs text-slate-400">Open</span>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {card.eventName}
                </h2>

                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-blue-300">📅</span>
                  <span>{new Date(card.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-blue-300">🔗</span>
                  <span className="truncate text-blue-200 underline decoration-blue-400/60 underline-offset-4">
                    {card.driveLink}
                  </span>
                </div>
              </div>
            </a>
          </div>
        ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-400">
            No certificate cards yet.
          </div>
        )}
      </div>

      {!isLoading && cards.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-400">
          No certificate cards yet.
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
        <span>Total Certificates</span>
        <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-blue-200">{totalCertificates}</span>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/95 p-6 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
            <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Delete Certificate
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Are you sure you want to delete the certificate for <span className="font-semibold text-white">{deleteTarget.eventName}</span>?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCard(deleteTarget.id)}
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
