import { NextResponse } from 'next/server';
import { isEventRegistrationOpen } from '@/lib/event-registration';
import {
  createEventOtp,
  createEventSupabase,
  hashEventOtp,
  sendEventOtp,
} from '@/lib/event-registration-server';

const genericResponse = () => NextResponse.json({
  message: 'If the verified Society ID is eligible, a code has been sent to its registered email.',
});

export async function POST(request: Request) {
  if (!isEventRegistrationOpen()) {
    return NextResponse.json({ error: 'Event registration is closed.' }, { status: 410 });
  }

  let body: { societyId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const societyId = typeof body.societyId === 'string' ? body.societyId.trim() : '';
  if (!/^[A-Z0-9-]{3,20}$/i.test(societyId)) {
    return NextResponse.json({ error: 'Enter a valid Society ID.' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createEventSupabase();
  } catch (error) {
    console.error('Event OTP database configuration error:', error);
    return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
  }

  const { data: member, error: memberError } = await supabase
    .from('users')
    .select('cse_id, name, email, is_verified')
    .ilike('cse_id', societyId)
    .maybeSingle();

  if (memberError) {
    console.error('Event OTP member lookup failed:', memberError);
    return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
  }
  if (!member || member.is_verified !== true || !member.email) return genericResponse();

  const now = new Date();
  const { data: previous, error: previousError } = await supabase
    .from('event_registration_otps')
    .select('last_sent_at')
    .eq('society_id', member.cse_id)
    .maybeSingle();
  if (previousError) {
    console.error('Event OTP cooldown lookup failed:', previousError);
    return NextResponse.json({ error: 'Could not start member verification.' }, { status: 500 });
  }

  if (previous?.last_sent_at && now.getTime() - new Date(previous.last_sent_at).getTime() < 60_000) {
    return genericResponse();
  }

  const code = createEventOtp();
  const { error: saveError } = await supabase
    .from('event_registration_otps')
    .upsert({
      society_id: member.cse_id,
      code_hash: hashEventOtp(member.cse_id, code),
      expires_at: new Date(now.getTime() + 5 * 60_000).toISOString(),
      last_sent_at: now.toISOString(),
      attempts: 0,
      verified_at: null,
      verified_token_hash: null,
      used_at: null,
      updated_at: now.toISOString(),
    });
  if (saveError) {
    console.error('Event OTP could not be stored:', saveError);
    return NextResponse.json({ error: 'Could not start member verification.' }, { status: 500 });
  }

  try {
    await sendEventOtp(member.email, member.name, code);
  } catch (mailError) {
    console.error('Event OTP email delivery failed:', mailError);
    const { error: invalidateError } = await supabase
      .from('event_registration_otps')
      .update({ expires_at: now.toISOString(), updated_at: now.toISOString() })
      .eq('society_id', member.cse_id);
    if (invalidateError) console.error('Failed to invalidate undelivered event OTP:', invalidateError);
    return NextResponse.json({ error: 'Could not send the verification email. Please try again later.' }, { status: 503 });
  }

  return genericResponse();
}
