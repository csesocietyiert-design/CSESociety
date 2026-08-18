'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import LayoutWrapper from '@/components/LayoutWrapper';
import MemberDashboard from '@/components/dashboards/MemberDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import ExecutiveDashboard from '@/components/dashboards/ExecutiveDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Restoring your session...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Redirecting to login...</p>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (user.role === 'admin' || user.role === 'faculty') {
      return <AdminDashboard user={user} />;
    }
    if (user.role === 'executive') {
      return <ExecutiveDashboard user={user} />;
    }
    return <MemberDashboard user={user} />;
  };

  return (
    <LayoutWrapper user={user}>
      {renderDashboard()}
    </LayoutWrapper>
  );
}
