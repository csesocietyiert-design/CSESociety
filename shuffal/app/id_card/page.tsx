import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import PublicCardGate from '@/components/PublicCardGate';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface PublicIdCardPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function PublicIdCardPage({ searchParams }: PublicIdCardPageProps) {
  const societyId = (await searchParams).id?.trim() || '';
  const cardUrl = societyId ? await findCardUrl(societyId) : null;

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/50 shadow-2xl sm:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-blue-600/20 via-slate-900/40 to-teal-500/10 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-teal-300/40 bg-white/95 shadow-lg shadow-blue-950/40 sm:h-14 sm:w-14">
              <Image src="/logo.png" alt="CSE Society logo" width={56} height={56} className="h-full w-full object-cover" priority />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-teal-300 sm:text-xs">CSE Society, IERT</p>
              <h1 className="mt-1 text-lg font-bold sm:text-2xl">Digital ID Card</h1>
            </div>
          </div>
          {societyId && <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 font-mono text-xs text-teal-200">{societyId}</span>}
        </header>

        {!societyId ? (
          <StatusMessage message="No Society ID was provided." />
        ) : !cardUrl ? (
          <StatusMessage message="This ID card is unavailable or the Society ID is not valid." error />
        ) : (
          <PublicCardGate cardUrl={cardUrl} societyId={societyId} />
        )}
      </div>
    </main>
  );
}

async function findCardUrl(societyId: string) {
  if (!supabaseUrl || !serviceRoleKey) return null;
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [memberResult, profileResult] = await Promise.all([
    supabase.from('users').select('cse_id, is_verified').eq('cse_id', societyId).maybeSingle(),
    supabase.from('membership').select('id_card').eq('society_id', societyId).not('id_card', 'is', null).order('id', { ascending: true }).limit(1).maybeSingle(),
  ]);
  const { data: member } = memberResult;
  if (!member || member.is_verified === false) return null;
  const { data: profile } = profileResult;
  return profile?.id_card || null;
}

function StatusMessage({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={`flex flex-1 items-center justify-center px-6 py-20 text-center text-sm ${error ? 'text-rose-300' : 'text-slate-400'}`}>{message}</div>;
}
