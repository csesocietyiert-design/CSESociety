import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';

const attendanceManagerRoles = new Set([
  'general_secretary',
  'cultural_secretary',
  'technical_secretary',
]);

export type AttendanceActor = {
  supabase: SupabaseClient;
  userId: string;
  role: string;
};

export async function getAttendanceActor(
  request: Request
): Promise<{ actor: AttendanceActor; error?: never } | { actor?: never; error: NextResponse }> {
  const userId = getSessionUserId(request);
  if (!userId) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { error: NextResponse.json({ error: 'Database not configured' }, { status: 503 }) };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: user, error } = await supabase
    .from('users')
    .select('id, role, is_verified')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error verifying attendance user:', error);
    return { error: NextResponse.json({ error: 'Unable to verify user' }, { status: 500 }) };
  }
  if (!user || user.is_verified === false) {
    return { error: NextResponse.json({ error: 'A verified account is required' }, { status: 403 }) };
  }

  return { actor: { supabase, userId: user.id, role: String(user.role).toLowerCase() } };
}

export function canManageAttendance(role: string) {
  return attendanceManagerRoles.has(role);
}

export function isValidAttendanceDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
