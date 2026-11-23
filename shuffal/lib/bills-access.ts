import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const billsCookieName = 'cse_bills_access';
const billsAccessDurationSeconds = 60 * 60 * 2;

function getSigningSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SESSION_SECRET is required in production');
  }
  return secret || 'development-session-secret';
}

function sign(value: string) {
  return createHmac('sha256', getSigningSecret()).update(value).digest('base64url');
}

export function createBillsAccessCookie() {
  const expiresAt = Math.floor(Date.now() / 1000) + billsAccessDurationSeconds;
  const value = String(expiresAt);
  const token = `${value}.${sign(value)}`;
  return `${billsCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${billsAccessDurationSeconds}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function hasBillsAccess(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${billsCookieName}=`))
    ?.slice(billsCookieName.length + 1);
  if (!token) return false;

  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(sign(expiresAt));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function secureBillsPasswordEquals(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

export async function isBillsRequesterMember(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase is not configured');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;

  return String(user?.role || '').trim().toLowerCase() === 'member';
}

export function createBillsSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase is not configured');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
