'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Document, HeadingLevel, PageOrientation, Packer, Paragraph } from 'docx';
import jsPDF from 'jspdf';
import { EVENT_REGISTRATION } from '@/lib/event-registration';

type EventRegistration = {
  id: string;
  participant_type: 'member' | 'non_member';
  society_id: string | null;
  full_name: string;
  college_roll_number: string | null;
  department: string | null;
  year: number | null;
  whatsapp_phone: string | null;
  email: string;
  session_selection: 'first_half' | 'second_half' | 'both';
  games: string[];
  team_format: 'solo' | 'duo';
  team_name: string | null;
  bgmi_ign: string | null;
  bgmi_uid: string | null;
  free_fire_ign: string | null;
  free_fire_uid: string | null;
  chess_username: string | null;
  fee_amount: number;
  payment_transaction_id: string | null;
  payment_screenshot_path: string | null;
  payment_status: 'waived' | 'pending' | 'verified' | 'rejected';
  delivery_method: 'email' | 'whatsapp';
  pass_status: 'pending' | 'sent';
  attendance_status: 'registered' | 'checked_in' | 'no_show';
  evaluation_score: number | null;
  evaluation_notes: string | null;
  created_at: string;
};

type EvaluationDraft = { score: string; notes: string };
type RosterFilter = 'all' | 'member' | 'non_member';

const sessionLabels: Record<EventRegistration['session_selection'], string> = {
  first_half: 'First Half',
  second_half: 'Second Half',
  both: 'Both Sessions',
};

export default function EventRegistrationsPanel() {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<RosterFilter>('all');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, EvaluationDraft>>({});

  const loadRegistrations = useCallback(async () => {
    const response = await fetch('/api/event-registration', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Could not load event registrations.');
    if (!Array.isArray(payload.registrations)) throw new Error('The event registration response was invalid.');
    return payload.registrations as EventRegistration[];
  }, []);

  const applyRows = useCallback((rows: EventRegistration[]) => {
    setRegistrations(rows);
    setDrafts(Object.fromEntries(rows.map((row) => [row.id, {
      score: row.evaluation_score === null ? '' : String(row.evaluation_score),
      notes: row.evaluation_notes || '',
    }])));
  }, []);

  useEffect(() => {
    let active = true;
    loadRegistrations()
      .then((rows) => {
        if (active) applyRows(rows);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load event registrations.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyRows, loadRegistrations]);

  const visibleRegistrations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...registrations]
      .filter((row) => filter === 'all' || row.participant_type === filter)
      .filter((row) => !normalizedSearch || [
        row.full_name,
        row.society_id,
        row.college_roll_number,
        row.email,
        row.whatsapp_phone,
        row.team_name,
        row.payment_transaction_id,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch)))
      .sort((first, second) =>
        (first.participant_type === 'member' ? 0 : 1) - (second.participant_type === 'member' ? 0 : 1)
        || first.created_at.localeCompare(second.created_at));
  }, [filter, registrations, search]);

  const summary = useMemo(() => ({
    members: registrations.filter((row) => row.participant_type === 'member').length,
    nonMembers: registrations.filter((row) => row.participant_type === 'non_member').length,
    pendingPayments: registrations.filter((row) => row.payment_status === 'pending').length,
    checkedIn: registrations.filter((row) => row.attendance_status === 'checked_in').length,
  }), [registrations]);

  const updateRegistration = async (row: EventRegistration, changes: Record<string, unknown>, successMessage: string) => {
    setSavingId(row.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/event-registration/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not update registration.');
      setRegistrations((current) => current.map((item) => item.id === row.id ? payload.registration : item));
      setNotice(successMessage);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update registration.');
    } finally {
      setSavingId('');
    }
  };

  const sendEntryPass = async (row: EventRegistration, method: 'email' | 'whatsapp') => {
    const whatsappWindow = method === 'whatsapp' ? window.open('about:blank', '_blank') : null;
    setSavingId(row.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/event-registration/${row.id}/pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not deliver the entry pass.');
      if (method === 'email') {
        setRegistrations((current) => current.map((item) => item.id === row.id ? { ...item, pass_status: 'sent' } : item));
      } else if (whatsappWindow && payload.whatsappUrl) {
        whatsappWindow.location.href = payload.whatsappUrl;
      } else {
        throw new Error('Allow pop-ups to open WhatsApp and send this pass.');
      }
      setNotice(payload.message || 'Entry pass delivery started.');
    } catch (sendError) {
      whatsappWindow?.close();
      setError(sendError instanceof Error ? sendError.message : 'Could not deliver the entry pass.');
    } finally {
      setSavingId('');
    }
  };

  const saveEvaluation = (row: EventRegistration) => {
    const draft = drafts[row.id] || { score: '', notes: '' };
    void updateRegistration(row, {
      evaluationScore: draft.score,
      evaluationNotes: draft.notes,
    }, `Evaluation saved for ${row.full_name}.`);
  };

  const downloadPdf = () => {
    const pdf = new jsPDF({ orientation: 'landscape' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 16;
    pdf.setFontSize(16);
    pdf.text(EVENT_REGISTRATION.title, 14, y);
    y += 7;
    pdf.setFontSize(9);
    pdf.text(`Roster exported ${new Date().toLocaleString('en-IN')} · Members are listed before non-members`, 14, y);
    y += 8;
    pdf.setFontSize(8);

    visibleRegistrations.forEach((row, index) => {
      const details = [
        `${index + 1}. ${row.participant_type === 'member' ? 'MEMBER' : 'NON-MEMBER'}  |  ${row.full_name}  |  ${row.society_id || row.college_roll_number || ''}`,
        `Session: ${sessionLabels[row.session_selection]}  |  Games: ${row.games.join(', ') || 'Chess'}  |  Team: ${row.team_name || row.team_format}`,
        `Email: ${row.email}  |  WhatsApp: ${row.whatsapp_phone}  |  Fee: Rs ${row.fee_amount}  |  Payment: ${row.payment_status}`,
        `Attendance: ${row.attendance_status}  |  Evaluation: ${row.evaluation_score ?? '-'}  |  Notes: ${row.evaluation_notes || '-'}`,
        `BGMI: ${row.bgmi_ign || '-'} / ${row.bgmi_uid || '-'}  |  Free Fire: ${row.free_fire_ign || '-'} / ${row.free_fire_uid || '-'}  |  Chess username: ${row.chess_username || '-'}`,
      ].join('\n');
      const lines = pdf.splitTextToSize(details, pageWidth - 28);
      const blockHeight = lines.length * 4 + 5;
      if (y + blockHeight > pageHeight - 12) {
        pdf.addPage();
        y = 16;
      }
      pdf.text(lines, 14, y);
      y += blockHeight;
      pdf.setDrawColor(210);
      pdf.line(14, y - 2, pageWidth - 14, y - 2);
    });

    pdf.save(`esports-registration-roster-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const downloadDocx = async () => {
    setError('');
    setNotice('');
    try {
      const paragraphs = [
        new Paragraph({ text: EVENT_REGISTRATION.title, heading: HeadingLevel.TITLE }),
        new Paragraph(`Venue: ${EVENT_REGISTRATION.venue} · Event date: 1 November 2026`),
        new Paragraph(`Exported: ${new Date().toLocaleString('en-IN')} · Members are listed before non-members`),
        new Paragraph(' '),
        ...visibleRegistrations.flatMap((row, index) => [
          new Paragraph({
            text: `${index + 1}. ${row.participant_type === 'member' ? 'SOCIETY MEMBER' : 'NON-MEMBER'} — ${row.full_name}`,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph(`Society ID / student ID: ${row.society_id || row.college_roll_number || '-'}`),
          new Paragraph(`Department / year: ${row.department || '-'} / ${row.year || '-'}`),
          new Paragraph(`Email: ${row.email} · WhatsApp: ${row.whatsapp_phone}`),
          new Paragraph(`Session: ${sessionLabels[row.session_selection]} · Games: ${row.games.join(', ') || 'Chess'} · Format: ${row.team_format} · Team: ${row.team_name || '-'}`),
          new Paragraph(`Fee: Rs ${row.fee_amount} · Payment: ${row.payment_status} · Transaction ID: ${row.payment_transaction_id || '-'}`),
          new Paragraph(`Attendance: ${row.attendance_status} · Evaluation score: ${row.evaluation_score ?? '-'} · Notes: ${row.evaluation_notes || '-'}`),
          new Paragraph(`BGMI: ${row.bgmi_ign || '-'} / ${row.bgmi_uid || '-'} · Free Fire: ${row.free_fire_ign || '-'} / ${row.free_fire_uid || '-'} · Chess username: ${row.chess_username || '-'}`),
          new Paragraph(' '),
        ]),
      ];
      const document = new Document({
        sections: [{
          properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
          children: paragraphs,
        }],
      });
      const blob = await Packer.toBlob(document);
      downloadBlob(blob, `esports-registration-roster-${new Date().toISOString().slice(0, 10)}.docx`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Could not create the DOCX roster.');
    }
  };

  const printRoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Allow pop-ups to print the roster.');
      return;
    }
    const rows = visibleRegistrations.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.participant_type === 'member' ? 'Member' : 'Non-member')}</td>
        <td>${escapeHtml(row.full_name)}</td>
        <td>${escapeHtml(row.society_id || row.college_roll_number || '-')}</td>
        <td>${escapeHtml(row.department || '-')} / ${escapeHtml(String(row.year || '-'))}</td>
        <td>${escapeHtml(sessionLabels[row.session_selection])}</td>
        <td>${escapeHtml(row.games.join(', ') || 'Chess')}</td>
        <td>${escapeHtml(row.team_name || row.team_format)}</td>
        <td>${escapeHtml(row.email)}</td>
        <td>${escapeHtml(row.whatsapp_phone || '-')}</td>
        <td>Rs ${row.fee_amount} · ${escapeHtml(row.payment_status)}</td>
        <td>${escapeHtml(row.attendance_status)}</td>
        <td>${escapeHtml(String(row.evaluation_score ?? '-'))}</td>
        <td>${escapeHtml(row.evaluation_notes || '-')}</td>
      </tr>`).join('');
    printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(EVENT_REGISTRATION.title)} roster</title>
      <style>body{font:12px Arial,sans-serif;color:#111;padding:20px}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px;text-align:left;vertical-align:top}th{background:#eee} @page{size:landscape}</style>
      </head><body><h1>${escapeHtml(EVENT_REGISTRATION.title)} — registration roster</h1><p>Members listed before non-members · ${new Date().toLocaleString('en-IN')}</p>
      <table><thead><tr><th>#</th><th>Type</th><th>Name</th><th>ID</th><th>Branch/year</th><th>Session</th><th>Games</th><th>Team</th><th>Email</th><th>WhatsApp</th><th>Payment</th><th>Attendance</th><th>Score</th><th>Evaluation notes</th></tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>{window.print();window.close()}</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <main className="event-roster-print mx-auto max-w-7xl space-y-6 pb-8 pt-4 text-white sm:pt-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Event management</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">E-Sports registrations</h1>
          <p className="mt-2 text-sm text-slate-400">{EVENT_REGISTRATION.venue} · 1 November 2026 · Members appear before non-members</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button type="button" onClick={printRoster} disabled={!visibleRegistrations.length} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40">Print</button>
          <button type="button" onClick={downloadPdf} disabled={!visibleRegistrations.length} className="rounded-lg border border-teal-500/40 px-4 py-2 text-sm font-semibold text-teal-200 hover:bg-teal-500/10 disabled:opacity-40">Download PDF</button>
          <button type="button" onClick={() => void downloadDocx()} disabled={!visibleRegistrations.length} className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300 disabled:opacity-40">Download DOCX</button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total entries" value={registrations.length} />
        <SummaryCard label="Society members" value={summary.members} />
        <SummaryCard label="Non-members" value={summary.nonMembers} />
        <SummaryCard label="Pending payments" value={summary.pendingPayments} detail={`${summary.checkedIn} checked in`} />
      </section>

      {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

      <section className="space-y-4 rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 sm:p-6 print:hidden">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search registrations" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-teal-400" />
          <select value={filter} onChange={(event) => setFilter(event.target.value as RosterFilter)} aria-label="Filter registrations" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-teal-400">
            <option value="all">Members + non-members</option>
            <option value="member">Society members</option>
            <option value="non_member">Non-members</option>
          </select>
          <button type="button" onClick={() => {
            setLoading(true);
            loadRegistrations()
              .then(applyRows)
              .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Could not refresh roster.'))
              .finally(() => setLoading(false));
          }} className="rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800">Refresh roster</button>
        </div>
        <p className="text-xs text-slate-500">The roster is member-first. Payment screenshots are private and visible only to authorized dashboard roles.</p>
      </section>

      {loading ? (
        <p role="status" className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">Loading event registrations…</p>
      ) : visibleRegistrations.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">No registrations match this view.</p>
      ) : (
        <section className="space-y-4">
          {visibleRegistrations.map((row, index) => (
            <RegistrationCard
              key={row.id}
              row={row}
              index={index + 1}
              draft={drafts[row.id] || { score: '', notes: '' }}
              saving={savingId === row.id}
              onUpdate={(changes, message) => void updateRegistration(row, changes, message)}
              onSendPass={(method) => void sendEntryPass(row, method)}
              onDraftChange={(draft) => setDrafts((current) => ({ ...current, [row.id]: draft }))}
              onSaveEvaluation={() => saveEvaluation(row)}
            />
          ))}
        </section>
      )}
    </main>
  );
}

function RegistrationCard({
  row,
  index,
  draft,
  saving,
  onUpdate,
  onSendPass,
  onDraftChange,
  onSaveEvaluation,
}: {
  row: EventRegistration;
  index: number;
  draft: EvaluationDraft;
  saving: boolean;
  onUpdate: (changes: Record<string, unknown>, message: string) => void;
  onSendPass: (method: 'email' | 'whatsapp') => void;
  onDraftChange: (draft: EvaluationDraft) => void;
  onSaveEvaluation: () => void;
}) {
  const member = row.participant_type === 'member';
  const phoneDigits = (row.whatsapp_phone || '').replace(/\D/g, '');
  const whatsappNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

  return (
    <article className={`rounded-xl border p-5 shadow-lg ${member ? 'border-teal-500/25 bg-gradient-to-br from-teal-950/40 to-slate-900' : 'border-slate-700 bg-slate-900/80'}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-bold text-slate-400">#{index}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${member ? 'bg-teal-400/10 text-teal-200' : 'bg-amber-400/10 text-amber-200'}`}>{member ? 'Society member' : 'Non-member'}</span>
            <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300">{sessionLabels[row.session_selection]}</span>
            <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300">{row.team_format === 'duo' ? `Duo · ${row.team_name || 'Team'}` : 'Solo'}</span>
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">{row.full_name}</h2>
          <p className="mt-1 text-sm text-slate-400">{row.society_id || row.college_roll_number || 'No student ID'} · {row.department || 'CSE'} · Year {row.year || '-'}</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 xl:grid-cols-3">
            <p><span className="text-slate-500">Email:</span> {row.email}</p>
            <p><span className="text-slate-500">WhatsApp:</span> {row.whatsapp_phone || 'Not on file'}</p>
            <p><span className="text-slate-500">Games:</span> {row.games.join(', ') || 'Chess'}</p>
            {row.bgmi_ign && <p><span className="text-slate-500">BGMI:</span> {row.bgmi_ign} · UID {row.bgmi_uid}</p>}
            {row.free_fire_ign && <p><span className="text-slate-500">Free Fire:</span> {row.free_fire_ign} · UID {row.free_fire_uid}</p>}
            {row.chess_username && <p><span className="text-slate-500">Chess username:</span> {row.chess_username}</p>}
            <p><span className="text-slate-500">Registration:</span> {new Date(row.created_at).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="grid min-w-56 gap-2 text-sm">
          <p className="font-bold text-white">₹{row.fee_amount} <span className="font-normal text-slate-400">· {row.payment_status}</span></p>
          {row.payment_transaction_id && <p className="break-all text-xs text-slate-400">UTR: {row.payment_transaction_id}</p>}
          {row.payment_screenshot_path && <a target="_blank" rel="noreferrer" href={`/api/event-registration/${row.id}/proof`} className="text-sm text-sky-300 underline">View payment screenshot</a>}
          {!member && (
            <select value={row.payment_status} disabled={saving} onChange={(event) => onUpdate({ paymentStatus: event.target.value }, `Payment marked ${event.target.value}.`)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
              <option value="pending">Payment pending</option>
              <option value="verified">Payment verified</option>
              <option value="rejected">Payment rejected</option>
            </select>
          )}
          <select value={row.attendance_status} disabled={saving} onChange={(event) => onUpdate({ attendanceStatus: event.target.value }, `Attendance updated for ${row.full_name}.`)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
            <option value="registered">Not checked in</option>
            <option value="checked_in">Checked in</option>
            <option value="no_show">No show</option>
          </select>
          <select value={row.pass_status} disabled={saving || (!member && row.payment_status !== 'verified')} onChange={(event) => onUpdate({ passStatus: event.target.value }, `Pass status updated for ${row.full_name}.`)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
            <option value="pending">Pass not sent</option>
            <option value="sent">Pass sent</option>
          </select>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={saving || (!member && row.payment_status !== 'verified')} onClick={() => onSendPass('email')} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Send email pass</button>
            {whatsappNumber && <button type="button" disabled={saving || (!member && row.payment_status !== 'verified')} onClick={() => onSendPass('whatsapp')} className="rounded-md border border-emerald-700/50 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/30 disabled:cursor-not-allowed disabled:opacity-40">WhatsApp pass</button>}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-slate-700/70 pt-4 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-end">
        <label className="text-xs font-semibold text-slate-400">
          Evaluation score
          <input type="number" min="0" max="1000" step="0.01" value={draft.score} onChange={(event) => onDraftChange({ ...draft, score: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-xs font-semibold text-slate-400">
          Evaluation notes
          <input maxLength={2000} value={draft.notes} onChange={(event) => onDraftChange({ ...draft, notes: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        </label>
        <button type="button" disabled={saving} onClick={onSaveEvaluation} className="rounded-lg border border-teal-500/40 px-4 py-2 text-xs font-bold text-teal-200 hover:bg-teal-500/10 disabled:opacity-50">{saving ? 'Saving…' : 'Save evaluation'}</button>
      </div>
    </article>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}
