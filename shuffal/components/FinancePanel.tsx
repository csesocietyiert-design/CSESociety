'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type FinanceEntry = {
  id: string;
  entry_type: 'income' | 'expense';
  title: string;
  amount: number;
  event_name?: string | null;
  entry_date: string;
  description?: string | null;
  approval_status: 'pending' | 'approved';
};

type FinanceForm = {
  entryType: 'income' | 'expense';
  title: string;
  amount: string;
  eventName: string;
  entryDate: string;
  description: string;
};

const initialForm: FinanceForm = {
  entryType: 'expense',
  title: '',
  amount: '',
  eventName: '',
  entryDate: new Date().toISOString().split('T')[0],
  description: '',
};

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export default function FinancePanel({ canManage, canApprove }: { canManage: boolean; canApprove: boolean }) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalAmountInput, setTotalAmountInput] = useState('');
  const [form, setForm] = useState<FinanceForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [showTotalEditor, setShowTotalEditor] = useState(false);
  const [error, setError] = useState('');
  const totalAmountClicks = useRef<number[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/finance')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Could not load funds');
        if (active) {
          setEntries(payload.entries || []);
          setTotalAmount(Number(payload.totalAmount || 0));
          setTotalAmountInput(String(payload.totalAmount || 0));
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load funds');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => entries.reduce((summary, entry) => {
    if (entry.approval_status !== 'approved') return summary;
    if (entry.entry_type === 'income') summary.income += Number(entry.amount);
    else summary.expenses += Number(entry.amount);
    return summary;
  }, { income: 0, expenses: 0 }), [entries]);

  const eventCards = useMemo(() => {
    const grouped = new Map<string, { name: string; spent: number; entries: number }>();
    entries.filter((entry) => entry.entry_type === 'expense' && entry.event_name).forEach((entry) => {
      const name = entry.event_name!.trim();
      const current = grouped.get(name) || { name, spent: 0, entries: 0 };
      current.spent += Number(entry.amount);
      current.entries += 1;
      grouped.set(name, current);
    });
    return [...grouped.values()].sort((first, second) => second.spent - first.spent);
  }, [entries]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not save fund entry');
      setEntries((current) => [payload.entry, ...current]);
      setForm(initialForm);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save fund entry');
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (!window.confirm('Remove this fund entry?')) return;
    const response = await fetch('/api/finance', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (response.ok) setEntries((current) => current.filter((entry) => entry.id !== id));
    else setError('Could not remove fund entry');
  };

  const approveEntry = async (id: string) => {
    const response = await fetch('/api/finance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const payload = await response.json();
    if (response.ok) setEntries((current) => current.map((entry) => entry.id === id ? payload.entry : entry));
    else setError(payload.error || 'Could not approve fund entry');
  };

  const saveAmount = async (id: string) => {
    const response = await fetch('/api/finance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, amount: editingAmount, action: 'edit_amount' }) });
    const payload = await response.json();
    if (response.ok) {
      setEntries((current) => current.map((entry) => entry.id === id ? payload.entry : entry));
      setEditingId(null);
    } else setError(payload.error || 'Could not update amount');
  };

  const saveTotalAmount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/finance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_total_amount', amount: totalAmountInput }) });
    const payload = await response.json();
    if (response.ok) {
      setTotalAmount(Number(payload.totalAmount));
      setShowTotalEditor(false);
      totalAmountClicks.current = [];
    }
    else setError(payload.error || 'Could not update total amount');
  };

  const handleTotalAmountClick = () => {
    if (!canApprove) return;
    const now = Date.now();
    const recentClicks = [...totalAmountClicks.current.filter((time) => now - time < 3000), now];
    totalAmountClicks.current = recentClicks;
    if (recentClicks.length >= 8) {
      setShowTotalEditor(true);
      totalAmountClicks.current = [];
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8 text-white">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Core team finance</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Society Funds</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">A shared, current view of available funds and event spending.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[['Remaining funds', totalAmount + totals.income - totals.expenses, 'emerald'], ['Total amount', totalAmount, 'sky'], ['Total expenses', totals.expenses, 'rose']].map(([label, value, tone]) => (
          <button type="button" key={String(label)} onClick={label === 'Total amount' ? handleTotalAmountClick : undefined} className={`w-full rounded-lg border p-5 text-left shadow-lg shadow-black/10 backdrop-blur-md ${tone === 'emerald' ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 to-emerald-700/10' : tone === 'sky' ? 'border-sky-500/30 bg-gradient-to-br from-sky-600/20 to-sky-700/10' : 'border-rose-500/30 bg-gradient-to-br from-rose-600/20 to-rose-700/10'} ${label === 'Total amount' && canApprove ? 'cursor-pointer transition hover:border-sky-300/70' : 'cursor-default'}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{loading ? '--' : currency.format(Number(value))}</p>
          </button>
        ))}
      </section>

      {canApprove && showTotalEditor && <div onClick={() => { setShowTotalEditor(false); totalAmountClicks.current = []; }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Set total fund amount">
        <form onSubmit={saveTotalAmount} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-lg border border-sky-500/30 bg-slate-900 p-6 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Admin controls</p><h2 className="mt-2 text-xl font-semibold">Set total fund amount</h2><p className="mt-1 text-sm text-slate-400">This is the opening amount before approved income and expenses.</p>
          <div className="mt-5 flex gap-2"><input required autoFocus min="0" step="0.01" type="number" value={totalAmountInput} onChange={(event) => setTotalAmountInput(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-sky-400" aria-label="Total fund amount" /><button type="submit" className="rounded-lg bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300">Save total</button></div>
        </form>
      </div>}

      {canManage && <form onSubmit={handleSubmit} className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-600/15 to-slate-900/70 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Treasurer controls</p><h2 className="mt-2 text-xl font-semibold">Add fund entry</h2></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <select required value={form.entryType} onChange={(event) => setForm({ ...form, entryType: event.target.value as FinanceForm['entryType'] })} className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"><option value="expense">Expense</option><option value="income">Income</option></select>
          <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Entry title" className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
          <input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Amount (INR)" className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
          <input value={form.eventName} onChange={(event) => setForm({ ...form, eventName: event.target.value })} placeholder="Event name (for expenses)" className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
          <input required type="date" value={form.entryDate} onChange={(event) => setForm({ ...form, entryDate: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" aria-label="Entry date" />
          <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short note (optional)" className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
        </div>
        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        <button disabled={saving} type="submit" className="mt-5 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50">{saving ? 'Saving...' : 'Save entry'}</button>
      </form>}

      {!canManage && error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</p>}

      <section className="space-y-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Event spending</p><h2 className="mt-2 text-xl font-semibold">What each event has used</h2></div>
        {eventCards.length === 0 ? <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-6 text-sm text-slate-500">No event expenses recorded yet.</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{eventCards.map((event) => <article key={event.name} className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-5 shadow-lg shadow-black/10 backdrop-blur-md"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">Event expense</p><h3 className="mt-2 text-lg font-semibold text-white">{event.name}</h3><p className="mt-5 text-2xl font-semibold text-rose-300">{currency.format(event.spent)}</p><p className="mt-1 text-sm text-slate-400">{event.entries} {event.entries === 1 ? 'entry' : 'entries'}</p></article>)}</div>}
      </section>

      <section className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Ledger</p><h2 className="mt-2 text-xl font-semibold">Recent fund activity</h2></div><p className="text-sm text-slate-500">{entries.length} entries</p></div>
        <div className="mt-5 space-y-3">{loading ? <p className="text-sm text-slate-500">Loading fund activity...</p> : entries.length === 0 ? <p className="text-sm text-slate-500">No fund entries recorded yet.</p> : entries.map((entry) => <div key={entry.id} className="flex flex-col gap-3 rounded-lg border border-slate-700/60 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-white">{entry.title}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${entry.approval_status === 'approved' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-400/30 bg-amber-500/10 text-amber-300'}`}>{entry.approval_status === 'approved' ? 'Approved and locked' : 'Pending admin approval'}</span></div><p className="mt-1 text-xs text-slate-500">{entry.event_name || 'General society fund'} · {new Date(entry.entry_date).toLocaleDateString('en-IN')}</p>{entry.description && <p className="mt-2 text-sm text-slate-400">{entry.description}</p>}</div><div className="flex flex-wrap items-center justify-end gap-3"><span className={`font-semibold ${entry.entry_type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>{entry.entry_type === 'income' ? '+' : '-'}{currency.format(Number(entry.amount))}</span>{canApprove && entry.approval_status === 'pending' && (editingId === entry.id ? <><input type="number" min="0.01" step="0.01" value={editingAmount} onChange={(event) => setEditingAmount(event.target.value)} className="w-28 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-white outline-none focus:border-sky-400" aria-label="Edit amount" /><button type="button" onClick={() => void saveAmount(entry.id)} className="text-xs font-medium text-sky-300 hover:text-sky-200">Save amount</button><button type="button" onClick={() => setEditingId(null)} className="text-xs font-medium text-slate-500 hover:text-white">Cancel</button></> : <button type="button" onClick={() => { setEditingId(entry.id); setEditingAmount(String(entry.amount)); }} className="text-xs font-medium text-sky-300 hover:text-sky-200">Edit amount</button>)}{canApprove && entry.approval_status === 'pending' && <button type="button" onClick={() => void approveEntry(entry.id)} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-300">Approve</button>}{canManage && entry.approval_status === 'pending' && <button type="button" onClick={() => void removeEntry(entry.id)} className="text-xs font-medium text-slate-500 hover:text-rose-300">Remove</button>}</div></div>)}</div>
      </section>
    </div>
  );
}
