import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (userError) return Response.json({ error: userError.message }, { status: 500 });
  const allowedRoles = ['admin', 'faculty', 'executive', 'vice_president', 'general_secretary', 'technical_secretary', 'cultural_secretary', 'secretary', 'year_representative', 'yearrep'];
  if (!user || !allowedRoles.includes(String(user.role || '').toLowerCase())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: members, error: membersError } = await supabase
    .from('membership')
    .select('*');

  if (membersError) return Response.json({ error: membersError.message }, { status: 500 });
  return Response.json({ members: members || [] });
}
