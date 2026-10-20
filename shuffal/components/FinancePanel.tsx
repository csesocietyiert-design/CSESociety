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
  details?: string | null;
  bill_link?: string | null;
  approval_status: 'pending' | 'approved';
};

type FinanceForm = {
  entryType: 'income' | 'expense';
  title: string;
  amount: string;
  eventName: string;
  entryDate: string;
  description: string;
  details: string;
  billLink: string;
};

const initialForm: FinanceForm = {
  entryType: 'expense',
  title: '',
  amount: '',
  eventName: '',
  entryDate: new Date().toISOString().split('T')[0],
  description: '',
  details: '',
  billLink: '',
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
    entries.filter((entry) => entry.approval_status === 'approved' && entry.entry_type === 'expense' && entry.event_name).forEach((entry) => {
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
          <button type="button" key={String(label)} onClick={label === 'Total amount' ? handleTotalAmountClick : undefined} className={`w-full rounded-lg border p-5 text-left shadow-lg shadow-black/10 backdrop-blur-md ${tone === 'emerald' ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 to-slate-900/70' : tone === 'sky' ? 'border-sky-500/30 bg-gradient-to-br from-sky-600/20 to-slate-900/70' : 'border-rose-500/30 bg-gradient-to-br from-rose-600/20 to-slate-900/70'}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{loading ? '--' : currency.format(Number(value))}</p>
          </button>
        ))}
      </section>

      {canApprove && showTotalEditor && <div onClick={() => { setShowTotalEditor(false); totalAmountClicks.current = []; }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <form onSubmit={saveTotalAmount} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-lg border border-sky-500/30 bg-slate-900 p-6 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Admin controls</p><h2 className="mt-2 text-xl font-semibold">Set total fund amount</h2><p className="mt-1 text-sm text-slate-400">This value is the starting balance for the society fund ledger.</p>
          <div className="mt-5 flex gap-2"><input required autoFocus min="0" step="0.01" type="number" value={totalAmountInput} onChange={(event) => setTotalAmountInput(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-sky-400" placeholder="Enter total amount" /><button type="submit" className="rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">Save</button></div>
        </form>
      </div>}

      {canManage && <form onSubmit={handleSubmit} className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-600/15 to-slate-900/70 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Finance controls</p><h2 className="mt-2 text-xl font-semibold">Add fund entry</h2></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <select required value={form.entryType} onChange={(event) => setForm({ ...form, entryType: event.target.value as FinanceForm['entryType'] })} className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-white outline-none focus:border-emerald-400" aria-label="Entry type">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Entry title" className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-emerald-400" />
          <input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Amount (INR)" className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-emerald-400" />
          <input value={form.eventName} onChange={(event) => setForm({ ...form, eventName: event.target.value })} placeholder="Event name (for expenses)" className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-emerald-400" />
          <input required type="date" value={form.entryDate} onChange={(event) => setForm({ ...form, entryDate: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
          <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short note (optional)" className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-emerald-400" />
          <textarea value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="About / information" rows={2} className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-emerald-400 sm:col-span-2 lg:col-span-2" />
          <input type="url" value={form.billLink} onChange={(event) => setForm({ ...form, billLink: event.target.value })} placeholder="Google Drive bill link (optional)" className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-emerald-400" />
        </div>
        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        <button disabled={saving} type="submit" className="mt-5 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50">{saving ? 'Saving...' : 'Save fund entry'}</button>
      </form>}

      {!canManage && error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</p>}

      <section className="space-y-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Event spending</p><h2 className="mt-2 text-xl font-semibold">What each event has used</h2></div>
        {eventCards.length === 0 ? <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-6 text-sm text-slate-500">No event expenses recorded yet.</div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{eventCards.map((card) => (<div key={card.name} className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-4"><div className="flex items-center justify-between gap-4"><h3 className="text-base font-semibold text-white">{card.name}</h3><span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{card.entries} entries</span></div><p className="mt-3 text-2xl font-semibold text-rose-300">{currency.format(card.spent)}</p></div>))}</div>}
      </section>

      <section className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Ledger</p><h2 className="mt-2 text-xl font-semibold">Recent fund activity</h2></div>{canManage && <div className="text-xs text-slate-400">Admin/Treasurer access</div>}</div>
        <div className="mt-5 space-y-3">{loading ? <p className="text-sm text-slate-500">Loading fund activity...</p> : entries.length === 0 ? <p className="text-sm text-slate-500">No fund entries yet.</p> : entries.map((entry) => <div key={entry.id} className="rounded-lg border border-slate-700/50 bg-slate-900/60 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${entry.entry_type === 'income' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>{entry.entry_type}</span><span className="text-xs text-slate-400">{new Date(entry.entry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div><h3 className="mt-2 text-lg font-semibold text-white">{entry.title}</h3>{entry.event_name && <p className="mt-1 text-sm text-slate-400">Event: {entry.event_name}</p>}{entry.description && <p className="mt-1 text-sm text-slate-400">{entry.description}</p>}</div><div className="text-left sm:text-right"><p className={`text-xl font-semibold ${entry.entry_type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>{entry.entry_type === 'income' ? '+' : '-'}{currency.format(Number(entry.amount))}</p>{entry.approval_status === 'pending' ? <p className="mt-1 text-xs uppercase tracking-[0.12em] text-amber-300">Pending</p> : <p className="mt-1 text-xs uppercase tracking-[0.12em] text-emerald-300">Approved</p>}</div></div>{canApprove && entry.approval_status === 'pending' && <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => approveEntry(entry.id)} className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400">Approve</button>{editingId !== entry.id ? <button type="button" onClick={() => { setEditingId(entry.id); setEditingAmount(String(entry.amount)); }} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:border-slate-500">Edit amount</button> : <div className="flex items-center gap-2"><input aria-label={`Edit amount for ${entry.title}`} value={editingAmount} onChange={(event) => setEditingAmount(event.target.value)} className="w-32 rounded-md border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white outline-none focus:border-emerald-400" type="number" min="0.01" step="0.01" /><button type="button" onClick={() => saveAmount(entry.id)} className="rounded-md bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400">Save</button><button type="button" onClick={() => { setEditingId(null); setEditingAmount(''); }} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500">Cancel</button></div>} </div>}{canManage && entry.approval_status === 'pending' && <div className="mt-4"><button type="button" onClick={() => removeEntry(entry.id)} className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:border-rose-500/60">Remove</button></div>}</div>)}</div>
      </section>
    </div>
  );
}

