'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { EVENT_REGISTRATION, isEventRegistrationOpen } from '@/lib/event-registration';
import { FORM_CREATOR_ROLES, isFormExpired, normalizeFormRole, type RegistrationForm } from '@/lib/forms';
import type { User } from '@/lib/store';

interface RegistrationFormsPanelProps {
  user?: User | null;
  publicPage?: boolean;
}

export default function RegistrationFormsPanel({ user = null, publicPage = false }: RegistrationFormsPanelProps) {
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extensionDates, setExtensionDates] = useState<Record<string, string>>({});
  const [formInput, setFormInput] = useState({ title: '', endDate: '', resourceUrl: '', documentUrl: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [eventOpen, setEventOpen] = useState(isEventRegistrationOpen);

  const isAdmin = user?.role === 'admin';
  const canCreate = user ? FORM_CREATOR_ROLES.has(normalizeFormRole(user.role)) : false;

  const loadForms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/forms', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load forms');
      setForms(payload.forms || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load forms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadForms();
  }, [loadForms]);

  useEffect(() => {
    const timer = window.setInterval(() => setEventOpen(isEventRegistrationOpen()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formInput),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not create form');
      setFormInput({ title: '', endDate: '', resourceUrl: '', documentUrl: '' });
      setNotice('Registration form created.');
      await loadForms();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create form');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (form: RegistrationForm) => {
    if (!window.confirm(`Delete "${form.title}"? This cannot be undone.`)) return;
    setDeletingId(form.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/forms/${form.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not delete form');
      setForms((current) => current.filter((item) => item.id !== form.id));
      setNotice('Registration form deleted.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete form');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExtend = async (form: RegistrationForm) => {
    const endDate = extensionDates[form.id] || '';
    if (!endDate) {
      setError('Choose a new end date.');
      return;
    }
    setExtendingId(form.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/forms/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endDate }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not extend form date');
      setExtensionDates((current) => ({ ...current, [form.id]: '' }));
      setNotice('Form end date extended.');
      await loadForms();
    } catch (extendError) {
      setError(extendError instanceof Error ? extendError.message : 'Could not extend form date');
    } finally {
      setExtendingId(null);
    }
  };

  const handleShare = async (form: RegistrationForm) => {
    const url = `${window.location.origin}/forms/${form.id}`;
    setError('');
    setNotice('');
    try {
      if (navigator.share) {
        await navigator.share({ title: form.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setNotice('Form link copied to clipboard.');
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === 'AbortError') return;
      setError('Could not share the form link. Check your browser clipboard permissions.');
    }
  };

  const handleShareEvent = async () => {
    const url = `${window.location.origin}/forms/${EVENT_REGISTRATION.publicFormId}`;
    setError('');
    setNotice('');
    try {
      if (navigator.share) {
        await navigator.share({ title: EVENT_REGISTRATION.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setNotice('Event registration link copied to clipboard.');
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === 'AbortError') return;
      setError('Could not share the event registration link. Check your browser clipboard permissions.');
    }
  };

  return (
    <main className={publicPage ? 'w-full flex-1 bg-[#0b2740]' : 'mx-auto max-w-7xl space-y-6 pb-8 pt-4 text-white sm:pt-6'}>
      <div className={publicPage ? 'mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 pt-8 text-white sm:px-8 sm:pb-12 sm:pt-10' : 'space-y-6'}>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Registration</p>
        <h1 className="text-3xl font-bold leading-tight">Registration forms</h1>
        <p className="text-sm text-slate-400">Browse current forms and share a form-specific link.</p>
      </header>

      {canCreate && (
        <form onSubmit={handleCreate} className="rounded-xl border border-[#36546b] bg-gradient-to-br from-[#123653] to-[#071b2b] p-6 shadow-lg shadow-black/10">
          <h2 className="text-xl font-semibold">Create a registration form</h2>
          <p className="mt-1 text-sm text-slate-400">Add the form name, closing date, required registration link, and optional document link.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span>Form name</span>
              <input required maxLength={150} value={formInput.title} onChange={(event) => setFormInput({ ...formInput, title: event.target.value })} className="w-full rounded-lg border border-[#36546b] bg-[#071b2b] px-4 py-3 text-white outline-none focus:border-sky-300" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>End date</span>
              <input required type="date" value={formInput.endDate} onChange={(event) => setFormInput({ ...formInput, endDate: event.target.value })} className="w-full rounded-lg border border-[#36546b] bg-[#071b2b] px-4 py-3 text-white outline-none focus:border-sky-300" />
            </label>
            <label className="space-y-2 text-sm text-slate-300 sm:col-span-2">
              <span>Registration link <span className="text-rose-300">(required)</span></span>
              <input required type="url" value={formInput.resourceUrl} onChange={(event) => setFormInput({ ...formInput, resourceUrl: event.target.value })} className="w-full rounded-lg border border-[#36546b] bg-[#071b2b] px-4 py-3 text-white outline-none focus:border-sky-300" />
            </label>
            <label className="space-y-2 text-sm text-slate-300 sm:col-span-2">
              <span>Document link <span className="text-slate-500">(optional)</span></span>
              <input type="url" value={formInput.documentUrl} onChange={(event) => setFormInput({ ...formInput, documentUrl: event.target.value })} className="w-full rounded-lg border border-[#36546b] bg-[#071b2b] px-4 py-3 text-white outline-none focus:border-sky-300" />
            </label>
          </div>
          <button disabled={saving} type="submit" className="mt-5 rounded-lg bg-sky-300 px-5 py-3 text-sm font-semibold text-[#071b2b] transition hover:bg-sky-200 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create form'}
          </button>
        </form>
      )}

      {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

      {!publicPage && <article className={`flex flex-col overflow-hidden rounded-2xl border p-5 shadow-lg shadow-black/10 backdrop-blur-md transition sm:p-6 ${eventOpen === false ? 'border-slate-700 bg-slate-900/50 text-slate-400' : 'border-[#52738c] bg-gradient-to-br from-[#123653] via-[#0d2942] to-[#071b2b] text-white'}`}>
          <div className="flex items-start justify-between gap-4">
            <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${eventOpen === false ? 'border-slate-600 bg-slate-800/60 text-slate-400' : 'border-sky-300/30 bg-sky-300/10 text-sky-200'}`}>
              {eventOpen ? 'Open for registration' : 'Registration closed'}
            </p>
            <button
              type="button"
              onClick={() => void handleShareEvent()}
              aria-label="Share E-Sports Swiss-League Tournament registration"
              title="Share event registration"
              className={`shrink-0 rounded-lg border p-2.5 transition ${eventOpen === false ? 'border-slate-600/70 text-slate-400 hover:border-slate-500 hover:text-slate-200' : 'border-[#52738c] bg-slate-950/20 text-sky-100 hover:border-sky-300 hover:bg-sky-300/10'}`}
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16V4m0 0L8 8m4-4 4 4M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
            </button>
          </div>
          <h2 className={`mt-4 text-xl font-bold tracking-tight sm:text-2xl ${eventOpen === false ? 'text-slate-400' : 'text-white'}`}>{EVENT_REGISTRATION.title}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-950/20 px-4 py-3">
              <p className={`text-xs font-semibold uppercase tracking-wider ${eventOpen === false ? 'text-slate-500' : 'text-sky-200/70'}`}>Date & venue</p>
              <p className={`mt-1.5 text-sm ${eventOpen === false ? 'text-slate-400' : 'text-slate-200'}`}>1 November 2026 · {EVENT_REGISTRATION.venue}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/20 px-4 py-3">
              <p className={`text-xs font-semibold uppercase tracking-wider ${eventOpen === false ? 'text-slate-500' : 'text-sky-200/70'}`}>Games</p>
              <p className={`mt-1.5 text-sm ${eventOpen === false ? 'text-slate-400' : 'text-slate-200'}`}>First Half: BGMI or Free Fire · Second Half: Table Tennis or Chess</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-sm text-slate-400">Registration closes at 9:00 AM IST · Members free · Non-members from ₹30</p>
            <Link
              href={`/forms/${EVENT_REGISTRATION.publicFormId}`}
              className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition ${eventOpen === false ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-sky-300 text-[#071b2b] hover:bg-sky-200'}`}
            >
              {eventOpen ? 'Register now' : 'View event'}
            </Link>
          </div>
      </article>}

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">All forms</h2>
          {!publicPage && !loading && <span className="text-sm text-slate-400">{forms.length} {forms.length === 1 ? 'form' : 'forms'}</span>}
        </div>
        {publicPage ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="flex flex-col rounded-xl border border-slate-700 bg-slate-900/50 p-5 text-slate-400">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Closed</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-400">{EVENT_REGISTRATION.title}</h3>
              <p className="mt-4 text-sm">Registration is closed.</p>
            </article>
          </div>
        ) : loading ? (
          <p className="py-10 text-center text-slate-400">Loading forms...</p>
        ) : forms.length === 0 ? (
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 px-6 py-12 text-center text-slate-400">No registration forms have been created yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {forms.map((form) => {
              const expired = isFormExpired(form.end_date);
              const link = `/forms/${form.id}${expired && isAdmin ? '?admin=1' : ''}`;
              return (
                <article key={form.id} className={`flex flex-col rounded-xl border p-5 transition ${expired ? 'border-slate-700 bg-slate-900/35 text-slate-400' : 'border-[#36546b] bg-gradient-to-br from-[#123653] to-[#071b2b] text-white shadow-lg shadow-black/10'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <Link href={link} className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${expired ? 'text-slate-500' : 'text-sky-200'}`}>{expired ? 'Closed' : 'Open for registration'}</p>
                      <h3 className={`mt-2 break-words text-lg font-semibold ${expired ? 'text-slate-400' : 'text-white'}`}>{form.title}</h3>
                    </Link>
                    <button type="button" onClick={() => void handleShare(form)} aria-label={`Share ${form.title}`} title="Share form link" className="shrink-0 rounded-lg border border-[#52738c] p-2 text-slate-300 transition hover:border-sky-300 hover:text-sky-200">
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16V4m0 0L8 8m4-4 4 4M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
                    </button>
                  </div>
                  <Link href={link} className="mt-4 text-sm">
                    End date: <time dateTime={form.end_date}>{new Date(`${form.end_date}T00:00:00`).toLocaleDateString()}</time>
                    {expired && <span className="ml-2 text-xs text-slate-500">· Form closed</span>}
                  </Link>
                  {expired && isAdmin && <p className="mt-3 text-xs text-amber-300">Admins can open this form from the dashboard.</p>}

                  {isAdmin && (
                    <div className="mt-5 border-t border-slate-700/70 pt-4">
                      <label className="block text-xs font-medium text-slate-400" htmlFor={`extend-${form.id}`}>Extend end date</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input id={`extend-${form.id}`} type="date" min={nextDate(form.end_date)} value={extensionDates[form.id] || ''} onChange={(event) => setExtensionDates((current) => ({ ...current, [form.id]: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-[#36546b] bg-[#071b2b] px-3 py-2 text-sm text-white outline-none focus:border-sky-300" />
                        <button type="button" onClick={() => void handleExtend(form)} disabled={extendingId === form.id} className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-400/20 disabled:opacity-50">
                          {extendingId === form.id ? 'Saving...' : 'Extend'}
                        </button>
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <button type="button" onClick={() => void handleDelete(form)} disabled={deletingId === form.id} className="mt-3 self-start rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50">
                      {deletingId === form.id ? 'Deleting...' : 'Delete form'}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      </div>
    </main>
  );
}

function nextDate(date: string): string {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}
