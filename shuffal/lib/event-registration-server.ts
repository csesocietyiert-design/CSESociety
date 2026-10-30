import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';

export const EVENT_REGISTRATION_MANAGER_ROLES = new Set([
  'admin',
  'general_secretary',
  'technical_secretary',
  'cultural_secretary',
  'secretary',
]);

type EventRegistrationManagerResult =
  | { supabase: SupabaseClient; managerId: string; error: null }
  | { supabase: null; managerId: null; error: NextResponse };

export function createEventSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase is not configured');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getEventRegistrationManager(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return {
      supabase: null,
      managerId: null,
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    } satisfies EventRegistrationManagerResult;
  }

  let supabase: SupabaseClient;
  try {
    supabase = createEventSupabase();
  } catch (error) {
    console.error('Event registration database configuration error:', error);
    return {
      supabase: null,
      managerId: null,
      error: NextResponse.json({ error: 'Database is not configured' }, { status: 503 }),
    } satisfies EventRegistrationManagerResult;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, role, is_verified')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error verifying event registration manager:', error);
    return {
      supabase: null,
      managerId: null,
      error: NextResponse.json({ error: 'Unable to verify dashboard account' }, { status: 500 }),
    } satisfies EventRegistrationManagerResult;
  }
  if (!user || user.is_verified === false) {
    return {
      supabase: null,
      managerId: null,
      error: NextResponse.json({ error: 'A verified dashboard account is required' }, { status: 403 }),
    } satisfies EventRegistrationManagerResult;
  }
  if (!EVENT_REGISTRATION_MANAGER_ROLES.has(String(user.role).toLowerCase())) {
    return {
      supabase: null,
      managerId: null,
      error: NextResponse.json({ error: 'You do not have permission to manage event registrations' }, { status: 403 }),
    } satisfies EventRegistrationManagerResult;
  }

  return { supabase, managerId: String(user.id), error: null } satisfies EventRegistrationManagerResult;
}

function getOtpPepper(): string {
  const pepper = process.env.EVENT_OTP_PEPPER || process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pepper) throw new Error('Event OTP secret is not configured');
  return pepper;
}

export function hashEventOtp(societyId: string, value: string): string {
  return createHmac('sha256', getOtpPepper()).update(`${societyId}:${value}`).digest('hex');
}

export function hashEventPassToken(registrationId: string, token: string): string {
  return createHmac('sha256', getOtpPepper()).update(`pass:${registrationId}:${token}`).digest('hex');
}

export function secureStringEquals(first: string, second: string): boolean {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

export function createVerificationToken(): string {
  return randomBytes(32).toString('base64url');
}

export function createEventOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'your registered email';
  return `${name.slice(0, 1)}${'*'.repeat(Math.max(2, name.length - 1))}@${domain}`;
}

export async function sendEventOtp(email: string, name: string, otp: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  if (!host || !Number.isInteger(port) || !user || !password || !from) {
    throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM must be configured');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Your CSE Society event registration code',
    text: `Hello ${name}, your verification code is ${otp}. It expires in 5 minutes. If you did not request this code, you can ignore this message.`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Your CSE Society event registration code is <strong>${otp}</strong>.</p><p>This code expires in 5 minutes. If you did not request it, you can ignore this message.</p>`,
  });
}

export async function sendEventRegistrationNotice(
  email: string,
  name: string,
  registrationId: string,
  feeAmount: number,
  deliveryMethod: 'email' | 'whatsapp',
  participantType: 'member' | 'non_member',
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  if (!host || !Number.isInteger(port) || !user || !password || !from) {
    throw new Error('SMTP settings are not configured');
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });
  const instructions = participantType === 'member'
    ? 'Bring your CSE Society ID card for entry. Society members do not receive a separate entry pass.'
    : `Your entry-pass update will be shared through ${deliveryMethod === 'email' ? 'email' : 'WhatsApp'} after the registration is checked. Keep your payment transaction ID for reference.`;
  await transporter.sendMail({
    from,
    to: email,
    subject: 'CSE Society E-Sports registration received',
    text: `Hello ${name}, your registration (${registrationId}) has been received. Amount recorded: ₹${feeAmount}. ${instructions}`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Your E-Sports registration has been received.</p><p>Registration reference: <strong>${escapeHtml(registrationId)}</strong><br>Amount recorded: ₹${feeAmount}</p><p>${escapeHtml(instructions)}</p>`,
  });
}

export async function sendEventPassEmail(email: string, name: string, passUrl: string, registrationId: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  if (!host || !Number.isInteger(port) || !user || !password || !from) {
    throw new Error('SMTP settings are not configured');
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Your CSE Society E-Sports entry pass',
    text: `Hello ${name}, your entry pass is ready. Open or print it here: ${passUrl}. Registration reference: ${registrationId}.`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Your CSE Society E-Sports entry pass is ready.</p><p><a href="${escapeHtml(passUrl)}">Open or print your entry pass</a></p><p>Registration reference: <strong>${escapeHtml(registrationId)}</strong></p>`,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}
