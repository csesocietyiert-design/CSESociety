import { NextResponse } from 'next/server';
import {
  createEventOtp,
  createEventSupabase,
  FEEDBACK_OTP_VALIDITY_MS,
  getFeedbackIdentityKey,
  hashEventOtp,
  sendTechnicalWorkshopFeedbackOtp,
} from '@/lib/technical-workshop-feedback-server';

const genericResponse = () => NextResponse.json({
  message: 'If this verified Society ID exists, a verification code has been sent to its registered email.',
});

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
  const body = payload as { societyId?: unknown };

  const societyId = typeof body.societyId === 'string' ? body.societyId.trim().toUpperCase() : '';
  if (!/^[A-Z0-9]{7}$/.test(societyId)) {
    return NextResponse.json({ error: 'Enter a valid 7-character CSE Society ID.' }, { status: 400 });
  }

  let supabase: ReturnType<typeof createEventSupabase>;
  try {
    supabase = createEventSupabase();
  } catch (error) {
    console.error('Technical workshop feedback OTP database configuration error:', error);
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
  if (!member || member.is_verified !== true || !member.email) return genericResponse();

  const canonicalSocietyId = String(member.cse_id).toUpperCase();
  const identityKey = getFeedbackIdentityKey(canonicalSocietyId);
  const now = new Date();
  const { data: previous, error: previousError } = await supabase
    .from('technical_workshop_feedback_otps')
    .select('last_sent_at')
    .eq('society_id', canonicalSocietyId)
    .maybeSingle();
  if (previousError) {
    console.error('Technical workshop feedback OTP cooldown lookup failed:', previousError);
    return NextResponse.json({ error: 'Could not start member verification.' }, { status: 503 });
  }
  if (previous?.last_sent_at && now.getTime() - new Date(previous.last_sent_at).getTime() < 60_000) {
    return genericResponse();
  }

  const code = createEventOtp();
  const { error: saveError } = await supabase
    .from('technical_workshop_feedback_otps')
    .upsert({
      society_id: canonicalSocietyId,
      member_user_id: member.id,
      code_hash: hashEventOtp(identityKey, code),
      expires_at: new Date(now.getTime() + FEEDBACK_OTP_VALIDITY_MS).toISOString(),
      last_sent_at: now.toISOString(),
      attempts: 0,
      verified_at: null,
      verified_token_hash: null,
      used_at: null,
      updated_at: now.toISOString(),
    });
  if (saveError) {
    console.error('Technical workshop feedback OTP could not be stored:', saveError);
    return NextResponse.json({ error: 'Could not start member verification.' }, { status: 500 });
  }

  try {
    await sendTechnicalWorkshopFeedbackOtp(member.email, member.name || 'CSE Society member', code);
  } catch (emailError) {
    console.error('Technical workshop feedback OTP email delivery failed:', emailError);
    const { error: invalidateError } = await supabase
      .from('technical_workshop_feedback_otps')
      .update({ expires_at: now.toISOString(), updated_at: now.toISOString() })
      .eq('society_id', canonicalSocietyId);
    if (invalidateError) console.error('Undelivered feedback OTP could not be invalidated:', invalidateError);
    return NextResponse.json({ error: 'Could not send the verification email. Please try again later.' }, { status: 503 });
  }

  return genericResponse();
}
