'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import DashboardCard from './DashboardCard';

export default function YearRepDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Year Representative - Year {user?.year}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Year Students" value="89" icon="👨‍🎓" color="blue" />
        <DashboardCard title="Upcoming Events" value="4" icon="📅" color="green" />
        <DashboardCard title="Attendance Rate" value="87%" icon="📊" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Year Events</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Year Orientation</p>
              <p className="text-sm text-gray-600">Next week</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Study Group</p>
              <p className="text-sm text-gray-600">Weekly meetup</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Announcements</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Exam Schedule</p>
              <p className="text-sm text-gray-600">Posted today</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Assignment Deadline</p>
              <p className="text-sm text-gray-600">Extended to next week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
