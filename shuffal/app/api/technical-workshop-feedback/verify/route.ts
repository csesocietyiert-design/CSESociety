import { NextResponse } from 'next/server';
import {
  createEventSupabase,
  createVerificationToken,
  FEEDBACK_VERIFICATION_VALIDITY_MS,
  getFeedbackIdentityKey,
  hashEventOtp,
  maskEmail,
  secureStringEquals,
  TECHNICAL_WORKSHOP_FEEDBACK_EVENT_KEY,
} from '@/lib/technical-workshop-feedback-server';

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const body = payload as { societyId?: unknown; code?: unknown };

  const societyId = typeof body.societyId === 'string' ? body.societyId.trim().toUpperCase() : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!/^[A-Z0-9]{7}$/.test(societyId) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'The CSE Society ID or verification code is invalid.' }, { status: 400 });
  }

  let supabase: ReturnType<typeof createEventSupabase>;
  try {
    supabase = createEventSupabase();
  } catch (error) {
    console.error('Technical workshop feedback verification database configuration error:', error);
    return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
  }

  const { data: member, error: memberError } = await supabase
    .from('users')
    .select('id,cse_id,name,email,is_verified')
    .ilike('cse_id', societyId)
    .maybeSingle();
  if (memberError) {
    console.error('Technical workshop feedback member lookup failed:', memberError);
    return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
  }
  if (!member || member.is_verified !== true || !member.email) {
    return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });
  }

  const canonicalSocietyId = String(member.cse_id).toUpperCase();
  const { data: otp, error: otpError } = await supabase
    .from('technical_workshop_feedback_otps')
    .select('code_hash,expires_at,attempts,verified_at,used_at')
    .eq('society_id', canonicalSocietyId)
    .maybeSingle();
  if (otpError) {
    console.error('Technical workshop feedback OTP lookup failed:', otpError);
    return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
  }
  const now = new Date();
  if (
    !otp
    || otp.used_at
    || otp.verified_at
    || otp.attempts >= 5
    || new Date(otp.expires_at).getTime() <= now.getTime()
  ) {
    return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });
  }

  const identityKey = getFeedbackIdentityKey(canonicalSocietyId);
  if (!secureStringEquals(otp.code_hash, hashEventOtp(identityKey, code))) {
    const { error: attemptError } = await supabase
      .from('technical_workshop_feedback_otps')
      .update({ attempts: otp.attempts + 1, updated_at: now.toISOString() })
      .eq('society_id', canonicalSocietyId)
      .eq('code_hash', otp.code_hash)
      .is('verified_at', null)
      .is('used_at', null);
    if (attemptError) {
      console.error('Technical workshop feedback OTP attempt could not be recorded:', attemptError);
      return NextResponse.json({ error: 'Could not verify the code. Please try again.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'The code is invalid or expired.' }, { status: 400 });
  }

  const { data: existingFeedback, error: existingFeedbackError } = await supabase
    .from('technical_workshop_feedback')
    .select('id')
    .eq('event_key', TECHNICAL_WORKSHOP_FEEDBACK_EVENT_KEY)
    .ilike('society_id', canonicalSocietyId)
    .maybeSingle();
  if (existingFeedbackError) {
    console.error('Existing technical workshop feedback lookup failed:', existingFeedbackError);
    return NextResponse.json({ error: 'Could not check previous feedback submissions.' }, { status: 503 });
  }
  if (existingFeedback) {
    return NextResponse.json({ error: 'Feedback has already been submitted for this Society ID.' }, { status: 409 });
  }

  const token = createVerificationToken();
  const { data: verifiedOtp, error: updateError } = await supabase
    .from('technical_workshop_feedback_otps')
    .update({
      verified_at: now.toISOString(),
      verified_token_hash: hashEventOtp(identityKey, token),
      expires_at: new Date(now.getTime() + FEEDBACK_VERIFICATION_VALIDITY_MS).toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('society_id', canonicalSocietyId)
    .eq('code_hash', otp.code_hash)
    .is('verified_at', null)
    .is('used_at', null)
    .select('society_id')
    .maybeSingle();
  if (updateError) {
    console.error('Technical workshop feedback OTP could not be marked verified:', updateError);
    return NextResponse.json({ error: 'Could not verify the code. Please try again.' }, { status: 503 });
  }
  if (!verifiedOtp) return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });

  return NextResponse.json({
    verificationToken: token,
    member: {
      societyId: canonicalSocietyId,
      name: member.name || 'CSE Society member',
      maskedEmail: maskEmail(member.email),
    },
  });
}
