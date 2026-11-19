import { NextResponse } from 'next/server';
import {
  createEventSupabase,
  createVerificationToken,
  hashEventOtp,
  maskEmail,
  secureStringEquals,
} from '@/lib/event-registration-server';
import { getWorkshopRegistrationClosesAt } from '@/lib/workshop-registration-server';

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
    console.error('Workshop OTP verification deadline lookup failed:', error);
    return NextResponse.json({ error: 'Workshop registration is temporarily unavailable.' }, { status: 503 });
  }
  if (Date.now() >= new Date(closesAt).getTime()) {
    return NextResponse.json({ error: 'Workshop registration is closed.' }, { status: 410 });
  }

  let body: { category?: unknown; societyId?: unknown; iertEmail?: unknown; iitRollNumber?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const category = body.category;
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  let identifier = '';
  let email = '';
  let memberName = '';
  let department = '';
  let memberYear: number | null = null;
  let memberPhone = '';

  if (category === 'society') {
    identifier = typeof body.societyId === 'string' ? body.societyId.trim().toUpperCase() : '';
    if (!/^[A-Z0-9]{7}$/.test(identifier)) {
      return NextResponse.json({ error: 'Enter a valid 7-character Society ID.' }, { status: 400 });
    }
  } else if (category === 'iert') {
    identifier = typeof body.iertEmail === 'string' ? body.iertEmail.trim().toLowerCase() : '';
  } else if (category === 'iit_madras') {
    identifier = typeof body.iitRollNumber === 'string' ? body.iitRollNumber.trim().toUpperCase() : '';
  } else {
    return NextResponse.json({ error: 'Choose a valid participant category.' }, { status: 400 });
  }
  if (!identifier || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the identity and six-digit code.' }, { status: 400 });
  }

  if (category === 'society') {
    const { data: member, error: memberError } = await supabase
      .from('users')
      .select('id,cse_id,name,email,department,year,phone,is_verified')
      .ilike('cse_id', identifier)
      .maybeSingle();
    if (memberError) {
      console.error('Workshop OTP member lookup failed:', memberError);
      return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
    }
    if (!member || member.is_verified !== true || !member.email) {
      return NextResponse.json({ error: 'The code is invalid or expired.' }, { status: 400 });
    }
    identifier = String(member.cse_id).toUpperCase();
    email = member.email;
    memberName = member.name || '';
    department = member.department || '';
    memberYear = typeof member.year === 'number' ? member.year : null;
    memberPhone = member.phone || '';
  } else if (category === 'iert') {
    email = identifier;
  } else {
    email = `${identifier.toLowerCase()}@ds.study.iitm.ac.in`;
  }

  const identityKey = `${category}:${identifier}`;
  const now = new Date();
  const { data: otp, error: otpError } = await supabase
    .from('workshop_registration_otps')
    .select('code_hash,expires_at,attempts,verified_at,used_at')
    .eq('identity_key', identityKey)
    .maybeSingle();
  if (otpError) {
    console.error('Workshop OTP lookup failed:', otpError);
    return NextResponse.json({ error: 'Verification is temporarily unavailable.' }, { status: 503 });
  }
  if (!otp) {
    console.warn('Workshop OTP rejected: not found.');
    return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });
  }
  const rejectionReason = otp.used_at
    ? 'already used'
    : otp.verified_at
      ? 'already verified'
      : otp.attempts >= 5
        ? 'attempt limit reached'
        : new Date(otp.expires_at).getTime() <= now.getTime()
          ? 'expired'
          : null;
  if (rejectionReason) {
    console.warn(`Workshop OTP rejected: ${rejectionReason}.`);
    return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });
  }

  const expectedHash = hashEventOtp(identityKey, code);
  if (!secureStringEquals(otp.code_hash, expectedHash)) {
    console.warn('Workshop OTP rejected: code did not match.');
    const { error: attemptError } = await supabase
      .from('workshop_registration_otps')
      .update({ attempts: otp.attempts + 1, updated_at: now.toISOString() })
      .eq('identity_key', identityKey);
    if (attemptError) {
      console.error('Workshop OTP attempt could not be recorded:', attemptError);
      return NextResponse.json({ error: 'Verification is temporarily unavailable.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'The code is invalid or expired.' }, { status: 400 });
  }

  const token = createVerificationToken();
  const { data: updated, error: updateError } = await supabase
    .from('workshop_registration_otps')
    .update({
      verified_at: now.toISOString(),
      verified_token_hash: hashEventOtp(identityKey, token),
      updated_at: now.toISOString(),
    })
    .eq('identity_key', identityKey)
    .eq('code_hash', otp.code_hash)
    .is('verified_at', null)
    .is('used_at', null)
    .select('identity_key')
    .maybeSingle();
  if (updateError) {
    console.error('Workshop OTP could not be marked verified:', updateError);
    return NextResponse.json({ error: 'Verification is temporarily unavailable.' }, { status: 503 });
  }
  if (!updated) return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });

  return NextResponse.json({
    verificationToken: token,
    identity: {
      identifier,
      email,
      maskedEmail: maskEmail(email),
      name: memberName,
      department,
      year: memberYear,
      phone: memberPhone,
    },
  });
}
