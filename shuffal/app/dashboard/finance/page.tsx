'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import FinancePanel from '@/components/FinancePanel';
import { useAuthStore } from '@/lib/store';

export default function FinancePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const canView = !!user;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user || !canView) router.push('/dashboard');
  }, [hasHydrated, isAuthenticated, user, canView, router]);

  if (!hasHydrated || !isAuthenticated || !user || !canView) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading funds...</div>;
  }

  const role = user.role.toLowerCase();
  return <LayoutWrapper user={user}><FinancePanel canManage={role === 'treasurer'} canApprove={role === 'admin'} /></LayoutWrapper>;
}
