'use client';

import React from 'react';
import { useAuthStore, type Role } from '@/store/authStore';
import DashboardCard from './DashboardCard';

interface AdminDashboardProps {
  role: Role;
}

export default function AdminDashboard({ role }: AdminDashboardProps) {
  const user = useAuthStore((state) => state.user);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Members', href: '/dashboard/members' },
    { label: 'Executive Committee', href: '/dashboard/executive' },
    { label: 'Events', href: '/dashboard/events' },
    { label: 'Registrations', href: '/dashboard/registrations' },
    { label: 'Attendance', href: '/dashboard/attendance' },
    { label: 'Announcements', href: '/dashboard/announcements' },
    { label: 'Certificates', href: '/dashboard/certificates' },
    { label: 'Reports', href: '/dashboard/reports' },
    { label: 'Society Activities', href: '/dashboard/activities' },
    { label: 'Profile', href: '/dashboard/profile' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          {role === 'admin' ? 'Admin' : 'Faculty In-charge'} Control Panel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Total Members" value="342" icon="👥" color="blue" />
        <DashboardCard title="Active Events" value="8" icon="📅" color="green" />
        <DashboardCard title="Pending Approvals" value="12" icon="⏳" color="yellow" />
        <DashboardCard title="Recent Activities" value="34" icon="📊" color="purple" />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {navItems.slice(1, 7).map((item) => (
            <button
              key={item.href}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <p className="font-semibold text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-600 mt-1">Manage {item.label.toLowerCase()}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
