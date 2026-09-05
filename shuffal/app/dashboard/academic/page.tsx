'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useAuthStore } from '@/lib/store';

export default function AcademicPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const verifyPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password === '1234') {
      setError('');
      window.location.assign('https://study.aktubrand.online/');
      return;
    }
    setError('Incorrect password.');
  };

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !user)) router.push('/login');
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated || !isAuthenticated || !user) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <LayoutWrapper user={user}>
      <main className="-m-6 flex min-h-[calc(100vh-81px)] items-center justify-center bg-slate-950 px-6">
        <form onSubmit={verifyPassword} className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Academic portal</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Enter password</h1>
          <label className="mt-6 block text-sm text-slate-300">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-teal-400"
            />
          </label>
          {error && <p className="mt-3 text-sm text-rose-300" role="alert">{error}</p>}
          <button type="submit" className="mt-5 w-full rounded-lg bg-teal-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-teal-400">Verify</button>
        </form>
      </main>
    </LayoutWrapper>
  );
}
