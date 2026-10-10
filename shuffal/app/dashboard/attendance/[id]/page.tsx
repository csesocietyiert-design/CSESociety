'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import LayoutWrapper from '@/components/LayoutWrapper';
import AttendanceSessionPanel from '@/components/AttendanceSessionPanel';

export default function AttendanceSessionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !user)) router.push('/login');
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated || !isAuthenticated || !user) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Restoring your session...</div>;
  }

  return <LayoutWrapper user={user}><AttendanceSessionPanel sessionId={id} /></LayoutWrapper>;
}
