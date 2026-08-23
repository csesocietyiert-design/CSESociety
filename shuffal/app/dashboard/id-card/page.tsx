'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useAuthStore } from '@/lib/store';
import { useUsers } from '@/lib/hooks';

export default function IdCardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { users } = useUsers();
  const memberData = users.find((member) => member.id === user?.id);
  const [sortBy, setSortBy] = useState<'name' | 'cse_id' | 'year' | 'role' | 'status'>('name');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const isYearRepresentative = user?.role === 'year_representative' || user?.role === 'yearRep';
  const canViewAllCards = ['admin', 'vice_president', 'general_secretary', 'cultural_secretary', 'technical_secretary'].includes(user?.role || '');
  const cardMembers = canViewAllCards
    ? users
    : isYearRepresentative
      ? users.filter((member) => user?.year !== undefined && member.year === user.year)
      : memberData ? [memberData] : [];
  const sortedMembers = [...cardMembers].sort((first, second) => {
    if (sortBy === 'year') return (first.year || 0) - (second.year || 0) || first.name.localeCompare(second.name);
    if (sortBy === 'status') return Number(Boolean(second.is_verified)) - Number(Boolean(first.is_verified)) || first.name.localeCompare(second.name);
    if (sortBy === 'role') return first.role.localeCompare(second.role) || first.name.localeCompare(second.name);
    if (sortBy === 'cse_id') return first.cse_id.localeCompare(second.cse_id);
    return first.name.localeCompare(second.name);
  });
  const selectedMember = sortedMembers.find((member) => member.id === selectedMemberId) || sortedMembers[0];
  const cardMember = canViewAllCards || isYearRepresentative ? selectedMember : memberData;

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !user)) router.push('/login');
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated || !isAuthenticated || !user) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading ID card...</div>;
  }

  return (
    <LayoutWrapper user={user}>
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">CSE Society</p>
          <h1 className="mt-2 text-3xl font-bold text-white">ID Card</h1>
          <p className="mt-2 text-sm text-slate-400">Your society identity card.</p>
        </div>

        {canViewAllCards && <section className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-5 shadow-lg backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Card directory</p><p className="mt-1 text-sm text-slate-400">Select a member ID card</p></div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-white outline-none focus:border-sky-400">
                <option value="name">Sort by name</option>
                <option value="cse_id">Sort by CSE ID</option>
                <option value="year">Sort by year</option>
                <option value="role">Sort by role</option>
                <option value="status">Sort by status</option>
              </select>
              <select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-white outline-none focus:border-sky-400">
                <option value="">Select member</option>
                {sortedMembers.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.cse_id})</option>)}
              </select>
            </div>
          </div>
        </section>}

        <section className="rounded-lg border border-slate-700/70 bg-gradient-to-br from-blue-600/20 via-slate-900/80 to-teal-700/10 p-6 shadow-lg backdrop-blur-md">
          <div className="border-b border-white/10 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">CSE Society</p>
            <p className="mt-1 text-sm text-slate-400">Member Identity Card</p>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-2xl font-bold text-white">{cardMember?.name || user.name}</h2>
              <p className="mt-2 font-mono text-sm text-teal-300">{cardMember?.cse_id || user.cseId}</p>
              <p className="mt-4 capitalize text-slate-300">{(cardMember?.role || user.role).replaceAll('_', ' ')}</p>
              <p className="mt-1 text-sm text-slate-400">{cardMember?.department || user.department || 'Computer Science & Engineering'}</p>
              {(cardMember?.year || user.year) && <p className="mt-1 text-sm text-slate-400">Year {cardMember?.year || user.year}</p>}
              <p className="mt-4 text-sm text-slate-500">{cardMember?.email || user.email}</p>
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-teal-300/40 bg-teal-300/10 text-center text-xs font-semibold text-teal-200">
              CSE<br />SOCIETY
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-6 shadow-lg backdrop-blur-md">
          <div className="border-b border-slate-800 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Member record</p>
            <h2 className="mt-2 text-xl font-semibold text-white">All member data</h2>
          </div>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            {[
              ['Name', cardMember?.name || user.name],
              ['CSE ID', cardMember?.cse_id || user.cseId],
              ['Email', cardMember?.email || user.email],
              ['Phone', cardMember?.phone || 'Not provided'],
              ['Role', (cardMember?.role || user.role).replaceAll('_', ' ')],
              ['Year', cardMember?.year ? `Year ${cardMember.year}` : user.year ? `Year ${user.year}` : 'Not set'],
              ['Admission Year', cardMember?.admission_year ? String(cardMember.admission_year) : 'Not set'],
              ['Department', cardMember?.department || user.department || 'Computer Science & Engineering'],
              ['Bio', cardMember?.bio || 'Not provided'],
              ['Account Status', cardMember?.is_verified === false ? 'Pending approval' : 'Verified'],
              ['Joined On', cardMember?.created_at ? new Date(cardMember.created_at).toLocaleDateString('en-IN') : 'Not available'],
              ['Profile Image', cardMember?.profile_image_url ? 'Available' : 'Not provided'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
                <dd className="mt-2 break-words text-sm capitalize text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-lg border border-dashed border-slate-600 bg-slate-900/20 p-6 shadow-lg backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Future card design</p>
          <div className="mt-4 flex min-h-56 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/30 text-sm text-slate-600">
            Blank ID card template
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}
