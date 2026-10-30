'use client';

import { useEffect, useState } from 'react';

type EntryPass = {
  id: string;
  fullName: string;
  participantType: 'member' | 'non_member';
  societyId: string | null;
  studentId: string | null;
  session: 'first_half' | 'second_half' | 'both';
  games: string[];
  teamFormat: 'solo' | 'duo';
  teamName: string | null;
  feeAmount: number;
  attendanceStatus: string;
  eventTitle: string;
  venue: string;
  eventDate: string;
};

const sessionLabels: Record<EntryPass['session'], string> = {
  first_half: 'First Half · 9:00 AM–12:00 PM',
  second_half: 'Second Half · 2:00 PM–4:00 PM',
  both: 'Both Sessions · 9:00 AM–4:00 PM',
};

export default function EventEntryPass({ token }: { token: string }) {
  const [entryPass, setEntryPass] = useState<EntryPass | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/event-registration/pass/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Entry pass is unavailable.');
        return payload.pass as EntryPass;
      })
      .then((pass) => {
        if (active) setEntryPass(pass);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Entry pass is unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading entry pass…</main>;
  }
  if (error || !entryPass) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-200">
        <section className="max-w-lg rounded-2xl border border-rose-500/30 bg-slate-900 p-8 text-center">
          <h1 className="text-xl font-bold">Entry pass unavailable</h1>
          <p className="mt-3 text-sm text-slate-400">{error || 'The payment may still be awaiting verification.'}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <article className="mx-auto max-w-2xl rounded-2xl border border-teal-500/40 bg-gradient-to-br from-slate-900 to-teal-950/40 p-6 shadow-2xl sm:p-10">
        <header className="flex flex-col gap-3 border-b border-slate-700 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">CSE Society · IERT</p>
            <h1 className="mt-2 text-2xl font-extrabold">{entryPass.eventTitle}</h1>
            <p className="mt-1 text-sm text-slate-400">{entryPass.venue} · {new Date(`${entryPass.eventDate}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' })}</p>
          </div>
          <button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 print:hidden">Print pass</button>
        </header>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <PassField label="Participant" value={entryPass.fullName} />
          <PassField label="Registration reference" value={entryPass.id} />
          <PassField label={entryPass.participantType === 'member' ? 'Society ID' : 'Student ID'} value={entryPass.societyId || entryPass.studentId || '-'} />
          <PassField label="Session" value={sessionLabels[entryPass.session]} />
          <PassField label="Game(s)" value={entryPass.games.join(', ') || 'Chess'} />
          <PassField label="Format / team" value={`${entryPass.teamFormat === 'duo' ? 'Duo' : 'Solo'}${entryPass.teamName ? ` · ${entryPass.teamName}` : ''}`} />
        </div>
        {entryPass.participantType === 'member' && (
          <p className="mt-6 rounded-lg border border-teal-500/20 bg-teal-950/30 p-4 text-sm text-teal-100">Bring your CSE Society ID card. It will be used for attendance during entry.</p>
        )}
        <p className="mt-6 border-t border-slate-700 pt-4 text-xs text-slate-500">Show this pass at the event entry desk. Attendance status: {entryPass.attendanceStatus.replace('_', ' ')}.</p>
      </article>
    </main>
  );
}

function PassField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-white">{value}</p>
    </div>
  );
}
