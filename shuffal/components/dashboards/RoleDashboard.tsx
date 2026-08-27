'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useEvents, useRealtimeNotifications, useUsers } from '@/lib/hooks';

type RoleDashboardUser = {
  id: string;
  name: string;
  role: string;
  year?: number;
};

type DashboardConfig = {
  title: string;
  description: string;
  eyebrow: string;
  heroClass: string;
  accentClass: string;
  features: Array<{ label: string; href: string; detail: string; tone: string }>;
};

const configs: Record<'executive' | 'secretary' | 'year_representative' | 'treasurer', DashboardConfig> = {
  executive: {
    title: 'Executive Dashboard',
    description: 'Coordinate society leadership, events, and member engagement from one workspace.',
    eyebrow: 'CSE Society Executive Portal',
    heroClass: 'from-blue-600/25 via-slate-900/75 to-cyan-700/15',
    accentClass: 'text-cyan-300',
    features: [
      { label: 'Members', href: '/dashboard/members', detail: 'View and support society members', tone: 'sky' },
      { label: 'Events', href: '/dashboard/events', detail: 'Coordinate upcoming activities', tone: 'amber' },
      { label: 'Registrations', href: '/dashboard/events', detail: 'Review event participation', tone: 'teal' },
      { label: 'Attendance', href: '/dashboard/events', detail: 'Track society engagement', tone: 'emerald' },
      { label: 'Announcements', href: '/dashboard/notifications', detail: 'Share leadership updates', tone: 'rose' },
      { label: 'Reports', href: '/dashboard/reports', detail: 'Review society summaries', tone: 'purple' },
      { label: 'Certificates', href: '/dashboard/certificates', detail: 'View society certificates', tone: 'sky' },
      { label: 'Resources', href: '/dashboard/resources', detail: 'Access society resources', tone: 'teal' },
      { label: 'Activities', href: '/dashboard/notifications', detail: 'Keep committee work moving', tone: 'blue' },
      { label: 'Profile', href: '/dashboard/profile', detail: 'Maintain your account', tone: 'slate' },
    ],
  },
  secretary: {
    title: 'Secretary Dashboard',
    description: 'Coordinate technical and cultural society activities from one workspace.',
    eyebrow: 'CSE Society Secretary Portal',
    heroClass: 'from-amber-600/25 via-slate-900/75 to-rose-700/15',
    accentClass: 'text-amber-300',
    features: [
      { label: 'Events', href: '/dashboard/events', detail: 'Plan and coordinate society events', tone: 'amber' },
      { label: 'Registrations', href: '/dashboard/events', detail: 'Review participation interest', tone: 'sky' },
      { label: 'Attendance', href: '/dashboard/events', detail: 'Track event participation', tone: 'teal' },
      { label: 'Activities', href: '/dashboard/notifications', detail: 'Keep society work moving', tone: 'rose' },
      { label: 'Announcements', href: '/dashboard/notifications', detail: 'Share updates with members', tone: 'purple' },
      { label: 'Certificates', href: '/dashboard/certificates', detail: 'View society certificates', tone: 'sky' },
      { label: 'Resources', href: '/dashboard/resources', detail: 'Access society resources', tone: 'teal' },
      { label: 'Reports', href: '/dashboard/reports', detail: 'Review operational summaries', tone: 'emerald' },
      { label: 'Profile', href: '/dashboard/profile', detail: 'Maintain your account', tone: 'slate' },
    ],
  },
  year_representative: {
    title: 'Year Representative Dashboard',
    description: 'Represent your year, share updates, and stay connected with your students.',
    eyebrow: 'CSE Society Representative Portal',
    heroClass: 'from-sky-600/25 via-slate-900/75 to-emerald-700/15',
    accentClass: 'text-sky-300',
    features: [
      { label: 'My Year', href: '/dashboard/members', detail: `View Year ${'{year}'} student details`, tone: 'teal' },
      { label: 'Events', href: '/dashboard/events', detail: 'Follow upcoming activities', tone: 'amber' },
      { label: 'Attendance', href: '/dashboard/events', detail: 'Track participation', tone: 'emerald' },
      { label: 'Announcements', href: '/dashboard/notifications', detail: 'Read society updates', tone: 'rose' },
      { label: 'Feedback', href: '/dashboard/notifications', detail: 'Bring student input forward', tone: 'purple' },
      { label: 'Reports', href: '/dashboard/reports', detail: 'Review available summaries', tone: 'blue' },
      { label: 'Certificates', href: '/dashboard/certificates', detail: 'View society certificates', tone: 'sky' },
      { label: 'Resources', href: '/dashboard/resources', detail: 'Access society resources', tone: 'teal' },
      { label: 'Profile', href: '/dashboard/profile', detail: 'Maintain your account', tone: 'slate' },
    ],
  },
  treasurer: {
    title: 'Treasurer Dashboard',
    description: 'Keep society finances clear, current, and accountable.',
    eyebrow: 'CSE Society Finance Portal',
    heroClass: 'from-emerald-600/25 via-slate-900/75 to-amber-700/15',
    accentClass: 'text-emerald-300',
    features: [
      { label: 'Funds', href: '/dashboard/finance', detail: 'Share the live society balance', tone: 'emerald' },
      { label: 'Event Expenses', href: '/dashboard/finance', detail: 'Track spending by event', tone: 'rose' },
      { label: 'Transactions', href: '/dashboard/finance', detail: 'Review the shared fund ledger', tone: 'sky' },
      { label: 'Budget', href: '/dashboard/finance', detail: 'Monitor income and spending', tone: 'amber' },
      { label: 'Reports', href: '/dashboard/finance', detail: 'View financial summaries', tone: 'teal' },
      { label: 'Certificates', href: '/dashboard/certificates', detail: 'View society certificates', tone: 'sky' },
      { label: 'Resources', href: '/dashboard/resources', detail: 'Access society resources', tone: 'teal' },
      { label: 'Profile', href: '/dashboard/profile', detail: 'Maintain your account', tone: 'slate' },
    ],
  },
};

function toneClasses(tone: string) {
  const tones: Record<string, string> = {
    amber: 'border-amber-500/30 bg-gradient-to-br from-amber-600/20 to-amber-700/10 hover:border-amber-400/60',
    blue: 'border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-blue-700/10 hover:border-blue-400/60',
    emerald: 'border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 to-emerald-700/10 hover:border-emerald-400/60',
    purple: 'border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-purple-700/10 hover:border-purple-400/60',
    rose: 'border-rose-500/30 bg-gradient-to-br from-rose-600/20 to-rose-700/10 hover:border-rose-400/60',
    sky: 'border-sky-500/30 bg-gradient-to-br from-sky-600/20 to-sky-700/10 hover:border-sky-400/60',
    teal: 'border-teal-500/30 bg-gradient-to-br from-teal-600/20 to-teal-700/10 hover:border-teal-400/60',
    slate: 'border-slate-600/50 bg-gradient-to-br from-slate-700/30 to-slate-900/70 hover:border-slate-500',
  };
  return tones[tone] || tones.slate;
}

export default function RoleDashboard({ user, group }: { user: RoleDashboardUser; group: keyof typeof configs }) {
  const config = configs[group];
  const [currentTime] = useState(() => Date.now());
  const { events, loading: eventsLoading } = useEvents();
  const { users, loading: usersLoading } = useUsers();
  const { notifications, loading: notificationsLoading } = useRealtimeNotifications(user.id);
  const unreadNotifications = notifications.filter((notification) => !notification.is_read).length;
  const upcomingEvents = events.filter((event) => new Date(event.start_date).getTime() >= currentTime);
  const features = config.features.map((feature) => ({
    ...feature,
    detail: feature.detail.replace('{year}', String(user.year || 'your year')),
  }));
  const stats = [
    { label: 'Members', value: usersLoading ? '--' : String(users.length).padStart(2, '0'), tone: 'sky' },
    { label: 'Upcoming Events', value: eventsLoading ? '--' : String(upcomingEvents.length).padStart(2, '0'), tone: 'amber' },
    { label: 'Unread Updates', value: notificationsLoading ? '--' : String(unreadNotifications).padStart(2, '0'), tone: 'rose' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <section className={`relative overflow-hidden rounded-lg border border-slate-700/70 bg-gradient-to-br ${config.heroClass} px-6 py-7 shadow-2xl shadow-black/20 backdrop-blur-md sm:px-8`}>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(120deg,transparent,rgba(45,212,191,0.08))]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${config.accentClass}`}>{config.eyebrow}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{config.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{config.description}</p>
          </div>
          <div className="border-t border-white/10 pt-4 text-right sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Signed in as</p>
            <p className="mt-1 font-semibold text-white">{user.name}</p>
            <p className={`mt-1 text-sm capitalize ${config.accentClass}`}>{user.role.replaceAll('_', ' ')}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => <div key={stat.label} className={`rounded-lg border p-5 shadow-lg shadow-black/10 backdrop-blur-md ${toneClasses(stat.tone)}`}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-white">{stat.value}</p></div>)}
      </section>

      <section>
        <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Workspace</p><h2 className="mt-2 text-xl font-semibold text-white">Your available features</h2></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => <Link key={`${feature.label}-${index}`} href={feature.href} className={`group rounded-lg border p-5 shadow-lg shadow-black/10 backdrop-blur-md transition hover:-translate-y-0.5 ${toneClasses(feature.tone)}`}><div className="mb-6 flex items-center justify-between"><h3 className="text-lg font-semibold text-white">{feature.label}</h3><span className="h-2 w-2 rounded-full bg-teal-300" /></div><p className="text-sm leading-6 text-slate-400 group-hover:text-slate-200">{feature.detail}</p><p className="mt-5 text-sm font-medium text-teal-300">Open workspace -&gt;</p></Link>)}
        </div>
      </section>
    </div>
  );
}