import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function getAdmin(request: Request) {
  const supabase = getSupabase();
  const userId = getSessionUserId(request);
  if (!supabase || !userId) return null;
  const { data } = await supabase.from('users').select('id, role, is_verified').eq('id', userId).maybeSingle();
  return data?.role === 'admin' && data.is_verified !== false ? { supabase, user: data } : null;
}

export async function GET(request: Request) {
  const access = await getAdmin(request);
  if (!access) return Response.json({ error: 'Only a verified admin can review events' }, { status: 403 });
  const { data, error } = await access.supabase.from('events').select('*').eq('approval_status', 'pending').order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ events: data || [] });
}

export async function PATCH(request: Request) {
  const access = await getAdmin(request);
  if (!access) return Response.json({ error: 'Only a verified admin can review events' }, { status: 403 });
  const { eventId, decision } = await request.json();
  if (!eventId || !['approved', 'rejected'].includes(decision)) return Response.json({ error: 'Event and valid decision are required' }, { status: 400 });

  const update = decision === 'approved'
    ? { approval_status: 'approved', approved_by: access.user.id, approved_at: new Date().toISOString() }
    : { approval_status: 'rejected', approved_by: access.user.id, approved_at: new Date().toISOString() };
  const { error } = await access.supabase.from('events').update(update).eq('id', eventId).eq('approval_status', 'pending');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
