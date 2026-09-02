import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const [{ data: users, error: usersError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from('users').select('id, cse_id, email'),
    supabase.from('membership').select('society_id, email_address, email_address_secondary, student_photograph'),
  ]);

  if (usersError) return Response.json({ error: usersError.message }, { status: 500 });
  if (membershipsError) return Response.json({ error: membershipsError.message }, { status: 500 });

  const photos: Record<string, string> = {};
  for (const user of users || []) {
    const email = user.email.toLowerCase();
    const membership = (memberships || []).find((candidate) =>
      candidate.society_id === user.cse_id
      && (candidate.email_address?.toLowerCase() === email || candidate.email_address_secondary?.toLowerCase() === email)
      && candidate.student_photograph,
    );
    if (membership?.student_photograph) photos[user.id] = membership.student_photograph;
  }

  return Response.json({ photos });
}
