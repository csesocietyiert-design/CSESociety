'use client';

import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

export default function DashboardCard({ title, value, icon, color }: DashboardCardProps) {
  const colorClass = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  }[color];

  return (
    <div className={`${colorClass} border rounded-xl p-6 flex items-center gap-4`}>
      <div className="text-4xl">{icon}</div>
      <div>
        <p className="text-sm font-medium opacity-75">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
