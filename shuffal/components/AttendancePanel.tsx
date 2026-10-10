'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuthStore } from '@/lib/store';

type AttendanceSession = {
  id: string;
  eventName: string;
  date: string;
  createdAt?: string;
  approvalStatus: 'pending' | 'approved';
};

const managerRoles = new Set(['general_secretary', 'cultural_secretary', 'technical_secretary']);
const adminRole = 'admin';

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function getError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return body?.error || fallback;
}

export default function AttendancePanel() {
  const user = useAuthStore((state) => state.user);
  const canManage = Boolean(user && managerRoles.has(user.role));
  const isAdmin = user?.role === adminRole;
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionSessionId, setActionSessionId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState<AttendanceSession | null>(null);
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/attendance');
      if (!response.ok) throw new Error(await getError(response, 'Failed to load attendance sessions'));
      const data = await response.json() as { sessions: AttendanceSession[] };
      setSessions(data.sessions);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load attendance sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadSessions(), 0);
    const interval = window.setInterval(() => void loadSessions(), 15000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadSessions]);

  const openCreateForm = () => {
    setFormOpen(true);
    setFormSession(null);
    setEventName('');
    setDate('');
    setError(null);
  };

  const openEditForm = (session: AttendanceSession) => {
    setFormOpen(true);
    setFormSession(session);
    setEventName(session.eventName);
    setDate(session.date);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage || !eventName.trim() || !date) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(formSession ? `/api/attendance/${formSession.id}` : '/api/attendance', {
        method: formSession ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: eventName.trim(), date }),
      });
      if (!response.ok) throw new Error(await getError(response, 'Unable to save attendance session'));
      const data = await response.json() as { session: AttendanceSession };
      setSessions((current) => formSession
        ? current.map((session) => session.id === data.session.id ? data.session : session)
        : [data.session, ...current]);
      setFormOpen(false);
      setFormSession(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save attendance session');
    } finally {
      setSaving(false);
    }
  };

  const handleSessionAction = async (session: AttendanceSession, action: 'approve' | 'delete') => {
    if (action === 'delete' && !window.confirm(`Delete the attendance session "${session.eventName}" and its attendee records?`)) {
      return;
    }
    setActionSessionId(session.id);
    setError(null);
    try {
      const response = await fetch(
        action === 'approve' ? `/api/attendance/${session.id}/approve` : `/api/attendance/${session.id}`,
        { method: action === 'approve' ? 'POST' : 'DELETE' },
      );
      if (!response.ok) throw new Error(await getError(response, `Unable to ${action} attendance session`));
      if (action === 'delete') {
        setSessions((current) => current.filter((item) => item.id !== session.id));
      } else {
        const result = await response.json() as { session: AttendanceSession };
        setSessions((current) => current.map((item) => item.id === session.id ? result.session : item));
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Unable to ${action} attendance session`);
    } finally {
      setActionSessionId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-blue-300">CSE Society</p>
          <h1 className="mt-2 text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Attendance
          </h1>
          <p className="mt-2 text-sm text-slate-400">Browse sessions and review marked attendees.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/25"
          >
            <span className="text-xl leading-none">+</span>
            Create Session
          </button>
        )}
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <p className="col-span-full py-10 text-center text-slate-400">Loading attendance sessions...</p>
        ) : sessions.length ? sessions.map((session) => (
          <article
            key={session.id}
            className="group relative rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-400/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 pr-1">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                session.approvalStatus === 'approved'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}>
                {session.approvalStatus === 'approved' ? 'Approved' : 'Pending approval'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {canManage && session.approvalStatus === 'pending' && (
                  <button
                    type="button"
                    onClick={() => openEditForm(session)}
                    aria-label={`Edit ${session.eventName}`}
                    className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-blue-400/60 hover:text-white"
                  >
                    Edit
                  </button>
                )}
                {isAdmin && session.approvalStatus === 'pending' && (
                  <button
                    type="button"
                    disabled={actionSessionId === session.id}
                    onClick={() => void handleSessionAction(session, 'approve')}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {actionSessionId === session.id ? 'Working...' : 'Approve'}
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    disabled={actionSessionId === session.id}
                    onClick={() => void handleSessionAction(session, 'delete')}
                    aria-label={`Delete ${session.eventName}`}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <Link href={`/dashboard/attendance/${session.id}`} className="block">
              <h2 className="mt-5 text-xl font-bold text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {session.eventName}
              </h2>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <span aria-hidden="true" className="text-blue-300">📅</span>
                {formatDate(session.date)}
              </p>
              <p className="mt-5 text-sm font-medium text-blue-200 group-hover:text-blue-100">View marked attendance →</p>
            </Link>
          </article>
        )) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-400">
            No attendance sessions yet.
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
          <span>Total Sessions</span>
          <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-blue-200">{sessions.length}</span>
        </div>
      )}

      {canManage && formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-700/70 bg-slate-900 p-6 shadow-2xl"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Attendance Management</p>
              <h2 className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {formSession ? 'Edit Session' : 'Create Session'}
              </h2>
            </div>
            <label className="block text-sm font-medium text-slate-200">
              Event Name
              <input
                required
                maxLength={255}
                autoFocus
                value={eventName}
                onChange={(event) => setEventName(event.target.value)}
                placeholder="e.g. Annual Society Meet"
                className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-slate-200">
              Date
              <input
                required
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm text-white focus:border-blue-400 focus:outline-none"
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setFormOpen(false); setFormSession(null); setEventName(''); setError(null); }}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : formSession ? 'Save Changes' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
