import { NextResponse } from 'next/server';
import {
  createEventSupabase,
  createVerificationToken,
  hashEventOtp,
  maskEmail,
  secureStringEquals,
} from '@/lib/event-registration-server';
import { isWorkshopRegistrationOpen } from '@/lib/workshop-registration';

export async function POST(request: Request) {
  if (!isWorkshopRegistrationOpen()) {
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

  let supabase;
  try {
    supabase = createEventSupabase();
  } catch {
    return NextResponse.json({ error: 'Verification is temporarily unavailable.' }, { status: 503 });
  }

  if (category === 'society') {
    const { data: member } = await supabase
      .from('users')
      .select('id,cse_id,name,email,department,year,phone,is_verified')
      .ilike('cse_id', identifier)
      .maybeSingle();
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
  const { data: otp } = await supabase
    .from('workshop_registration_otps')
    .select('code_hash,expires_at,attempts,verified_at,used_at')
    .eq('identity_key', identityKey)
    .maybeSingle();
  if (!otp || otp.used_at || otp.verified_at || otp.attempts >= 5 || new Date(otp.expires_at).getTime() <= now.getTime()) {
    return NextResponse.json({ error: 'The code is invalid or expired. Request a new code.' }, { status: 400 });
  }

  const expectedHash = hashEventOtp(identityKey, code);
  if (!secureStringEquals(otp.code_hash, expectedHash)) {
    await supabase
      .from('workshop_registration_otps')
      .update({ attempts: otp.attempts + 1, updated_at: now.toISOString() })
      .eq('identity_key', identityKey);
    return NextResponse.json({ error: 'The code is invalid or expired.' }, { status: 400 });
  }

  const token = createVerificationToken();
  const { data: updated } = await supabase
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
  if (!updated) return NextResponse.json({ error: 'The code is invalid or expired.' }, { status: 400 });

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
