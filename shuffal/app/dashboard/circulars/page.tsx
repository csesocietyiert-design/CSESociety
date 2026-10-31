'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CircularManager from '@/components/CircularManager';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useAuthStore } from '@/lib/store';

export default function DashboardCircularsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user) router.replace('/login');
    else if (user.role !== 'admin') router.replace('/dashboard');
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated || !isAuthenticated || user?.role !== 'admin') {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Checking administrator access...</div>;
  }

  return <LayoutWrapper user={user}><CircularManager /></LayoutWrapper>;
}
