'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAnnouncements, useCertificates, useEvents, useNotifications } from '@/lib/hooks';

export default function MemberDashboard({ user }: any) {
  const [imageError, setImageError] = useState(false);
  const { events, loading: eventsLoading } = useEvents();
  const { certificates, loading: certificatesLoading } = useCertificates(user.id);
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { notifications, loading: notificationsLoading } = useNotifications(user.id);
  const initials = user.name
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const upcomingEvents = events
    .filter((event) => new Date(event.start_date).getTime() >= Date.now())
    .sort((first, second) => new Date(first.start_date).getTime() - new Date(second.start_date).getTime())
    .slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 3);
  const stats = [
    { label: 'Events available', value: eventsLoading ? '—' : String(events.length).padStart(2, '0'), detail: 'Society programme', tone: 'teal' },
    { label: 'Certificates earned', value: certificatesLoading ? '—' : String(certificates.length).padStart(2, '0'), detail: 'Available in your account', tone: 'gold' },
    { label: 'Academic year', value: `Year ${user.year}`, detail: 'Current enrollment', tone: 'blue' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-xl border border-slate-700/70 bg-[linear-gradient(120deg,#102b3d_0%,#122231_58%,#183238_100%)] px-6 py-7 shadow-2xl shadow-black/20 sm:px-8">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(120deg,transparent,rgba(45,212,191,0.08))]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">CSE Society Member Portal</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Good morning, {user.name.split(' ')[0]}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Stay connected with society activities, academic opportunities, and your membership record.</p>
          </div>
          <div className="flex items-center gap-4 border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-teal-300/60 bg-teal-400/15 text-lg font-semibold text-teal-100">
              {user.profile_image_url && !imageError ? (
                <Image src={user.profile_image_url} alt="Member profile" fill className="object-cover" onError={() => setImageError(true)} />
              ) : initials}
            </div>
            <div>
              <p className="font-medium text-white">{user.name}</p>
              <p className="mt-1 text-sm text-slate-300">{user.email}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-teal-300">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300" /> Active member
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-slate-700/70 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p>
              <span className={`h-2 w-2 rounded-full ${stat.tone === 'gold' ? 'bg-amber-300' : stat.tone === 'blue' ? 'bg-sky-300' : 'bg-teal-300'}`} />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-500">{stat.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="border border-slate-700/70 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Membership record</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Your society profile</h2>
            </div>
            <Link href="/dashboard/profile" className="text-sm font-medium text-teal-300 transition hover:text-teal-200">View profile</Link>
          </div>
          <div className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">CSE Society ID</p>
              <p className="mt-2 font-mono text-lg font-medium text-white">{user.cseId}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Department</p>
              <p className="mt-2 text-lg font-medium text-white">{user.department || 'Computer Science & Engineering'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Membership status</p>
              <p className="mt-2 inline-flex items-center gap-2 text-lg font-medium text-teal-300"><span className="h-2 w-2 rounded-full bg-teal-300" /> {user.is_verified === false ? 'Pending review' : 'Verified'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Access level</p>
              <p className="mt-2 text-lg font-medium capitalize text-white">{user.role}</p>
            </div>
          </div>
        </div>

        <div className="border border-slate-700/70 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Next on the calendar</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Upcoming events</h2>
          <div className="mt-5 space-y-4">
            {eventsLoading ? <p className="text-sm text-slate-500">Loading events...</p> : upcomingEvents.length === 0 ? <p className="text-sm text-slate-500">No upcoming events scheduled.</p> : upcomingEvents.map((event, index) => (
              <div key={event.id} className={`border-l-2 pl-4 ${index % 2 === 0 ? 'border-teal-300/70' : 'border-amber-300/70'}`}>
                <p className="font-medium text-white">{event.title}</p>
                <p className="mt-1 text-sm text-slate-400">{new Date(event.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {event.location || 'Details available in Events'}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/events" className="mt-6 inline-flex text-sm font-medium text-teal-300 transition hover:text-teal-200">Browse all events <span className="ml-2">-&gt;</span></Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="border border-slate-700/70 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Society communication</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Latest announcements</h2>
            </div>
            <Link href="/dashboard/notifications" className="text-sm font-medium text-teal-300 transition hover:text-teal-200">Notifications</Link>
          </div>
          <div className="mt-4 divide-y divide-slate-800">
            {announcementsLoading ? <p className="py-4 text-sm text-slate-500">Loading announcements...</p> : recentAnnouncements.length === 0 ? <p className="py-4 text-sm text-slate-500">No announcements available.</p> : recentAnnouncements.map((announcement) => (
              <div key={announcement.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-slate-200">{announcement.title}</p>
                  <span className="shrink-0 text-xs capitalize text-slate-500">{announcement.priority}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{announcement.content}</p>
                <p className="mt-2 text-xs text-slate-600">{new Date(announcement.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-slate-700/70 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-300">Account attention</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Notification status</h2>
          <p className="mt-5 text-4xl font-semibold text-white">{notificationsLoading ? '—' : notifications.filter((notification) => !notification.is_read).length}</p>
          <p className="mt-2 text-sm text-slate-500">Unread notifications requiring your attention</p>
          <Link href="/dashboard/notifications" className="mt-6 inline-flex text-sm font-medium text-teal-300 transition hover:text-teal-200">Open notification centre <span className="ml-2">-&gt;</span></Link>
        </div>
      </section>
    </div>
  );
}
