'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import MemberAvatar from '@/components/MemberAvatar';
import { useAuthStore } from '@/lib/store';
import { useUsers, type User } from '@/lib/hooks';

const executiveOrder = ['vice_president', 'treasurer', 'president', 'joint_secretary', 'executive'];
const secretaryOrder = ['general_secretary', 'technical_secretary', 'cultural_secretary', 'secretary'];
const teamSocialLinks: Record<string, { label: string; url: string }[]> = {
	'kirti singh': [
		{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/kirti-singh-8a947537a?utm_source=share_via&utm_content=profile&utm_medium=member_android' },
		{ label: 'Instagram', url: 'https://www.instagram.com/kirtizlens?utm_source=qr&igsi=MTk2Y3dmNGF6c2RpbA==' },
	],
	'ojas singh': [
		{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/ojas-singh-101873419' },
		{ label: 'GitHub', url: 'https://github.com/Ojas-09' },
		{ label: 'Twitter', url: 'https://x.com/Ojas0907' },
	],
	'vibhanshu tiwari': [
		{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/vibhanshu-tiwari-a08777289/' },
		{ label: 'GitHub', url: 'https://github.com/vibhut-iitm' },
		{ label: 'Twitter', url: 'https://x.com/VibhanshuT2482' },
		{ label: 'Portfolio', url: 'https://vbhtportfolio.netlify.app/' },
	],
};

function roleLabel(role: string) {
	const labels: Record<string, string> = {
		president: 'President',
		treasurer: 'Treasurer',
		vice_president: 'Vice President',
		general_secretary: 'General Secretary',
		cultural_secretary: 'Cultural Secretary',
		technical_secretary: 'Technical Secretary',
		joint_secretary: 'Joint Secretary',
		year_representative: 'Year Representative',
		yearrep: 'Year Representative',
		executive: 'Executive',
		secretary: 'Secretary',
	};
	return labels[role.toLowerCase()] || role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sortByRoleOrder(members: User[], order: string[]) {
	return [...members].sort((first, second) => {
		const firstIndex = order.indexOf(first.role.toLowerCase());
		const secondIndex = order.indexOf(second.role.toLowerCase());
		return (firstIndex === -1 ? order.length : firstIndex) - (secondIndex === -1 ? order.length : secondIndex) || first.name.localeCompare(second.name);
	});
}

function TeamCard({ member, membershipPhoto }: { member: User; membershipPhoto?: string }) {
	const socialLinks = [
		{ label: 'LinkedIn', url: member.linkedin_url },
		{ label: 'GitHub', url: member.github_url },
		{ label: 'Twitter', url: member.twitter_url },
		{ label: 'Instagram', url: member.instagram_url },
		...(teamSocialLinks[member.name.trim().toLowerCase()] || []),
	].filter((link): link is { label: string; url: string } => Boolean(link.url));

	return (
		<article className="group rounded-lg border border-slate-700/60 bg-slate-900/70 p-5 text-center shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-1 hover:border-teal-400/50 hover:shadow-teal-950/20">
			<div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-slate-700 bg-gradient-to-br from-teal-500/20 to-indigo-500/20 p-1 transition group-hover:border-teal-400/70">
				<MemberAvatar name={member.name} profileImage={member.profile_image_url || membershipPhoto} alt={`${member.name} profile`} className="flex h-full w-full items-center justify-center overflow-hidden rounded-full text-4xl font-semibold text-teal-200" imageClassName={`h-full w-full object-cover ${member.name.trim().toLowerCase() === 'kirti singh' ? 'object-top' : ['yashashvi', 'vibhanshu tiwari'].includes(member.name.trim().toLowerCase()) ? 'object-center' : 'object-[center_20%]'}`} />
			</div>
			<div className="mt-5">
				<h3 className="text-lg font-semibold text-white">{member.name}</h3>
				<p className="mt-1 text-sm font-medium text-teal-300">{roleLabel(member.role)}</p>
				{(member.year || member.batch || member.department) && <p className="mt-3 text-xs text-slate-400">{member.year ? `Year ${member.year}` : ''}{member.year && (member.batch || member.department) ? ' | ' : ''}{member.batch || ''}{member.batch && member.department ? ' | ' : ''}{member.department || ''}</p>}
				{socialLinks.length > 0 && <div className="mt-4 flex flex-wrap justify-center gap-2">{socialLinks.map((link) => <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:border-teal-400/60 hover:text-teal-300">{link.label}</a>)}</div>}
			</div>
		</article>
	);
}

export default function DescriptionPage() {
	const router = useRouter();
	const user = useAuthStore((state) => state.user);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const hasHydrated = useAuthStore((state) => state.hasHydrated);
	const { users, loading } = useUsers();
	const [membershipPhotos, setMembershipPhotos] = useState<Record<string, string>>({});

	useEffect(() => {
		fetch('/api/membership/profile-images')
			.then((response) => response.ok ? response.json() : null)
			.then((data: { photos?: Record<string, string> } | null) => setMembershipPhotos(data?.photos || {}))
			.catch(() => setMembershipPhotos({}));
	}, []);

	useEffect(() => {
		if (hasHydrated && (!isAuthenticated || !user)) router.push('/login');
	}, [hasHydrated, isAuthenticated, user, router]);

	if (!hasHydrated || !isAuthenticated || !user) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading About page...</div>;

	const team = users.filter((member) => member.is_verified === true && !['member', 'admin'].includes(member.role.toLowerCase()));
	const executiveCouncil = sortByRoleOrder(team.filter((member) => executiveOrder.includes(member.role.toLowerCase())), executiveOrder);
	const secretaryTeam = sortByRoleOrder(team.filter((member) => secretaryOrder.includes(member.role.toLowerCase())), secretaryOrder);
	const yearRepresentatives = team.filter((member) => ['year_representative', 'yearrep'].includes(member.role.toLowerCase()) || member.role.toLowerCase().startsWith('year_rep_')).sort((first, second) => (second.year || Number.MIN_SAFE_INTEGER) - (first.year || Number.MIN_SAFE_INTEGER) || first.name.localeCompare(second.name));
	const coreTeam = team.filter((member) => !executiveOrder.includes(member.role.toLowerCase()) && !secretaryOrder.includes(member.role.toLowerCase()) && !yearRepresentatives.some((representative) => representative.id === member.id)).sort((first, second) => first.name.localeCompare(second.name));

	return (
		<LayoutWrapper user={user}>
			<main className="mx-auto max-w-7xl space-y-6 pb-8">
				<section><div className="flex flex-col gap-2 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Current core team</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Meet Our Team</h1><p className="mt-2 text-sm text-slate-400">Verified student leaders and their current society responsibilities.</p></div><span className="text-sm text-slate-500">{loading ? 'Loading team...' : `${team.length} verified leaders`}</span></div>
					  {loading ? <p className="py-8 text-sm text-slate-500">Loading team members...</p> : team.length === 0 ? <p className="py-8 text-sm text-slate-500">No verified team members available.</p> : <div className="mt-6 space-y-8">{executiveCouncil.length > 0 && <div><h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Executive council</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{executiveCouncil.map((member) => <TeamCard key={member.id} member={member} membershipPhoto={membershipPhotos[member.id]} />)}</div></div>}{secretaryTeam.length > 0 && <div><h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Secretaries</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{secretaryTeam.map((member) => <TeamCard key={member.id} member={member} membershipPhoto={membershipPhotos[member.id]} />)}</div></div>}{yearRepresentatives.length > 0 && <div><h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Year representatives</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{yearRepresentatives.map((member) => <TeamCard key={member.id} member={member} membershipPhoto={membershipPhotos[member.id]} />)}</div></div>}{coreTeam.length > 0 && <div><h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Core team</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{coreTeam.map((member) => <TeamCard key={member.id} member={member} membershipPhoto={membershipPhotos[member.id]} />)}</div></div>}</div>}
				</section>
			</main>
		</LayoutWrapper>
	);
}
