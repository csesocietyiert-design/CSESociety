'use client';

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import NotificationsPanel from '@/components/NotificationsPanel';

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Redirecting...</p>
      </div>
    );
  }

  return (
    <LayoutWrapper user={user}>
      <NotificationsPanel user={user} />
    </LayoutWrapper>
  );
}
