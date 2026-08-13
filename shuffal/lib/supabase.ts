import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl && supabaseUrl.includes('supabase.co') && supabaseAnonKey && !supabaseAnonKey.includes('placeholder');

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export interface User {
  id: string;
  cseId: string;
  name: string;
  email: string;
  year: number;
  password: string;
  role: 'member' | 'admin' | 'executive' | 'secretary' | 'treasurer' | 'yearRep' | 'faculty';
  department: string;
  createdAt: string;
}
