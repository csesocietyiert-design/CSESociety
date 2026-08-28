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
    .select('cse_id, email')
    .eq('id', userId)
    .maybeSingle();

  if (userError) return Response.json({ error: userError.message }, { status: 500 });
  if (!user?.cse_id) return Response.json({ profileImage: null });

  const { data: profile, error: profileError } = await supabase
    .from('membership')
    .select('student_photograph')
    .eq('society_id', user.cse_id)
    .limit(1)
    .maybeSingle();
  if (profileError) return Response.json({ error: profileError.message }, { status: 500 });
  if (profile?.student_photograph) return Response.json({ profileImage: profile.student_photograph });

  const { data: secondaryEmailMatch, error: secondaryEmailError } = await supabase
    .from('membership')
    .select('student_photograph')
    .eq('email_address_secondary', user.email)
    .limit(1)
    .maybeSingle();
  if (secondaryEmailError) return Response.json({ error: secondaryEmailError.message }, { status: 500 });
  if (secondaryEmailMatch?.student_photograph) return Response.json({ profileImage: secondaryEmailMatch.student_photograph });

  const { data: primaryEmailMatch, error: primaryEmailError } = await supabase
    .from('membership')
    .select('student_photograph')
    .eq('email_address', user.email)
    .limit(1)
    .maybeSingle();
  if (primaryEmailError) return Response.json({ error: primaryEmailError.message }, { status: 500 });
  return Response.json({ profileImage: primaryEmailMatch?.student_photograph || null });
}
