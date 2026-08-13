'use client';

import React from 'react';
import DashboardCard from './DashboardCard';

export default function TreasurerDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Financial Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Total Budget" value="50,000" icon="💰" color="blue" />
        <DashboardCard title="Income" value="12,500" icon="💵" color="green" />
        <DashboardCard title="Expenses" value="8,300" icon="💸" color="yellow" />
        <DashboardCard title="Balance" value="4,200" icon="📈" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg flex justify-between">
              <span className="font-semibold text-gray-900">Event Sponsorship</span>
              <span className="text-green-600 font-semibold">+2,000</span>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg flex justify-between">
              <span className="font-semibold text-gray-900">Materials</span>
              <span className="text-red-600 font-semibold">-500</span>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg flex justify-between">
              <span className="font-semibold text-gray-900">Refreshments</span>
              <span className="text-red-600 font-semibold">-800</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Income Sources</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Membership Fees</p>
              <p className="font-semibold text-gray-900">8,500</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Event Registrations</p>
              <p className="font-semibold text-gray-900">4,000</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Expenses</h2>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Event Costs</p>
              <p className="font-semibold text-gray-900">5,200</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Materials & Supplies</p>
              <p className="font-semibold text-gray-900">3,100</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
