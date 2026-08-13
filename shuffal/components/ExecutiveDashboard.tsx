'use client';

import React from 'react';
import DashboardCard from './DashboardCard';

export default function ExecutiveDashboard() {
  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Members', href: '/dashboard/members' },
    { label: 'Events', href: '/dashboard/events' },
    { label: 'Registrations', href: '/dashboard/registrations' },
    { label: 'Attendance', href: '/dashboard/attendance' },
    { label: 'Announcements', href: '/dashboard/announcements' },
    { label: 'Activities', href: '/dashboard/activities' },
    { label: 'Reports', href: '/dashboard/reports' },
    { label: 'Profile', href: '/dashboard/profile' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Executive Committee Control Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Total Members" value="342" icon="👥" color="blue" />
        <DashboardCard title="Upcoming Events" value="5" icon="📅" color="green" />
        <DashboardCard title="Event Registrations" value="127" icon="📝" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Tech Workshop</p>
              <p className="text-sm text-gray-600">Next week</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Monthly Meetup</p>
              <p className="text-sm text-gray-600">In 3 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Announcements</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">New Guidelines</p>
              <p className="text-sm text-gray-600">Posted 2 days ago</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Event Schedule Updated</p>
              <p className="text-sm text-gray-600">Posted today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
