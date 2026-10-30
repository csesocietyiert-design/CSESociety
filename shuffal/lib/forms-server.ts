import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';
import { normalizeFormRole } from '@/lib/forms';

export interface FormSessionUser {
  id: string;
  role: string;
}

export function getFormsSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase is not configured');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getFormSessionUser(
  request: Request,
  supabase: SupabaseClient
): Promise<FormSessionUser | null> {
  const userId = getSessionUserId(request);
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, role, is_verified')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.is_verified === false) return null;

  return { id: data.id as string, role: normalizeFormRole(String(data.role || '')) };
}

export function isValidEndDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidResourceUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
