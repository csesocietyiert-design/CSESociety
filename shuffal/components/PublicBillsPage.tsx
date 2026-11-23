'use client';

import { FormEvent, useEffect, useState } from 'react';

type BillRecord = {
  id: string;
  title: string;
  amount: number;
  event_name?: string | null;
  entry_date: string;
  details?: string | null;
  bill_link: string;
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export default function PublicBillsPage() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState('');

  const loadBills = async () => {
    const response = await fetch('/api/bills', { cache: 'no-store' });
    const payload = await response.json();
    if (response.status === 403) {
      setForbidden(true);
      setUnlocked(false);
      return;
    }
    if (response.status === 401) {
      setUnlocked(false);
      return;
    }
    if (!response.ok) throw new Error(payload.error || 'Could not load bills.');
    setBills(payload.bills || []);
    setUnlocked(true);
    setForbidden(false);
  };

  useEffect(() => {
    let active = true;
    fetch('/api/bills', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!active) return;
        if (response.status === 403) {
          setForbidden(true);
          return;
        }
        if (response.status === 401) return;
        if (!response.ok) throw new Error(payload.error || 'Could not load bills.');
        setBills(payload.bills || []);
        setUnlocked(true);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load bills.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/bills/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 403) setForbidden(true);
        throw new Error(payload.error || 'Could not verify access.');
      }
      await loadBills();
      setPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not verify access.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p role="status" className="py-8 text-center text-slate-400">Checking bills access...</p>;
  }

  if (forbidden) {
    return (
      <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-950/30 p-6 text-center text-rose-200">
        Society members cannot access this bills page.
      </p>
    );
  }

  if (!unlocked) {
    return (
      <section className="mx-auto max-w-lg rounded-2xl border border-[#36546b] bg-[#071b2b] p-6 shadow-xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Protected documents</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Verify to view bills</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Enter the access password to view approved society expense bills. Member accounts are not permitted.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Access password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-[#36546b] bg-[#0b2740] px-3 text-white outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-300/20"
            />
          </label>
          {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 w-full rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? 'Verifying...' : 'Verify and view bills'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section aria-labelledby="bills-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#25445b] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Verified access</p>
          <h2 id="bills-heading" className="mt-1 text-2xl font-bold text-white">Approved Expense Bills</h2>
        </div>
        <span className="text-sm text-slate-400">{bills.length} bills</span>
      </div>

      {error && <p role="alert" className="mt-5 text-rose-200">{error}</p>}
      {bills.length === 0 ? (
        <p className="py-10 text-center text-slate-300">There are no approved bills published yet.</p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#25445b]">
          <ul className="divide-y divide-[#25445b]">
            {bills.map((bill) => (
              <li key={bill.id} className="flex flex-col gap-4 bg-[#071b2b]/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white [overflow-wrap:anywhere]">{bill.title}</h3>
                  {bill.event_name && <p className="mt-1 text-sm text-slate-300">Event: {bill.event_name}</p>}
                  {bill.details && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-400">{bill.details}</p>}
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(`${bill.entry_date}T00:00:00`).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {' · '}
                    {currency.format(Number(bill.amount))}
                  </p>
                </div>
                <a
                  href={bill.bill_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-[#52738c] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-transparent hover:bg-sky-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                >
                  View bill
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
