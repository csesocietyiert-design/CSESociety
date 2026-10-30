'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EventRegistrationsPanel from '@/components/EventRegistrationsPanel';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useAuthStore } from '@/lib/store';

const managerRoles = new Set([
  'admin',
  'general_secretary',
  'technical_secretary',
  'cultural_secretary',
  'secretary',
]);

export default function EventRegistrationsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const canManage = Boolean(user && managerRoles.has(user.role.toLowerCase()));

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.replace('/login');
    else if (hasHydrated && isAuthenticated && !canManage) router.replace('/dashboard');
  }, [canManage, hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated || !user || !canManage) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading event registrations…</div>;
  }

  return <LayoutWrapper user={user}><EventRegistrationsPanel /></LayoutWrapper>;
}
