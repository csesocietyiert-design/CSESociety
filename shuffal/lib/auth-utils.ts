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
