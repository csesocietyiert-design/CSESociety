import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const billsCookieName = 'cse_bills_access';
const fundsCookieName = 'cse_funds_access';
const accessDurationSeconds = 60 * 60 * 2;

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

function createAccessCookie(cookieName: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + accessDurationSeconds;
  const value = String(expiresAt);
  const token = `${value}.${sign(value)}`;
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${accessDurationSeconds}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

function hasAccess(request: Request, cookieName: string) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!token) return false;

  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(sign(expiresAt));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createBillsAccessCookie() {
  return createAccessCookie(billsCookieName);
}

export function hasBillsAccess(request: Request) {
  return hasAccess(request, billsCookieName);
}

export function createFundsAccessCookie() {
  return createAccessCookie(fundsCookieName);
}

export function hasFundsAccess(request: Request) {
  return hasAccess(request, fundsCookieName);
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
