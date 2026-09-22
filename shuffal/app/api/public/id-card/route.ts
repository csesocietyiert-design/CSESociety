import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  const societyId = new URL(request.url).searchParams.get('id')?.trim();

  if (!societyId) {
    return Response.json({ error: 'Society ID is required' }, { status: 400 });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: member, error } = await supabase
    .from('users')
    .select('name, cse_id, department, year, is_verified, email')
    .eq('cse_id', societyId)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!member || member.is_verified === false) {
    return Response.json({ error: 'Verified member not found' }, { status: 404 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('membership')
    .select('student_photograph')
    .eq('society_id', member.cse_id)
    .or(`email_address.eq.${member.email},email_address_secondary.eq.${member.email}`)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

  return Response.json({
    name: member.name,
    societyId: member.cse_id,
    department: member.department || 'Computer Science & Engineering',
    year: member.year || null,
    profileImage: profile?.student_photograph || null,
    verified: true,
  });
}