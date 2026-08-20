import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const demoAdminId = '11111111-1111-4111-8111-111111111111';
const demoAdminCseId = '23F2601';

function getSupabase() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findVerifiedAdmin(supabase: ReturnType<typeof getSupabase>, adminId: string) {
  if (!supabase) return null;

  const { data: admin } = await supabase
    .from('users')
    .select('id, role, is_verified')
    .eq('id', adminId)
    .maybeSingle();

  if (admin) return admin;
  if (adminId !== demoAdminId) return null;

  const { data: demoAdmin } = await supabase
    .from('users')
    .select('id, role, is_verified')
    .eq('cse_id', demoAdminCseId)
    .maybeSingle();

  return demoAdmin;
}

export async function POST(request: Request) {
  try {
    const { action = 'request', userId, newPassword, requestId, adminId } = await request.json();
    const supabase = getSupabase();

    if (!supabase) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    if (action === 'request') {
      if (!userId || typeof newPassword !== 'string' || newPassword.length < 6) {
        return Response.json({ error: 'A valid new password of at least 6 characters is required' }, { status: 400 });
      }

      const passwordHash = await hashPassword(newPassword);
      const { error } = await supabase.from('password_change_requests').insert({
        user_id: userId,
        password_hash: passwordHash,
        status: 'pending',
      });

      if (error) {
        console.error('Password request insert error:', error);
        if (error.code === 'PGRST205') {
          return Response.json({
            error: 'Password approval is not configured in Supabase. Run supabase/migrations/010_repair_account_settings_and_password_requests.sql in the Supabase SQL Editor, then refresh this page.',
          }, { status: 503 });
        }
        return Response.json({ error: `Could not create password change request: ${error.message}` }, { status: 500 });
      }

      return Response.json({ success: true, status: 'pending' });
    }

    if (!requestId || !adminId || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Request ID, admin ID, and a valid action are required' }, { status: 400 });
    }

    const admin = await findVerifiedAdmin(supabase, adminId);

    if (!admin || !['admin', 'faculty'].includes(admin.role) || admin.is_verified === false) {
      return Response.json({ error: 'Only a verified admin can review password requests' }, { status: 403 });
    }

    const { data: changeRequest, error: requestError } = await supabase
      .from('password_change_requests')
      .select('id, user_id, password_hash, status')
      .eq('id', requestId)
      .eq('status', 'pending')
      .maybeSingle();

    if (requestError || !changeRequest) {
      return Response.json({ error: 'Password change request is no longer pending' }, { status: 404 });
    }

    if (action === 'approve') {
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: changeRequest.password_hash, updated_at: new Date().toISOString() })
        .eq('id', changeRequest.user_id);

      if (updateError) {
        return Response.json({ error: 'Could not apply password change' }, { status: 500 });
      }

      await supabase.from('password_change_logs').insert({ user_id: changeRequest.user_id, changed_by: admin.id });
    }

    const { error: reviewError } = await supabase
      .from('password_change_requests')
      .update({ status: action === 'approve' ? 'approved' : 'rejected', reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (reviewError) {
      return Response.json({ error: 'Could not update request status' }, { status: 500 });
    }

    return Response.json({ success: true, status: action === 'approve' ? 'approved' : 'rejected' });
  } catch (error) {
    console.error('Password change request error:', error);
    return Response.json({ error: 'Password change request failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const adminId = new URL(request.url).searchParams.get('adminId');
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    if (!adminId) return Response.json({ error: 'Admin ID is required' }, { status: 400 });

    const admin = await findVerifiedAdmin(supabase, adminId);
    if (!admin || !['admin', 'faculty'].includes(admin.role) || admin.is_verified === false) {
      return Response.json({ error: 'Only a verified admin can view password requests' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('password_change_requests')
      .select('id, user_id, status, created_at, users!password_change_requests_user_id_fkey(name, email, cse_id)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Password request list query error:', error);
      return Response.json({ error: `Could not load password requests: ${error.message}` }, { status: 500 });
    }
    return Response.json({ requests: data || [] });
  } catch (error) {
    console.error('Password request list error:', error);
    return Response.json({ error: 'Could not load password requests' }, { status: 500 });
  }
}
