'use client';

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import PendingApprovalsPanel from '@/components/PendingApprovalsPanel';

export default function PendingApprovalsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.push('/login');
    }

    if (user?.role !== 'admin' && user?.role !== 'faculty') {
      router.push('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Restoring your session...</div>;
  }

  if (!isAuthenticated || !user || (user?.role !== 'admin' && user?.role !== 'faculty')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Redirecting...</p>
      </div>
    );
  }

  return (
    <LayoutWrapper user={user}>
      <PendingApprovalsPanel user={user} />
    </LayoutWrapper>
  );
}
