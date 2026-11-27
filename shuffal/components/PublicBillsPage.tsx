'use client';

import { useEffect, useState } from 'react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/bills', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!active) return;
        if (!response.ok) throw new Error(payload.error || 'Could not load bills.');
        setBills(payload.bills || []);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load bills.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <p role="status" className="py-8 text-center text-slate-400">Loading approved bills...</p>;
  }

  return (
    <section aria-labelledby="bills-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#25445b] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Public records</p>
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
