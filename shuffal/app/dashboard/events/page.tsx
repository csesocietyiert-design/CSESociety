'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useEvents } from '@/lib/hooks';

type PendingEvent = { id: string; title: string; event_type?: 'cultural' | 'technical' | 'general' };

export default function EventsPage() {
  const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { events, loading } = useEvents();
    const [form, setForm] = useState({ title: '', expectedDate: '', authorityLetterUrl: '', caption: '' });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
    const canCreate = user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'cultural_secretary' || user?.role === 'technical_secretary';
    const canDelete = user?.role === 'admin' || user?.role === 'faculty';
    const canDeleteOwnPending = user?.role === 'cultural_secretary' || user?.role === 'technical_secretary';

    useEffect(() => {
      if (!canDeleteOwnPending) return;
      fetch('/api/events?pending=mine').then((response) => response.json()).then((payload) => setPendingEvents(payload.events || [])).catch(() => setPendingEvents([]));
    }, [canDeleteOwnPending]);

    const handleDelete = async (eventId: string, eventTitle: string) => {
      if (!window.confirm(`Remove "${eventTitle}"? This cannot be undone.`)) return;
      setDeleting(eventId);
      setError('');
      try {
        const response = await fetch('/api/events', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, userId: user?.id }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Could not remove event');
        if (canDeleteOwnPending) setPendingEvents((current) => current.filter((event) => event.id !== eventId));
        else window.location.reload();
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Could not remove event');
      } finally {
        setDeleting(null);
      }
    };

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
    <div className="mx-auto max-w-7xl space-y-6 pb-8 pt-4 text-white sm:pt-6">
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-slate-700/70 bg-slate-900/40 px-4 py-2 text-sm text-slate-300 backdrop-blur-md transition hover:border-teal-400 hover:text-white">Back</button>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Society updates</p>
          <h1 className="text-3xl font-bold leading-tight">Upcoming events</h1>
        </div>
      </div>

      {canCreate && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-teal-500/30 bg-gradient-to-br from-teal-600/15 to-slate-900/70 p-6 text-left shadow-lg shadow-black/10 backdrop-blur-md">
          <h2 className="text-xl font-semibold">{user?.role === 'cultural_secretary' ? 'Add cultural event' : user?.role === 'technical_secretary' ? 'Add technical event' : 'Add event update'}</h2>
          <p className="mt-1 text-sm text-slate-400">{user?.role === 'cultural_secretary' || user?.role === 'technical_secretary' ? 'Submit this event for admin approval before publication.' : 'Create a news-style event card for all members.'}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Event name" className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400" />
            <input required type="date" value={form.expectedDate} onChange={(event) => setForm({ ...form, expectedDate: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400" aria-label="Expected date" />
            <input required type="url" value={form.authorityLetterUrl} onChange={(event) => setForm({ ...form, authorityLetterUrl: event.target.value })} placeholder="Higher authority letter URL" className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 sm:col-span-2" />
            <textarea value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} placeholder="Caption (optional)" rows={3} className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 sm:col-span-2" />
          </div>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
          <button disabled={saving} type="submit" className="mt-5 rounded-lg bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-950/20 transition hover:bg-teal-400 disabled:opacity-50">{saving ? 'Adding...' : 'Add event'}</button>
        </form>
      )}

      {canDeleteOwnPending && pendingEvents.length > 0 && <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
        <h2 className="text-xl font-semibold text-white">My pending events</h2>
        <p className="mt-1 text-sm text-amber-100/70">These events are visible only to you until an admin approves them.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{pendingEvents.map((event) => <article key={event.id} className="rounded-lg border border-amber-500/30 bg-slate-950/40 p-5"><p className="text-xs uppercase tracking-wider text-amber-300">{event.event_type === 'technical' ? 'Technical event' : 'Cultural event'}</p><h3 className="mt-2 font-semibold text-white">{event.title}</h3><button type="button" onClick={() => handleDelete(event.id, event.title)} disabled={deleting === event.id} className="mt-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300">{deleting === event.id ? 'Removing...' : 'Delete pending event'}</button></article>)}</div>
      </section>}

      <section className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-blue-600/15 to-slate-900/70 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
        <h2 className="text-xl font-semibold">Recent activity</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {loading ? <p className="text-sm text-slate-500">Loading events...</p> : events.length === 0 ? <p className="text-sm text-slate-500">No event updates yet.</p> : events.map((event) => (
            <article key={event.id} className="rounded-lg border border-slate-700/70 bg-slate-950/50 p-5 shadow-sm shadow-black/10 transition hover:border-blue-400/50">
              <p className="text-xs uppercase tracking-wider text-amber-300">{event.event_type === 'cultural' ? 'Cultural event' : event.event_type === 'technical' ? 'Technical event' : 'Event'} · Expected {new Date(event.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{event.title}</h3>
              {event.caption && <p className="mt-2 text-sm leading-6 text-slate-300">{event.caption}</p>}
              {event.authority_letter_url && <a href={event.authority_letter_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-teal-300 hover:text-teal-200">Read authority letter</a>}
              {canDelete && <button type="button" onClick={() => handleDelete(event.id, event.title)} disabled={deleting === event.id} className="mt-4 block rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-300 hover:bg-rose-500/20 hover:text-rose-200 disabled:opacity-50">{deleting === event.id ? 'Removing...' : 'Remove Event'}</button>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
