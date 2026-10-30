import { NextResponse } from 'next/server';
import { isEventRegistrationOpen } from '@/lib/event-registration';
import {
  createEventSupabase,
  createVerificationToken,
  hashEventOtp,
  maskEmail,
  secureStringEquals,
} from '@/lib/event-registration-server';

export async function POST(request: Request) {
  if (!isEventRegistrationOpen()) {
    return NextResponse.json({ error: 'Event registration is closed.' }, { status: 410 });
  }

  let body: { societyId?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const societyId = typeof body.societyId === 'string' ? body.societyId.trim() : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!/^[A-Z0-9-]{3,20}$/i.test(societyId) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'The Society ID or verification code is invalid.' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createEventSupabase();
  } catch (error) {
    console.error('Event OTP verification database configuration error:', error);
    return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
  }

  const now = new Date();
  const { data: member, error: memberError } = await supabase
    .from('users')
    .select('id, cse_id, name, email, phone, department, year, is_verified')
    .ilike('cse_id', societyId)
    .maybeSingle();
  if (memberError) {
    console.error('Event OTP member lookup failed:', memberError);
    return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
  }
  if (!member || member.is_verified !== true || !member.email) {
    return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });
  }

  const canonicalSocietyId = member.cse_id;
  const { data: otp, error: otpError } = await supabase
    .from('esports_event_registration_otps')
    .select('code_hash, expires_at, attempts, verified_at, used_at')
    .eq('society_id', canonicalSocietyId)
    .maybeSingle();
  if (otpError) {
    console.error('Event OTP verification lookup failed:', otpError);
    return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
  }

  if (
    !otp
    || otp.used_at
    || otp.verified_at
    || otp.attempts >= 5
    || new Date(otp.expires_at).getTime() <= now.getTime()
  ) {
    return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });
  }

  const expectedHash = hashEventOtp(canonicalSocietyId, code);
  if (!secureStringEquals(otp.code_hash, expectedHash)) {
    const { error: attemptError } = await supabase
      .from('esports_event_registration_otps')
      .update({ attempts: otp.attempts + 1, updated_at: now.toISOString() })
      .eq('society_id', canonicalSocietyId)
      .is('verified_at', null)
      .is('used_at', null);
    if (attemptError) {
      console.error('Event OTP attempt could not be recorded:', attemptError);
      return NextResponse.json({ error: 'Could not verify the code. Please try again.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });
  }

  const token = createVerificationToken();
  const { data: updatedOtp, error: updateError } = await supabase
    .from('esports_event_registration_otps')
    .update({
      verified_at: now.toISOString(),
      verified_token_hash: hashEventOtp(canonicalSocietyId, token),
      updated_at: now.toISOString(),
    })
    .eq('society_id', canonicalSocietyId)
    .eq('code_hash', otp.code_hash)
    .is('verified_at', null)
    .is('used_at', null)
    .select('society_id')
    .maybeSingle();
  if (updateError) {
    console.error('Event OTP could not be marked verified:', updateError);
    return NextResponse.json({ error: 'Could not verify the code. Please try again.' }, { status: 500 });
  }
  if (!updatedOtp) return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });

  return NextResponse.json({
    verificationToken: token,
    member: {
      societyId: member.cse_id,
      name: member.name,
      email: member.email,
      maskedEmail: maskEmail(member.email),
      phone: member.phone || '',
      department: member.department || 'CSE',
      year: member.year,
    },
  });
}
