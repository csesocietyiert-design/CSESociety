import { createHmac, timingSafeEqual } from 'node:crypto';

const cookieName = 'cse_session';
const sessionDurationSeconds = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SESSION_SECRET is required in production');
  }
  return secret || 'development-session-secret';
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createSessionCookie(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const value = `${userId}.${expiresAt}`;
  const token = `${value}.${sign(value)}`;
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionDurationSeconds}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function getSessionUserId(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!token) return null;

  const [userId, expiresAt, signature] = token.split('.');
  if (!userId || !expiresAt || !signature || Number(expiresAt) < Math.floor(Date.now() / 1000)) return null;
  const expectedSignature = sign(`${userId}.${expiresAt}`);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  return userId;
}

export function clearSessionCookie() {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
