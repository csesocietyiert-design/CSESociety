'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface PublicMember {
  name: string;
  societyId: string;
  department: string;
  year: number | null;
  profileImage: string | null;
  idCard: string | null;
  verified: boolean;
}

function PublicIdCard() {
  const searchParams = useSearchParams();
  const societyId = searchParams.get('id')?.trim() || '';
  const [member, setMember] = useState<PublicMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!societyId) return;

    fetch(`/api/public/id-card?id=${encodeURIComponent(societyId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Member not found');
        return data as PublicMember;
      })
      .then(setMember)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [societyId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="border-b border-slate-700 pb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">CSE Society</p>
          <h1 className="mt-2 text-2xl font-bold">Member ID Card</h1>
          <p className="mt-1 text-sm text-slate-400">Public membership verification</p>
        </div>

        {loading && <p className="py-12 text-center text-sm text-slate-400">Loading member card...</p>}
        {!loading && (error || !societyId) && <p className="py-12 text-center text-sm text-rose-300">{error || 'No Society ID was provided.'}</p>}
        {!loading && member && (
          <div className="pt-6 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-teal-300/40 bg-teal-300/10 text-xs font-semibold text-teal-200">
              {member.profileImage ? <img src={toImageUrl(member.profileImage)} alt={`${member.name} profile`} className="h-full w-full object-cover" /> : <>CSE<br />SOCIETY</>}
            </div>
            <h2 className="mt-5 text-2xl font-bold">{member.name}</h2>
            <p className="mt-2 font-mono text-lg text-teal-300">{member.societyId}</p>
            <p className="mt-4 text-sm text-slate-300">{member.department}</p>
            {member.year && <p className="mt-1 text-sm text-slate-400">Year {member.year}</p>}
            <div className="mt-6 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300">
              Verified CSE Society Member
            </div>
            {member.idCard && (
              <div className="mt-6 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                <iframe
                  src={toCardPreviewUrl(member.idCard)}
                  title={`${member.name} CSE Society ID card`}
                  className="h-[32rem] w-full border-0"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default function PublicIdCardPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">Loading member card...</main>}>
      <PublicIdCard />
    </Suspense>
  );
}

function toImageUrl(url: string) {
  const match = url.match(/\/file\/d\/([^/]+)/);
  return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : url;
}

function toCardPreviewUrl(url: string) {
  const match = url.match(/\/file\/d\/([^/]+)/);
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
}