import nodemailer from 'nodemailer';
import {
  createEventOtp,
  createEventSupabase,
  createVerificationToken,
  hashEventOtp,
  maskEmail,
  OTP_VALIDITY_MS,
  secureStringEquals,
} from '@/lib/event-registration-server';

export const TECHNICAL_WORKSHOP_FEEDBACK_EVENT_KEY = 'technical-workshop-meetup-2026';
export const FEEDBACK_OTP_VALIDITY_MS = OTP_VALIDITY_MS;
export const FEEDBACK_VERIFICATION_VALIDITY_MS = 30 * 60_000;

export {
  createEventOtp,
  createEventSupabase,
  createVerificationToken,
  hashEventOtp,
  maskEmail,
  secureStringEquals,
};

export function getFeedbackIdentityKey(societyId: string): string {
  return `technical-workshop-feedback:${societyId}`;
}

export async function sendTechnicalWorkshopFeedbackOtp(
  email: string,
  name: string,
  otp: string,
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
  await transporter.sendMail({
    from,
    to: email,
    subject: 'CSE Society Technical Workshop feedback verification code',
    text: `Hello ${name}, your CSE Society Technical Workshop feedback verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Your CSE Society Technical Workshop feedback verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request it, you can ignore this message.</p>`,
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
