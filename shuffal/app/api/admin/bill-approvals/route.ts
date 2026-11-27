import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getAdmin(request: Request) {
  const supabase = getSupabase();
  const userId = getSessionUserId(request);
  if (!supabase || !userId) return null;
  const { data: user } = await supabase
    .from('users')
    .select('id, role, is_verified')
    .eq('id', userId)
    .maybeSingle();
  if (!user || user.is_verified === false || String(user.role).toLowerCase() !== 'admin') return null;
  return { supabase, user };
}

export async function GET(request: Request) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { data, error } = await admin.supabase
    .from('finance_entries')
    .select('id, entry_type, title, amount, event_name, entry_date, description, details, bill_link, created_by, created_at')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = await Promise.all((data || []).map(async (entry) => {
    if (!entry.bill_link?.startsWith('bills/')) return entry;
    const { data: signed } = await admin.supabase.storage
      .from('society-bills')
      .createSignedUrl(entry.bill_link, 60 * 60);
    return { ...entry, bill_link: signed?.signedUrl || null };
  }));

  return NextResponse.json({ entries });
}

export async function PATCH(request: Request) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const body = await request.json();
  const entryId = typeof body.entryId === 'string' ? body.entryId.trim() : '';
  const decision = body.decision === 'approved' || body.decision === 'rejected' ? body.decision : '';
  if (!entryId || !decision) return NextResponse.json({ error: 'Entry ID and decision are required' }, { status: 400 });

  const { data: entry, error: entryError } = await admin.supabase
    .from('finance_entries')
    .select('id, bill_link')
    .eq('id', entryId)
    .eq('approval_status', 'pending')
    .maybeSingle();
  if (entryError) return NextResponse.json({ error: entryError.message }, { status: 500 });
  if (!entry) return NextResponse.json({ error: 'Pending bill entry not found' }, { status: 404 });

  if (decision === 'approved') {
    const { data, error } = await admin.supabase
      .from('finance_entries')
      .update({
        approval_status: 'approved',
        approved_by: admin.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .eq('approval_status', 'pending')
      .select('*')
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Entry was already reviewed' }, { status: 409 });
    return NextResponse.json({ entry: data });
  }

  const { data: deleted, error } = await admin.supabase
    .from('finance_entries')
    .delete()
    .eq('id', entryId)
    .eq('approval_status', 'pending')
    .select('id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted) return NextResponse.json({ error: 'Entry was already reviewed' }, { status: 409 });

  if (typeof entry.bill_link === 'string' && entry.bill_link.startsWith('bills/')) {
    await admin.supabase.storage.from('society-bills').remove([entry.bill_link]);
  }
  return NextResponse.json({ ok: true });
}
