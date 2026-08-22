import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const demoAdminId = '70cb33d8-74ec-4bd7-be8c-3230accb9c5b';
const demoAdminCseId = 'iertcse';

function getSupabase() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function findAdmin(supabase: ReturnType<typeof getSupabase>, adminId: string) {
  if (!supabase) return null;
  const { data: byId } = await supabase.from('users').select('id, role, is_verified').eq('id', adminId).maybeSingle();
  if (byId) return byId;
  if (adminId !== demoAdminId) return null;
  const { data: byCseId } = await supabase.from('users').select('id, role, is_verified').eq('cse_id', demoAdminCseId).maybeSingle();
  return byCseId;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const adminId = params.get('adminId');
    const cseId = params.get('cseId')?.trim();
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    if (!adminId || !cseId) return Response.json({ error: 'Admin ID and student CSE ID are required' }, { status: 400 });

    const admin = await findAdmin(supabase, adminId);
    if (!admin || admin.role !== 'admin' || admin.is_verified === false) return Response.json({ error: 'Only a verified admin can change member passwords' }, { status: 403 });

    const { data: user, error } = await supabase.from('users').select('id, cse_id, name, email, role, year, department, is_verified').eq('cse_id', cseId).maybeSingle();
    if (error) return Response.json({ error: 'Could not search students' }, { status: 500 });
    if (!user) return Response.json({ error: 'No student found with that CSE ID' }, { status: 404 });
    return Response.json({ user });
  } catch (error) {
    console.error('Admin password lookup error:', error);
    return Response.json({ error: 'Student lookup failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { adminId, targetUserId, newPassword } = await request.json();
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    if (!adminId || !targetUserId || typeof newPassword !== 'string' || newPassword.length < 6) return Response.json({ error: 'Admin ID, target user, and a password of at least 6 characters are required' }, { status: 400 });

    const admin = await findAdmin(supabase, adminId);
    if (!admin || admin.role !== 'admin' || admin.is_verified === false) return Response.json({ error: 'Only a verified admin can change member passwords' }, { status: 403 });

    const passwordHash = await hashPassword(newPassword);
    const { error: updateError } = await supabase.from('users').update({ password_hash: passwordHash, updated_at: new Date().toISOString() }).eq('id', targetUserId);
    if (updateError) return Response.json({ error: `Could not update password: ${updateError.message}` }, { status: 500 });

    const { error: logError } = await supabase.from('password_change_logs').insert({ user_id: targetUserId, changed_by: admin.id });
    if (logError) return Response.json({ error: `Password updated, but audit log failed: ${logError.message}` }, { status: 500 });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Admin password update error:', error);
    return Response.json({ error: 'Admin password update failed' }, { status: 500 });
  }
}
