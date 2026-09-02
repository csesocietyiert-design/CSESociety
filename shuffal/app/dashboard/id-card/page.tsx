'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useAuthStore } from '@/lib/store';
import { useMembershipProfileImage, useUsers } from '@/lib/hooks';
import MemberAvatar from '@/components/MemberAvatar';

export default function IdCardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { users } = useUsers();
  const membershipProfileImage = useMembershipProfileImage();
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);
  const [cardProfileImage, setCardProfileImage] = useState<string | null>(null);
  const memberData = users.find((member) => member.id === user?.id);
  const [sortBy, setSortBy] = useState<'name' | 'cse_id' | 'year' | 'role' | 'status'>('name');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const isYearRepresentative = user?.role === 'year_representative' || user?.role === 'yearRep';
  const canViewAllCards = ['admin', 'general_secretary', 'cultural_secretary', 'technical_secretary', 'treasurer'].includes(user?.role || '');
  const canViewCardDirectory = canViewAllCards || isYearRepresentative;
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
  const visibleMembers = sortedMembers.filter((member) => {
    const search = searchTerm.trim().toLowerCase();
    return !search || member.name.toLowerCase().includes(search) || member.cse_id.toLowerCase().includes(search) || member.email.toLowerCase().includes(search);
  });
  const selectedMember = sortedMembers.find((member) => member.id === selectedMemberId) || sortedMembers[0];
  const cardMember = canViewAllCards || isYearRepresentative ? selectedMember : memberData;
  const cardPreviewUrl = idCardUrl ? toCardPreviewUrl(idCardUrl) : null;
  const profilePhotoUrl = cardProfileImage || cardMember?.profile_image_url || (cardMember?.id === user?.id ? membershipProfileImage : null);
  const targetSocietyId = cardMember?.cse_id || user?.cseId;

  useEffect(() => {
    let active = true;
    if (!targetSocietyId) return () => { active = false; };
    fetch(`/api/membership/id-card?societyId=${encodeURIComponent(targetSocietyId)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data: { idCard?: string | null; profileImage?: string | null } | null) => {
        if (active) {
          setIdCardUrl(data?.idCard || null);
          setCardProfileImage(data?.profileImage || null);
        }
      })
      .catch(() => {
        if (active) {
          setIdCardUrl(null);
          setCardProfileImage(null);
        }
      });
    return () => { active = false; };
  }, [targetSocietyId]);

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

        {canViewCardDirectory && <section className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-5 shadow-lg backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Card directory</p><p className="mt-1 text-sm text-slate-400">Search for a member and open their card</p></div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name, CSE ID, or email" className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400 sm:w-64" />
              {canViewAllCards && <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-white outline-none focus:border-sky-400">
                  <option value="name">Name</option>
                  <option value="cse_id">CSE ID</option>
                  <option value="year">Year</option>
                  <option value="role">Role</option>
                  <option value="status">Status</option>
                </select>}
            </div>
          </div>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
            {visibleMembers.length === 0 ? <p className="py-4 text-center text-sm text-slate-500">No matching members found.</p> : visibleMembers.map((member) => <button key={member.id} type="button" onClick={() => setSelectedMemberId(member.id)} className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left transition ${selectedMemberId === member.id ? 'border-sky-400/70 bg-sky-500/15' : 'border-slate-700 bg-slate-950/30 hover:border-sky-400/50'}`}>
              <span className="min-w-0"><span className="block truncate font-medium text-white">{member.name}</span><span className="mt-1 block truncate text-xs text-slate-400">{member.cse_id} | Year {member.year || 'Not set'} | {member.role.replaceAll('_', ' ')}</span></span><span className="shrink-0 text-xs font-medium text-sky-300">View Card -&gt;</span>
            </button>)}
          </div>
          <p className="mt-3 text-xs text-slate-500">Showing {visibleMembers.length} of {sortedMembers.length} members</p>
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
              {profilePhotoUrl ? <MemberAvatar name={cardMember?.name || user.name} profileImage={profilePhotoUrl} className="h-full w-full" alt={`${cardMember?.name || user.name} profile`} /> : <>CSE<br />SOCIETY</>}
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">ID card</p>
          <div className="mt-4 flex min-h-56 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-700 bg-slate-950/30 text-sm text-slate-600">
            {cardPreviewUrl ? <iframe src={cardPreviewUrl} title={`${cardMember?.name || user.name} ID card preview`} loading="lazy" className="h-[32rem] w-full border-0" /> : 'ID card not available'}
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}

function toCardPreviewUrl(url: string) {
  const match = url.match(/\/file\/d\/([^/]+)/);
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
}
