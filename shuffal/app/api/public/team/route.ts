import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [{ data: users, error: usersError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('is_verified', true)
      .order('created_at', { ascending: false }),
    supabase.from('membership').select('society_id, email_address, email_address_secondary, student_photograph'),
  ]);

  if (usersError) return Response.json({ error: usersError.message }, { status: 500 });
  if (membershipsError) return Response.json({ error: membershipsError.message }, { status: 500 });

  const members = (users || []).filter(
    (user) => !['member', 'admin'].includes(user.role?.toLowerCase() || ''),
  ).map((user) => {
    const email = user.email.trim().toLowerCase();
    const membership = (memberships || []).find((candidate) =>
      (!candidate.society_id?.trim() || candidate.society_id.trim() === user.cse_id.trim())
      && (
        candidate.email_address?.trim().toLowerCase() === email
        || candidate.email_address_secondary?.trim().toLowerCase() === email
      )
      && candidate.student_photograph,
    );

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      year: user.year,
      department: user.department,
      bio: user.bio,
      profile_image_url: user.profile_image_url || membership?.student_photograph || null,
      is_verified: user.is_verified,
    };
  });

  return Response.json({ members });
}
