'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAnnouncements, useCertificates, useEvents, useMembershipProfileImage, useRealtimeNotifications, useUsers, type User } from '@/lib/hooks';
import MemberAvatar from '@/components/MemberAvatar';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function relativeDate(date: string, currentTime: number) {
  const days = Math.floor((currentTime - new Date(date).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function getGreeting(currentTime: number) {
  const hour = new Date(currentTime).getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const leadershipOrder = ['vice_president', 'general_secretary', 'technical_secretary', 'cultural_secretary', 'treasurer'];

function shuffleUsers(users: User[]) {
  const shuffled = [...users];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    vice_president: 'Vice President',
    general_secretary: 'General Secretary',
    technical_secretary: 'Technical Secretary',
    cultural_secretary: 'Cultural Secretary',
    treasurer: 'Treasurer',
    year_representative: 'Year Representative',
    yearRep: 'Year Representative',
    member: 'Member',
  };
  return labels[role] || role.replaceAll('_', ' ');
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
  const membershipProfileImage = useMembershipProfileImage();
  const { events, loading: eventsLoading } = useEvents();
  const { certificates, loading: certificatesLoading } = useCertificates(user.id);
  const { announcements, loading: announcementsLoading } = useAnnouncements();
  const { notifications, loading: notificationsLoading } = useRealtimeNotifications(user.id);
  const { users, loading: usersLoading } = useUsers();
  const [randomMembers, setRandomMembers] = useState<User[]>([]);
  const verifiedUsers = users.filter((member) => member.is_verified !== false);
  const leadershipMembers = leadershipOrder.flatMap((role) => verifiedUsers.filter((member) => member.role.toLowerCase() === role));
  const yearRepresentatives = verifiedUsers
    .filter((member) => ['year_representative', 'yearrep'].includes(member.role.toLowerCase()) || member.role.toLowerCase().startsWith('year_rep_'))
    .sort((first, second) => (first.year || 0) - (second.year || 0));

  useEffect(() => {
    setRandomMembers(shuffleUsers(verifiedUsers.filter((member) => member.role.toLowerCase() === 'member')));
  }, [users]);

  // Shuffle ordinary members once each time the fetched roster changes.
  const refreshRandomMembers = () => {
    setRandomMembers(shuffleUsers(verifiedUsers.filter((member) => member.role.toLowerCase() === 'member')));
  };
  const upcomingEvents = events
    .filter((event) => new Date(event.start_date).getTime() >= currentTime)
    .sort((first, second) => new Date(first.start_date).getTime() - new Date(second.start_date).getTime())
    .slice(0, 3);
  const unreadNotifications = notifications.filter((notification) => !notification.is_read).length;
  const profileFields = [user.phone, user.bio, membershipProfileImage || user.profile_image_url];
  const profileCompletion = Math.round((6 + profileFields.filter(Boolean).length) / 9 * 100);
  const membershipStatus = user.is_verified === false ? 'Pending review' : 'Verified';
  const statCards = [
    { label: 'Membership', value: 'ACTIVE', detail: 'Verified Member', href: '/dashboard/profile', tone: 'teal' },
    { label: 'Upcoming Events', value: eventsLoading ? '--' : String(upcomingEvents.length).padStart(2, '0'), detail: 'Events available', href: '/dashboard/events', tone: 'amber' },
    { label: 'Certificates', value: certificatesLoading ? '--' : String(certificates.length).padStart(2, '0'), detail: 'Earned certificates', href: '/dashboard/certificates', tone: 'sky' },
    { label: 'Resources', value: 'OPEN', detail: 'Society resources', href: '/dashboard/resources', tone: 'teal' },
    { label: 'Notifications', value: notificationsLoading ? '--' : String(unreadNotifications).padStart(2, '0'), detail: 'Unread notifications', href: '/dashboard/notifications', tone: 'rose' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-lg border border-slate-700/70 bg-gradient-to-br from-blue-600/20 via-slate-900/70 to-teal-700/10 px-6 py-7 shadow-2xl shadow-black/20 backdrop-blur-md sm:px-8">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(120deg,transparent,rgba(45,212,191,0.08))]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">CSE Society Member Portal</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{getGreeting(currentTime)}, {user.name.split(' ')[0]}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Stay updated with society events, opportunities, achievements, and your membership.</p>
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
          <Link key={stat.label} href={stat.href} className={`group rounded-lg border p-5 shadow-lg shadow-black/10 backdrop-blur-md transition hover:-translate-y-0.5 ${stat.tone === 'amber' ? 'border-amber-500/30 bg-gradient-to-br from-amber-600/20 to-amber-700/10 hover:border-amber-400/60' : stat.tone === 'sky' ? 'border-sky-500/30 bg-gradient-to-br from-sky-600/20 to-sky-700/10 hover:border-sky-400/60' : stat.tone === 'rose' ? 'border-rose-500/30 bg-gradient-to-br from-rose-600/20 to-rose-700/10 hover:border-rose-400/60' : 'border-teal-500/30 bg-gradient-to-br from-teal-600/20 to-teal-700/10 hover:border-teal-400/60'}`}>
            <div className="mb-5 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p><span className={`h-2 w-2 rounded-full ${stat.tone === 'amber' ? 'bg-amber-300' : stat.tone === 'sky' ? 'bg-sky-300' : stat.tone === 'rose' ? 'bg-rose-300' : 'bg-teal-300'}`} /></div>
            <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-500 group-hover:text-slate-300">{stat.detail}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-blue-950/30 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Society directory</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Our members</h2>
          </div>
          <p className="text-sm text-slate-400">Leadership, representatives, and members</p>
        </div>
        {usersLoading ? <p className="mt-5 text-sm text-slate-500">Loading society members...</p> : <div className="mt-5 space-y-6">
          {[...leadershipMembers, ...yearRepresentatives, ...randomMembers].length === 0 ? <p className="text-sm text-slate-500">No verified members found.</p> : <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[...leadershipMembers, ...yearRepresentatives].map((member) => (
                <article key={member.id} className="rounded-lg border border-slate-700/70 bg-slate-950/50 p-4">
                  <p className="font-semibold text-white">{member.name}</p>
                  <p className="mt-1 text-sm text-teal-300">{roleLabel(member.role)}{member.role.toLowerCase().includes('year') && member.year ? ` - Year ${member.year}` : ''}</p>
                  <p className="mt-2 text-xs text-slate-500">{member.department || 'Computer Science & Engineering'}</p>
                </article>
              ))}
            </div>
            {randomMembers.length > 0 && <div>
              <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Members</h3><button type="button" onClick={refreshRandomMembers} className="text-xs font-medium text-teal-300 hover:text-teal-200">Shuffle</button></div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {randomMembers.map((member) => <article key={member.id} className="rounded-lg border border-slate-800 bg-slate-950/30 p-4"><p className="font-medium text-white">{member.name}</p><p className="mt-1 text-xs text-slate-500">{member.department || 'Computer Science & Engineering'}{member.year ? ` - Year ${member.year}` : ''}</p></article>)}
              </div>
            </div>}
          </>}
        </div>}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-blue-600/15 to-slate-900/70 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
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

        <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-amber-600/15 to-slate-900/70 p-6 shadow-lg shadow-black/10 backdrop-blur-md">
          <div className="flex items-end justify-between gap-4 border-b border-slate-800 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Society calendar</p><h2 className="mt-2 text-xl font-semibold text-white">Upcoming events</h2></div><Link href="/dashboard/events" className="text-sm font-medium text-teal-300 hover:text-teal-200">View all -&gt;</Link></div>
          <div className="mt-5 grid gap-3">
            {eventsLoading ? <p className="text-sm text-slate-500">Loading events...</p> : upcomingEvents.length === 0 ? <p className="text-sm text-slate-500">No upcoming events scheduled.</p> : upcomingEvents.map((event) => (
              <article key={event.id} className="rounded-lg border border-slate-700/70 bg-slate-950/50 p-4 shadow-sm shadow-black/10"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-white">{event.title}</h3><p className="mt-1 text-sm text-slate-400">{formatDate(event.start_date)} at {formatTime(event.start_date)}</p><p className="mt-1 text-sm text-slate-400">{event.location || 'Venue to be announced'}</p>{event.caption && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-300">{event.caption}</p>}{event.authority_letter_url && <a href={event.authority_letter_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-teal-300 hover:text-teal-200">Open event document -&gt;</a>}</div><Link href="/dashboard/events" className="shrink-0 border border-teal-400/30 bg-teal-400/10 px-2 py-1 text-xs text-teal-300 hover:border-teal-300 hover:text-teal-200">{event.status === 'completed' ? 'Completed' : 'Register -&gt;'}</Link></div></article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-rose-600/15 to-slate-900/70 p-6 shadow-lg shadow-black/10 backdrop-blur-md"><div className="flex items-end justify-between gap-4 border-b border-slate-800 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-300">Stay informed</p><h2 className="mt-2 text-xl font-semibold text-white">Recent notifications</h2></div><Link href="/dashboard/notifications" className="text-sm font-medium text-teal-300 hover:text-teal-200">View all -&gt;</Link></div><div className="mt-2 divide-y divide-slate-800">{notificationsLoading ? <p className="py-4 text-sm text-slate-500">Loading notifications...</p> : notifications.length === 0 ? <p className="py-4 text-sm text-slate-500">No notifications yet.</p> : notifications.slice(0, 3).map((notification) => <div key={notification.id} className="flex gap-3 py-4"><span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? 'bg-slate-700' : 'bg-teal-300'}`} /><div><p className="font-medium text-white">{notification.title}</p><p className="mt-1 text-sm text-slate-400">{notification.message}</p><p className="mt-2 text-xs text-slate-600">{relativeDate(notification.created_at, currentTime)}</p></div></div>)}</div></div>
        <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-purple-600/15 to-slate-900/70 p-6 shadow-lg shadow-black/10 backdrop-blur-md"><div className="flex items-end justify-between gap-4 border-b border-slate-800 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Achievement record</p><h2 className="mt-2 text-xl font-semibold text-white">My certificates</h2></div><Link href="/dashboard/certificates" className="text-sm font-medium text-teal-300 hover:text-teal-200">View all -&gt;</Link></div>{certificatesLoading ? <p className="mt-5 text-sm text-slate-500">Loading certificates...</p> : certificates.length === 0 ? <p className="mt-5 text-sm leading-6 text-slate-400">No certificates yet. Participate in society activities to build your achievement record.</p> : <div className="mt-5"><p className="text-3xl font-semibold text-white">{String(certificates.length).padStart(2, '0')} <span className="text-base font-normal text-slate-400">certificate{certificates.length === 1 ? '' : 's'} earned</span></p><p className="mt-5 font-medium text-white">{certificates[0].title || certificates[0].name || 'Society achievement'}</p><p className="mt-1 text-sm text-slate-400">{certificates[0].type || 'Participation Certificate'}</p><Link href="/dashboard/certificates" className="mt-5 inline-flex text-sm font-medium text-teal-300 hover:text-teal-200">View certificate -&gt;</Link></div>}</div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-amber-600/15 to-slate-900/70 p-6 shadow-lg shadow-black/10 backdrop-blur-md"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Account attention</p><h2 className="mt-2 text-xl font-semibold text-white">Complete your profile</h2><p className="mt-5 text-3xl font-semibold text-white">{profileCompletion}%</p><div className="mt-3 h-2 overflow-hidden bg-slate-800"><div className="h-full bg-teal-300" style={{ width: `${profileCompletion}%` }} /></div><p className="mt-4 text-sm leading-6 text-slate-400">{profileCompletion === 100 ? 'Your profile is complete.' : 'Add your phone, bio, or profile photo to keep your record current.'}</p><Link href="/dashboard/profile" className="mt-5 inline-flex text-sm font-medium text-teal-300 hover:text-teal-200">Complete profile -&gt;</Link></div>
        <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-teal-600/15 to-slate-900/70 p-6 shadow-lg shadow-black/10 backdrop-blur-md"><div className="flex items-end justify-between gap-4 border-b border-slate-800 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">From the society</p><h2 className="mt-2 text-xl font-semibold text-white">Society updates</h2></div><Link href="/dashboard/notifications" className="text-sm font-medium text-teal-300 hover:text-teal-200">View all -&gt;</Link></div><div className="mt-2 divide-y divide-slate-800">{announcementsLoading ? <p className="py-4 text-sm text-slate-500">Loading updates...</p> : announcements.length === 0 ? <p className="py-4 text-sm text-slate-500">No society updates yet.</p> : announcements.slice(0, 3).map((announcement) => <article key={announcement.id} className="py-4"><p className="font-medium text-white">{announcement.title}</p><p className="mt-1 text-sm leading-5 text-slate-400">{announcement.content}</p><p className="mt-2 text-xs text-slate-600">{formatDate(announcement.created_at)}</p></article>)}</div></div>
      </section>
    </div>
  );
}
