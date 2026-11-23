'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import FinancePanel from '@/components/FinancePanel';
import { canManageFinanceEntries } from '@/lib/finance-access';
import { useAuthStore } from '@/lib/store';

export default function FinancePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const canView = !!user;
  const [password, setPassword] = useState('');
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user || !canView) router.push('/dashboard');
  }, [hasHydrated, isAuthenticated, user, canView, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/funds/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not verify funds access.');
      setPassword('');
      setVerified(true);
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Could not verify funds access.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasHydrated || !isAuthenticated || !user || !canView) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading funds...</div>;
  }

  if (!verified) {
    return (
      <LayoutWrapper user={user}>
        <main className="mx-auto flex min-h-full max-w-lg items-center justify-center">
          <section className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Protected funds</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Verify to view funds</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Enter the access password to view the society fund ledger. You will be asked to verify each time you open this page.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-200">
                Access password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
                />
              </label>
              {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="min-h-11 w-full rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? 'Verifying...' : 'Verify and view funds'}
              </button>
            </form>
          </section>
        </main>
      </LayoutWrapper>
    );
  }

  const role = user.role.toLowerCase();
  return <LayoutWrapper user={user}><FinancePanel canManage={canManageFinanceEntries(role)} canApprove={role === 'admin'} /></LayoutWrapper>;
}
