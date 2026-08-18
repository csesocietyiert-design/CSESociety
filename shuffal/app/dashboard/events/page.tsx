'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useEvents } from '@/lib/hooks';

export default function EventsPage() {
  const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { events, loading } = useEvents();
    const [form, setForm] = useState({ title: '', expectedDate: '', authorityLetterUrl: '', caption: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const canCreate = user?.role === 'admin' || user?.role === 'faculty';

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);
      setError('');

      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, createdBy: user?.id, creatorRole: user?.role }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Could not add event');
        setForm({ title: '', expectedDate: '', authorityLetterUrl: '', caption: '' });
        window.location.reload();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Could not add event');
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8 text-white">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-teal-400 hover:text-white">Back</button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Society updates</p>
          <h1 className="mt-1 text-3xl font-semibold">Upcoming events</h1>
        </div>
      </div>

      {canCreate && (
        <form onSubmit={handleSubmit} className="border border-slate-700/70 bg-slate-900/70 p-6 text-left">
          <h2 className="text-xl font-semibold">Add event update</h2>
          <p className="mt-1 text-sm text-slate-500">Create a news-style event card for all members.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Event name" className="border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-teal-400" />
            <input required type="date" value={form.expectedDate} onChange={(event) => setForm({ ...form, expectedDate: event.target.value })} className="border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-teal-400" aria-label="Expected date" />
            <input required type="url" value={form.authorityLetterUrl} onChange={(event) => setForm({ ...form, authorityLetterUrl: event.target.value })} placeholder="Higher authority letter URL" className="border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-teal-400 sm:col-span-2" />
            <textarea value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} placeholder="Caption (optional)" rows={3} className="border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-teal-400 sm:col-span-2" />
          </div>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
          <button disabled={saving} type="submit" className="mt-5 bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-50">{saving ? 'Adding...' : 'Add event'}</button>
        </form>
      )}

      <section className="border border-slate-700/70 bg-slate-900/60 p-6">
        <h2 className="text-xl font-semibold">Recent activity</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {loading ? <p className="text-sm text-slate-500">Loading events...</p> : events.length === 0 ? <p className="text-sm text-slate-500">No event updates yet.</p> : events.map((event) => (
            <article key={event.id} className="border border-slate-700 bg-slate-950/50 p-5">
              <p className="text-xs uppercase tracking-wider text-amber-300">Expected {new Date(event.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{event.title}</h3>
              {event.caption && <p className="mt-2 text-sm leading-6 text-slate-300">{event.caption}</p>}
              {event.authority_letter_url && <a href={event.authority_letter_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-teal-300 hover:text-teal-200">Read authority letter</a>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
