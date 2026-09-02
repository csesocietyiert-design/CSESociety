import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const allCardRoles = new Set([
  'admin',
  'general_secretary',
  'cultural_secretary',
  'technical_secretary',
  'treasurer',
]);

export async function GET(request: Request) {
  const viewerId = getSessionUserId(request);
  const targetSocietyId = new URL(request.url).searchParams.get('societyId')?.trim();
  if (!viewerId || !targetSocietyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: viewer, error: viewerError } = await supabase
    .from('users')
    .select('role, year, cse_id')
    .eq('id', viewerId)
    .maybeSingle();
  if (viewerError) return Response.json({ error: viewerError.message }, { status: 500 });
  if (!viewer) return Response.json({ error: 'User not found' }, { status: 404 });

  const { data: target, error: targetError } = await supabase
    .from('users')
    .select('email, year, cse_id')
    .eq('cse_id', targetSocietyId)
    .maybeSingle();
  if (targetError) return Response.json({ error: targetError.message }, { status: 500 });
  if (!target) return Response.json({ error: 'Member not found' }, { status: 404 });

  const isYearRepresentative = viewer.role === 'year_representative' || viewer.role === 'yearRep';
  const canViewTarget = allCardRoles.has(viewer.role)
    || (isYearRepresentative && viewer.year === target.year)
    || (viewer.role === 'member' && viewer.cse_id === target.cse_id);
  if (!canViewTarget) return Response.json({ error: 'You are not allowed to view this ID card' }, { status: 403 });

  const { data: profile, error: profileError } = await supabase
    .from('membership')
    .select('id_card, society_id')
    .eq('society_id', target.cse_id)
    .or(`email_address.eq.${target.email},email_address_secondary.eq.${target.email}`)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

  return Response.json({ idCard: profile?.id_card || null, societyId: profile?.society_id || target.cse_id });
}
