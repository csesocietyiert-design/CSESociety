import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

export function getCircularsSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase is not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getCircularAdmin(request: Request, supabase: SupabaseClient) {
  const userId = getSessionUserId(request);
  if (!userId) return { error: 'Authentication required', status: 401 as const };

  const { data: user, error } = await supabase
    .from('users')
    .select('id, role, is_verified')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!user || user.is_verified === false) {
    return { error: 'Authentication required', status: 401 as const };
  }
  if (user.role !== 'admin') {
    return { error: 'Only admins can manage circulars', status: 403 as const };
  }

  return { id: user.id };
}

export function isCircularId(value: string) {
  return /^[a-f0-9]{32}$/.test(value);
}
