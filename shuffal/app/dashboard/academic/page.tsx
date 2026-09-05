'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useAuthStore } from '@/lib/store';

export default function AcademicPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !user)) router.push('/login');
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated || !isAuthenticated || !user) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <LayoutWrapper user={user}>
      <main className="-m-6 h-[calc(100vh-81px)] min-h-[600px] overflow-hidden bg-slate-950">
        <link rel="preconnect" href="https://study.aktubrand.online" />
        <iframe
          src="https://study.aktubrand.online/"
          title="Academic content"
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </main>
    </LayoutWrapper>
  );
}
