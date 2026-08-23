'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import ResourcesPanel from '@/components/ResourcesPanel';
import { useAuthStore } from '@/lib/store';

export default function ResourcesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !user)) router.push('/login');
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated || !isAuthenticated || !user) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading resources...</div>;
  return <LayoutWrapper user={user}><ResourcesPanel /></LayoutWrapper>;
}
