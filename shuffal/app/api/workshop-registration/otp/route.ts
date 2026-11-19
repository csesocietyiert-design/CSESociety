import { NextResponse } from 'next/server';
import {
  createEventOtp,
  createEventSupabase,
  hashEventOtp,
  sendWorkshopOtp,
} from '@/lib/event-registration-server';
import { WORKSHOP_REGISTRATION } from '@/lib/workshop-registration';
import { getWorkshopRegistrationClosesAt } from '@/lib/workshop-registration-server';

function getEmailFailureMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Email delivery failed. Please contact the event organisers.';

  if (error.message.includes('SMTP settings are not configured')) {
    return 'Email delivery is not configured on the server. Ask the site administrator to check the production SMTP variables.';
  }

  const mailError = error as Error & { code?: string; responseCode?: number };
  if (mailError.responseCode === 535 || mailError.responseCode === 534) {
    return 'The email server rejected its login. Ask the site administrator to recheck the production SMTP username and password.';
  }
  if (mailError.responseCode && mailError.responseCode >= 500) {
    return `The email server rejected the message (SMTP ${mailError.responseCode}). Ask the site administrator to check the sender address and provider logs.`;
  }
  if (mailError.code === 'ETIMEDOUT' || mailError.code === 'ECONNECTION' || mailError.code === 'ESOCKET') {
    return 'The server could not connect to the email provider. Ask the site administrator to check the SMTP host, port, and provider availability.';
  }

  console.error('Unclassified workshop email delivery error:', mailError.code || 'unknown');
  return 'Email delivery failed. Ask the site administrator to check the production email-provider logs.';
}

export async function POST(request: Request) {
  let supabase;
  try {
    supabase = createEventSupabase();
  } catch {
    return NextResponse.json({ error: 'Verification is temporarily unavailable.' }, { status: 503 });
  }

  let closesAt: string;
  try {
    closesAt = await getWorkshopRegistrationClosesAt(supabase);
  } catch (error) {
    console.error('Workshop OTP deadline lookup failed:', error);
    return NextResponse.json({ error: 'Workshop registration is temporarily unavailable.' }, { status: 503 });
  }
  if (Date.now() >= new Date(closesAt).getTime()) {
    return NextResponse.json({ error: 'Workshop registration is closed.' }, { status: 410 });
  }

  let body: { category?: unknown; societyId?: unknown; iertEmail?: unknown; iitRollNumber?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const category = body.category;
  let identifier = '';
  let email = '';
  let name = 'Participant';

  if (category === 'society') {
    identifier = typeof body.societyId === 'string' ? body.societyId.trim().toUpperCase() : '';
    if (!/^[A-Z0-9]{7}$/.test(identifier)) {
      return NextResponse.json({ error: 'Enter a valid 7-character Society ID.' }, { status: 400 });
    }
    const { data: member, error } = await supabase
      .from('users')
      .select('cse_id,name,email,is_verified')
      .ilike('cse_id', identifier)
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
    if (!member || member.is_verified !== true || !member.email) {
      return NextResponse.json({ message: 'If this verified Society ID exists, a code has been sent to its registered email.' });
    }
    identifier = String(member.cse_id).toUpperCase();
    email = member.email;
    name = member.name || name;
  } else if (category === 'iert') {
    email = typeof body.iertEmail === 'string' ? body.iertEmail.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return NextResponse.json({ error: 'Enter a valid IERT email address.' }, { status: 400 });
    }
    identifier = email;
  } else if (category === 'iit_madras') {
    const roll = typeof body.iitRollNumber === 'string' ? body.iitRollNumber.trim().toUpperCase() : '';
    if (!/^[A-Z0-9_-]{3,30}$/.test(roll)) {
      return NextResponse.json({ error: 'Enter a valid IIT Madras roll number.' }, { status: 400 });
    }
    identifier = roll;
    email = `${roll.toLowerCase()}@ds.study.iitm.ac.in`;
  } else {
    return NextResponse.json({ error: 'Choose a valid participant category.' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('workshop_registrations')
    .select('id')
    .eq('event_key', WORKSHOP_REGISTRATION.key)
    .or(`society_id.ilike.${identifier},email.ilike.${email},iit_roll_number.ilike.${identifier}`)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: 'This participant is already registered for the workshop.' }, { status: 409 });

  const identityKey = `${category}:${identifier}`;
  const now = new Date();
  const { data: previous } = await supabase
    .from('workshop_registration_otps')
    .select('last_sent_at')
    .eq('identity_key', identityKey)
    .maybeSingle();
  if (previous?.last_sent_at && now.getTime() - new Date(previous.last_sent_at).getTime() < 60_000) {
    return NextResponse.json({ message: 'If the identity is eligible, a verification code has been sent.' });
  }

  const code = createEventOtp();
  const { error: saveError } = await supabase
    .from('workshop_registration_otps')
    .upsert({
      identity_key: identityKey,
      code_hash: hashEventOtp(identityKey, code),
      expires_at: new Date(now.getTime() + 5 * 60_000).toISOString(),
      last_sent_at: now.toISOString(),
      attempts: 0,
      verified_at: null,
      verified_token_hash: null,
      used_at: null,
      updated_at: now.toISOString(),
    });
  if (saveError) return NextResponse.json({ error: 'Could not start verification.' }, { status: 500 });

  try {
    await sendWorkshopOtp(email, name, code);
  } catch (error) {
    await supabase.from('workshop_registration_otps').update({ expires_at: now.toISOString(), updated_at: now.toISOString() }).eq('identity_key', identityKey);
    console.error('Workshop OTP delivery failed:', error);
    return NextResponse.json({ error: getEmailFailureMessage(error) }, { status: 503 });
  }

  return NextResponse.json({ message: 'A six-digit verification code was sent to the verified email address.' });
}
