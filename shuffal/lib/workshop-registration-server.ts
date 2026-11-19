import type { SupabaseClient } from '@supabase/supabase-js';
import { WORKSHOP_REGISTRATION } from '@/lib/workshop-registration';

export async function getWorkshopRegistrationClosesAt(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from('workshop_registration_settings')
    .select('closes_at')
    .eq('event_key', WORKSHOP_REGISTRATION.key)
    .maybeSingle();

  if (error) throw error;
  if (!data || typeof data.closes_at !== 'string' || !Number.isFinite(new Date(data.closes_at).getTime())) {
    throw new Error('Workshop deadline settings are missing or invalid. Apply migration 042_workshop_registration_settings.sql.');
  }
  return data.closes_at;
}
