'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAnnouncements, useCertificates, useEvents, useMembershipProfileImage } from '@/lib/hooks';
import MemberAvatar from '@/components/MemberAvatar';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getGreeting(currentTime: number) {
  const hour = new Date(currentTime).getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface MemberUser {
  id: string;
  name: string;
  cseId: string;
  year?: number;
  role: string;
  department?: string;
  email?: string;
  phone?: string;
  bio?: string;
  profile_image_url?: string;
  is_verified?: boolean;
}

export default function MemberDashboard({ user }: { user: MemberUser }) {
  const [currentTime] = useState(() => Date.now());
  const [membershipOpen, setMembershipOpen] = useState(false);
  const membershipProfileImage = useMembershipProfileImage();
  const { events, loading: eventsLoading } = useEvents();
  const { certificates, loading: certificatesLoading } = useCertificates(user.id);
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const upcomingEvents = events
    .filter((event) => new Date(event.start_date).getTime() >= currentTime)
    .sort((first, second) => new Date(first.start_date).getTime() - new Date(second.start_date).getTime())
    .slice(0, 3);
  const profileFields = [user.phone, user.bio, membershipProfileImage || user.profile_image_url];
  const completedProfileFields = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((completedProfileFields / profileFields.length) * 100);
  const profileCompletionTone = profileCompletion < 40
    ? { text: 'text-red-300', bar: 'from-red-500 to-red-300', label: 'Needs attention' }
    : profileCompletion < 80
      ? { text: 'text-yellow-300', bar: 'from-yellow-500 to-amber-300', label: 'In progress' }
      : { text: 'text-green-300', bar: 'from-green-500 to-emerald-300', label: 'Complete' };
  const membershipStatus = user.is_verified === true ? 'Verified' : 'Pending review';
  const statCards = [
    { label: 'Membership', value: membershipStatus === 'Verified' ? 'ACTIVE' : 'PENDING', detail: membershipStatus, href: '/dashboard/profile', tone: 'teal' },
    { label: 'Upcoming Events', value: eventsLoading ? '--' : String(upcomingEvents.length).padStart(2, '0'), detail: 'Events available', href: '/dashboard/events', tone: 'amber' },
    { label: 'Certificates', value: certificatesLoading ? '--' : String(certificates.length).padStart(2, '0'), detail: 'Earned certificates', href: '/dashboard/certificates', tone: 'sky' },
    { label: 'Profile', value: `${profileCompletion}%`, detail: 'Profile complete', href: '/dashboard/profile', tone: 'teal' },
  ];

  return (
    <div className="dashboard-front mx-auto max-w-7xl space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-lg border border-slate-700/70 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/80 px-6 py-6 shadow-xl shadow-black/20 sm:px-8">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-teal-400/10 to-transparent" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Member dashboard</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{getGreeting(currentTime)}</h1>
            <p className="mt-2 text-sm text-slate-400">Your membership, upcoming activity, and latest updates.</p>
          </div>
          <div className="flex items-center gap-4 border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-teal-300/60 bg-teal-400/15 text-lg font-semibold text-teal-100">
              <MemberAvatar name={user.name} profileImage={membershipProfileImage || user.profile_image_url} alt="Member profile" className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-teal-300/60 bg-teal-400/15 text-lg font-semibold text-teal-100" />
            </div>
            <div>
              <p className="font-mono text-lg font-semibold text-white">{user.cseId}</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-teal-300"><span className="h-2 w-2 rounded-full bg-teal-300" /> {membershipStatus} Member</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          stat.label === 'Membership' ? <button key={stat.label} type="button" onClick={() => setMembershipOpen(true)} className={`dashboard-stat-card group flex min-h-32 w-full flex-col justify-between rounded-lg border p-5 text-left transition duration-200 hover:-translate-y-1 ${stat.tone === 'amber' ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-slate-900/75 to-slate-900/95 shadow-lg shadow-amber-950/20 hover:border-amber-300/70 hover:shadow-amber-900/30' : stat.tone === 'sky' ? 'border-sky-500/30 bg-gradient-to-br from-sky-500/15 via-slate-900/75 to-slate-900/95 shadow-lg shadow-sky-950/20 hover:border-sky-300/70 hover:shadow-sky-900/30' : 'border-teal-500/30 bg-gradient-to-br from-teal-500/15 via-slate-900/75 to-slate-900/95 shadow-lg shadow-teal-950/20 hover:border-teal-300/70 hover:shadow-teal-900/30'}`}>
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p><span className={`h-2 w-2 rounded-full ${stat.tone === 'amber' ? 'bg-amber-300' : stat.tone === 'sky' ? 'bg-sky-300' : stat.tone === 'rose' ? 'bg-rose-300' : 'bg-teal-300'}`} /></div>
            <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-500 group-hover:text-slate-300">{stat.detail}</p>
          </button> : <Link key={stat.label} href={stat.href} className={`dashboard-stat-card group flex min-h-32 flex-col justify-between rounded-lg border p-5 shadow-lg transition duration-200 hover:-translate-y-1 ${stat.tone === 'amber' ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-slate-900/75 to-slate-900/95 shadow-amber-950/20 hover:border-amber-300/70 hover:shadow-amber-900/30' : stat.tone === 'sky' ? 'border-sky-500/30 bg-gradient-to-br from-sky-500/15 via-slate-900/75 to-slate-900/95 shadow-sky-950/20 hover:border-sky-300/70 hover:shadow-sky-900/30' : 'border-teal-500/30 bg-gradient-to-br from-teal-500/15 via-slate-900/75 to-slate-900/95 shadow-teal-950/20 hover:border-teal-300/70 hover:shadow-teal-900/30'}`}>
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p><span className={`h-2 w-2 rounded-full ${stat.tone === 'amber' ? 'bg-amber-300' : stat.tone === 'sky' ? 'bg-sky-300' : stat.tone === 'rose' ? 'bg-rose-300' : 'bg-teal-300'}`} /></div>
            <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-500 group-hover:text-slate-300">{stat.detail}</p>
          </Link>
        ))}
      </section>

      {membershipOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMembershipOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="membership-dialog-title" className="w-full max-w-md rounded-lg border border-teal-400/40 bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-teal-950/40">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Current membership</p><h2 id="membership-dialog-title" className="mt-2 text-2xl font-semibold text-white">Membership details</h2></div><button type="button" onClick={() => setMembershipOpen(false)} aria-label="Close membership details" className="text-2xl leading-none text-slate-400 hover:text-white">&times;</button></div>
          <dl className="mt-5 grid grid-cols-2 gap-5">
            <div><dt className="text-xs uppercase tracking-wider text-slate-500">Society ID</dt><dd className="mt-1 font-mono text-white">{user.cseId}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-slate-500">Status</dt><dd className="mt-1 text-teal-300">{membershipStatus}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-slate-500">Academic year</dt><dd className="mt-1 text-white">{user.year ? `Year ${user.year}` : 'Not set'}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-slate-500">Role</dt><dd className="mt-1 capitalize text-white">{user.role.replaceAll('_', ' ')}</dd></div>
            <div className="col-span-2"><dt className="text-xs uppercase tracking-wider text-slate-500">Department</dt><dd className="mt-1 text-white">{user.department || 'Computer Science & Engineering'}</dd></div>
          </dl>
          <button type="button" onClick={() => setMembershipOpen(false)} className="mt-6 w-full rounded-md border border-teal-400/40 bg-teal-400/10 px-4 py-2 text-sm font-medium text-teal-200 hover:bg-teal-400/20">Close</button>
        </section>
      </div>}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-indigo-500/25 bg-gradient-to-br from-indigo-500/15 via-slate-900/80 to-slate-950/95 p-6 shadow-lg shadow-indigo-950/20 transition hover:border-indigo-400/50">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">My membership</p><h2 className="mt-2 text-xl font-semibold text-white">Membership details</h2></div><span className="text-xs font-medium text-teal-300">{membershipStatus}</span></div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 pt-5">
            <div><dt className="text-xs uppercase tracking-wider text-slate-500">CSE Society ID</dt><dd className="mt-2 font-mono text-lg text-white">{user.cseId}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-slate-500">Academic year</dt><dd className="mt-2 text-lg text-white">{user.year ? `Year ${user.year}` : 'Not set'}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-slate-500">Department</dt><dd className="mt-2 text-sm leading-5 text-white">{user.department || 'Computer Science & Engineering'}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-slate-500">Session</dt><dd className="mt-2 text-lg text-white">{new Date().getFullYear()}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-slate-500">Role</dt><dd className="mt-2 capitalize text-lg text-white">{user.role}</dd></div>
          </dl>
          <Link href="/dashboard/profile" className="mt-6 inline-flex text-sm font-medium text-teal-300 hover:text-teal-200">View membership details -&gt;</Link>
        </div>

        <div className="rounded-lg border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-slate-900/80 to-slate-950/95 p-6 shadow-lg shadow-amber-950/20 transition hover:border-amber-400/50">
          <div className="flex items-end justify-between gap-4 border-b border-slate-800 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Society calendar</p><h2 className="mt-2 text-xl font-semibold text-white">Upcoming events</h2></div><Link href="/dashboard/events" className="text-sm font-medium text-teal-300 hover:text-teal-200">View all -&gt;</Link></div>
          <div className="mt-5 grid gap-3">
            {eventsLoading ? <p className="text-sm text-slate-500">Loading events...</p> : upcomingEvents.length === 0 ? <p className="text-sm text-slate-500">No upcoming events scheduled.</p> : upcomingEvents.map((event) => (
              <article key={event.id} className="rounded-lg border border-slate-700/70 bg-slate-950/50 p-4 shadow-sm shadow-black/10"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-white">{event.title}</h3><p className="mt-1 text-sm text-slate-400">{formatDate(event.start_date)} at {formatTime(event.start_date)}</p><p className="mt-1 text-sm text-slate-400">{event.location || 'Venue to be announced'}</p>{event.caption && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-300">{event.caption}</p>}{event.authority_letter_url && <a href={event.authority_letter_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-teal-300 hover:text-teal-200">Open event document -&gt;</a>}</div><Link href="/dashboard/events" className="shrink-0 border border-teal-400/30 bg-teal-400/10 px-2 py-1 text-xs text-teal-300 hover:border-teal-300 hover:text-teal-200">{event.status === 'completed' ? 'Completed' : 'Register -&gt;'}</Link></div></article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-lg border border-sky-500/25 bg-gradient-to-br from-sky-500/15 via-slate-900/80 to-slate-950/95 p-6 shadow-lg shadow-sky-950/20 transition hover:border-sky-400/50"><div className="flex items-end justify-between gap-4 border-b border-slate-800 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Achievements</p><h2 className="mt-2 text-xl font-semibold text-white">My certificates</h2></div><Link href="/dashboard/certificates" className="text-sm font-medium text-teal-300 hover:text-teal-200">View all -&gt;</Link></div>{certificatesLoading ? <p className="mt-5 text-sm text-slate-500">Loading certificates...</p> : certificates.length === 0 ? <p className="mt-5 text-sm leading-6 text-slate-400">No certificates yet. Participate in society activities to build your achievement record.</p> : <div className="mt-5"><p className="text-3xl font-semibold text-white">{String(certificates.length).padStart(2, '0')} <span className="text-base font-normal text-slate-400">certificate{certificates.length === 1 ? '' : 's'} earned</span></p><p className="mt-5 font-medium text-white">{certificates[0].title || certificates[0].name || 'Society achievement'}</p><p className="mt-1 text-sm text-slate-400">{certificates[0].type || 'Participation Certificate'}</p><Link href="/dashboard/certificates" className="mt-5 inline-flex text-sm font-medium text-teal-300 hover:text-teal-200">View certificate -&gt;</Link></div>}</div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-rose-500/25 bg-gradient-to-br from-rose-500/15 via-slate-900/80 to-slate-950/95 p-6 shadow-lg shadow-rose-950/20 transition hover:border-rose-400/50"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Profile</p><span className={`text-xs font-medium ${profileCompletionTone.text}`}>{profileCompletionTone.label}</span></div><h2 className="mt-2 text-xl font-semibold text-white">Profile completeness</h2><p className={`mt-5 text-3xl font-semibold ${profileCompletionTone.text}`}>{profileCompletion}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full bg-gradient-to-r ${profileCompletionTone.bar}`} style={{ width: `${profileCompletion}%` }} /></div><p className="mt-4 text-sm leading-6 text-slate-400">{profileCompletion === 100 ? 'Your profile is complete.' : 'Add your phone, bio, or profile photo to keep your record current.'}</p><Link href="/dashboard/profile" className="mt-5 inline-flex text-sm font-medium text-teal-300 hover:text-teal-200">Update profile -&gt;</Link></div>
        <div className="rounded-lg border border-violet-500/25 bg-gradient-to-br from-violet-500/15 via-slate-900/80 to-slate-950/95 p-6 shadow-lg shadow-violet-950/20 transition hover:border-violet-400/50"><div className="flex items-end justify-between gap-4 border-b border-slate-800 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Announcements</p><h2 className="mt-2 text-xl font-semibold text-white">Society updates</h2></div><Link href="/dashboard/notifications" className="text-sm font-medium text-teal-300 hover:text-teal-200">View all -&gt;</Link></div><div className="mt-2 divide-y divide-slate-800">{announcementsLoading ? <p className="py-4 text-sm text-slate-500">Loading updates...</p> : announcements.length === 0 ? <p className="py-4 text-sm text-slate-500">No society updates yet.</p> : announcements.slice(0, 3).map((announcement) => <article key={announcement.id} className="py-4"><p className="font-medium text-white">{announcement.title}</p><p className="mt-1 text-sm leading-5 text-slate-400">{announcement.content}</p><p className="mt-2 text-xs text-slate-600">{formatDate(announcement.created_at)}</p></article>)}</div></div>
      </section>
    </div>
  );
}
