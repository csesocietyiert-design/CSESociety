'use client';

import React from 'react';
import { useAuthStore } from '@/lib/store';
import DashboardCard from './DashboardCard';

export default function MemberDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-600 mt-2">CSE Society Member Portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">CSE Society ID</p>
          <p className="text-3xl font-bold text-blue-900 mt-2 font-mono">{user?.cseId || 'Loading...'}</p>
          <p className="text-xs text-blue-500 mt-2">Format: YY+Y+Session+Sequential</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Membership Status</p>
          <p className="text-3xl font-bold text-green-900 mt-2">Active</p>
          <p className="text-xs text-green-500 mt-2">Current Year: {user?.year}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Events Joined" value="5" icon="📅" color="blue" />
        <DashboardCard title="Attendance" value="92%" icon="✓" color="green" />
        <DashboardCard title="Certificates" value="2" icon="🏆" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Events</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Tech Workshop</p>
              <p className="text-sm text-gray-600">Registered</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Monthly Meetup</p>
              <p className="text-sm text-gray-600">Attended</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Coding Competition</p>
              <p className="text-sm text-gray-600">Upcoming</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Announcements</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">New Event Schedule</p>
              <p className="text-sm text-gray-600">Updated today</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Certificates Available</p>
              <p className="text-sm text-gray-600">Download your certificates</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Important Notice</p>
              <p className="text-sm text-gray-600">2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Events Joined" value="5" icon="📅" color="blue" />
        <DashboardCard title="Attendance" value="92%" icon="✓" color="green" />
        <DashboardCard title="Certificates" value="2" icon="🏆" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Events</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Tech Workshop</p>
              <p className="text-sm text-gray-600">Registered</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Monthly Meetup</p>
              <p className="text-sm text-gray-600">Attended</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Coding Competition</p>
              <p className="text-sm text-gray-600">Upcoming</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Announcements</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">New Event Schedule</p>
              <p className="text-sm text-gray-600">Updated today</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Certificates Available</p>
              <p className="text-sm text-gray-600">Download your certificates</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Important Notice</p>
              <p className="text-sm text-gray-600">2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
