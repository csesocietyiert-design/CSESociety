'use client';

import React from 'react';
import DashboardCard from './DashboardCard';

export default function SecretaryDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Secretary Control Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Managed Events" value="12" icon="📅" color="blue" />
        <DashboardCard title="Resources" value="48" icon="📚" color="green" />
        <DashboardCard title="Registrations" value="156" icon="📋" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Events Management</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Workshop Series</p>
              <p className="text-sm text-gray-600">3 events scheduled</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Cultural Program</p>
              <p className="text-sm text-gray-600">Planning phase</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resources</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Study Materials</p>
              <p className="text-sm text-gray-600">24 files available</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-900">Templates</p>
              <p className="text-sm text-gray-600">8 templates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
