import { supabase } from './supabase';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return hashedPassword;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const bcrypt = await import('bcryptjs');
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    return false;
  }
}

export async function generateCSEId(admissionYear: number): Promise<string> {
  const currentYear = new Date().getFullYear();
  const currentSession = currentYear % 100;
  
  const { data, error } = await supabase
    .from('cse_id_counter')
    .select('session_num, sequence_num')
    .eq('year', admissionYear)
    .single();

  if (error) {
    await supabase
      .from('cse_id_counter')
      .insert([{ year: admissionYear, session_num: currentSession, sequence_num: 1 }]);
    return `${String(admissionYear).slice(-2)}${String(currentSession).padStart(2, '0')}01`;
  }

  const nextSequence = (data?.sequence_num || 0) + 1;

  await supabase
    .from('cse_id_counter')
    .update({ 
      session_num: currentSession, 
      sequence_num: nextSequence,
      last_updated: new Date().toISOString()
    })
    .eq('year', admissionYear);

  const yyy = String(admissionYear).slice(-2);
  const ss = String(currentSession).padStart(2, '0');
  const nn = String(nextSequence).padStart(2, '0');

  return `${yyy}${ss}${nn}`;
}
