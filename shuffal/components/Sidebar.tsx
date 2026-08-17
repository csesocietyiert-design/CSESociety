'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: any;
}

export default function Sidebar({ open, setOpen, user }: SidebarProps) {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
    { label: 'Members', href: '/dashboard/members', icon: 'users', show: true },
    { label: 'Events', href: '/dashboard/events', icon: 'calendar', show: true },
    { label: 'Notifications', href: '/dashboard/notifications', icon: 'bell', show: true },
    { label: 'Approvals', href: '/dashboard/approvals', icon: 'award', show: user.role === 'admin' || user.role === 'faculty' },
    { label: 'Certificates', href: '/dashboard/certificates', icon: 'bar-chart', show: user.role === 'member' },
    { label: 'Reports', href: '/dashboard/reports', icon: 'bar-chart', show: user.role === 'admin' || user.role === 'executive' },
    { label: 'Profile', href: '/dashboard/profile', icon: 'user', show: true },
  ];

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 backdrop-blur-md bg-slate-900/95 border-r border-slate-700/50 transition-transform duration-300 md:relative md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">CSE Society</h1>
            <p className="text-xs text-slate-400 mt-1">{user.name}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition text-slate-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems
            .filter((item) => item.show !== false)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 transform ${
                  hoveredItem === item.href
                    ? 'bg-blue-600/30 text-white scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="mr-3 text-lg">{getIcon(item.icon)}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4 space-y-3">
          <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-xs text-slate-400">Current Role</p>
            <p className="text-sm font-medium text-white capitalize mt-1">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition text-sm font-medium border border-red-500/20 hover:border-red-500/40"
          >
            Logout
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setOpen(false)}
        ></div>
      )}
    </>
  );
}

function getIcon(name: string) {
  const icons: Record<string, JSX.Element> = {
    grid: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>,
    users: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
    calendar: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>,
    bell: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>,
    award: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v6h2.97c.5 1.25 1.42 2.31 2.58 3v2.3c.39.57.84 1.12 1.35 1.63.51.51.97 1.06 1.35 1.63h5.6c.38-.57.84-1.12 1.35-1.63.51-.51.97-1.06 1.35-1.63v-2.3c1.16-.69 2.08-1.75 2.58-3H21V7c0-1.1-.9-2-2-2zm-8 10.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
    'bar-chart': <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>,
    user: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  };
  return icons[name] || <span className="w-5 h-5">•</span>;
}
