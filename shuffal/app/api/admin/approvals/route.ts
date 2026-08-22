import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const demoAdminId = '70cb33d8-74ec-4bd7-be8c-3230accb9c5b';
const demoAdminCseId = 'iertcse';

function getSupabase() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findAdmin(supabase: ReturnType<typeof getSupabase>, adminId: string) {
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
    const { userId, adminId } = await request.json();
    const supabase = getSupabase();

    if (!supabase) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    if (!userId || !adminId) return Response.json({ error: 'Member ID and admin ID are required' }, { status: 400 });

    const admin = await findAdmin(supabase, String(adminId));
    if (!admin || !['admin', 'faculty'].includes(String(admin.role).toLowerCase()) || admin.is_verified === false) {
      return Response.json({ error: 'Only a verified admin or faculty user can approve members' }, { status: 403 });
    }

    const { data: member, error: memberError } = await supabase
      .from('users')
      .select('id, is_verified')
      .eq('id', userId)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member) return Response.json({ error: 'Member was not found' }, { status: 404 });
    if (member.is_verified) return Response.json({ success: true, alreadyVerified: true });

    const approvalUpdate: { is_verified: boolean; verified_at: string; verified_by?: string; updated_at: string } = {
      is_verified: true,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (admin?.id) approvalUpdate.verified_by = admin.id;

    const { error: updateError } = await supabase
      .from('users')
      .update(approvalUpdate)
      .eq('id', userId)
      .eq('is_verified', false);

    if (updateError) {
      console.error('Member approval update error:', updateError);
      return Response.json({ error: `Could not approve member: ${updateError.message}` }, { status: 409 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Member approval error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Member approval failed' }, { status: 500 });
  }
}
