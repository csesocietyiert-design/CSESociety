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
    .select('cse_id')
    .eq('id', userId)
    .maybeSingle();

  if (userError) return Response.json({ error: userError.message }, { status: 500 });
  if (!user?.cse_id) return Response.json({ profileImage: null });

  const { data: membership, error: membershipError } = await supabase
    .from('membership')
    .select('student_photograph')
    .eq('society_id', user.cse_id)
    .limit(1)
    .maybeSingle();

  if (membershipError) return Response.json({ error: membershipError.message }, { status: 500 });
  return Response.json({ profileImage: membership?.student_photograph || null });
}
