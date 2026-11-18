import { NextResponse } from 'next/server';
import { createEventSupabase, hashEventOtp } from '@/lib/event-registration-server';
import { isWorkshopRegistrationOpen, WORKSHOP_REGISTRATION } from '@/lib/workshop-registration';

export async function GET() {
  return NextResponse.json({ error: 'Method not implemented.' }, { status: 405 });
}

export async function POST(request: Request) {
  if (!isWorkshopRegistrationOpen()) {
    return NextResponse.json({ error: 'Workshop registration is closed.' }, { status: 410 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid registration submission.' }, { status: 400 });
  }

  const category = body.category;
  const verificationToken = typeof body.verificationToken === 'string' ? body.verificationToken : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 255) : '';
  if (!['society', 'iert', 'iit_madras'].includes(String(category)) || !verificationToken || !fullName) {
    return NextResponse.json({ error: 'Complete verification and enter your name.' }, { status: 400 });
  }

  let societyId = '';
  let memberUserId: string | null = null;
  let email = '';
  let aktuRollNumber: string | null = null;
  let branch: string | null = null;
  let year: number | null = null;
  let whatsappPhone: string | null = null;
  let iitRollNumber: string | null = null;
  let joinChance: string | null = null;
  let transactionId: string | null = null;
  let feeAmount = 0;

  let supabase;
  try {
    supabase = createEventSupabase();
  } catch {
    return NextResponse.json({ error: 'Registration is temporarily unavailable.' }, { status: 503 });
  }

  if (category === 'society') {
    societyId = typeof body.societyId === 'string' ? body.societyId.trim().toUpperCase() : '';
    const { data: member } = await supabase
      .from('users')
      .select('id,cse_id,name,email,is_verified')
      .ilike('cse_id', societyId)
      .maybeSingle();
    if (!member || member.is_verified !== true) return NextResponse.json({ error: 'Society verification is required.' }, { status: 400 });
    memberUserId = member.id;
    societyId = String(member.cse_id).toUpperCase();
    email = member.email;
  } else if (category === 'iert') {
    email = typeof body.iertEmail === 'string' ? body.iertEmail.trim().toLowerCase() : '';
    aktuRollNumber = typeof body.aktuRollNumber === 'string' ? body.aktuRollNumber.trim().toUpperCase() : '';
    branch = typeof body.branch === 'string' ? body.branch.trim().slice(0, 100) : '';
    year = typeof body.year === 'number' ? body.year : null;
    whatsappPhone = typeof body.whatsappPhone === 'string' ? body.whatsappPhone.trim() : null;
    transactionId = typeof body.transactionId === 'string' ? body.transactionId.trim().slice(0, 80) : '';
    feeAmount = 149;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !aktuRollNumber || !branch || !year || !transactionId) {
      return NextResponse.json({ error: 'Complete all IERT participant details and transaction ID.' }, { status: 400 });
    }
  } else {
    iitRollNumber = typeof body.iitRollNumber === 'string' ? body.iitRollNumber.trim().toUpperCase() : '';
    whatsappPhone = typeof body.whatsappPhone === 'string' ? body.whatsappPhone.trim() : null;
    joinChance = typeof body.joinChance === 'string' ? body.joinChance : null;
    email = `${iitRollNumber.toLowerCase()}@ds.study.iitm.ac.in`;
    if (!iitRollNumber || !whatsappPhone || !joinChance) {
      return NextResponse.json({ error: 'Complete IIT Madras participant details.' }, { status: 400 });
    }
  }

  let identityKey = '';
  let identifier = '';
  if (category === 'society') { identityKey = `society:${societyId}`; identifier = societyId; }
  if (category === 'iert') { identityKey = `iert:${email}`; identifier = email; }
  if (category === 'iit_madras') { identityKey = `iit_madras:${iitRollNumber}`; identifier = String(iitRollNumber); }

  const { data: otp, error: otpError } = await supabase
    .from('workshop_registration_otps')
    .select('expires_at,verified_at,used_at,verified_token_hash')
    .eq('identity_key', identityKey)
    .maybeSingle();
  if (otpError || !otp || !otp.verified_at || otp.used_at || new Date(otp.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Email verification is required.' }, { status: 400 });
  }
  if (!otp.verified_token_hash || otp.verified_token_hash !== hashEventOtp(identityKey, verificationToken)) {
    return NextResponse.json({ error: 'Email verification is required.' }, { status: 400 });
  }
  if (body.rulesAccepted !== true || (category === 'iit_madras' && body.declarationAccepted !== true)) {
    return NextResponse.json({ error: 'Accept the declaration and terms before submitting.' }, { status: 400 });
  }

  const { data: registration, error: insertError } = await supabase
    .from('workshop_registrations')
    .insert({
      event_key: WORKSHOP_REGISTRATION.key,
      participant_category: category,
      society_id: societyId || null,
      member_user_id: memberUserId,
      full_name: fullName,
      email,
      aktu_roll_number: aktuRollNumber,
      branch,
      year,
      whatsapp_phone: whatsappPhone,
      iit_roll_number: iitRollNumber,
      join_chance: joinChance,
      suggestion: typeof body.suggestion === 'string' ? body.suggestion.trim().slice(0, 2000) : null,
      fee_amount: feeAmount,
      payment_transaction_id: transactionId,
      declaration_accepted: true,
      rules_accepted: true,
    })
    .select('id')
    .single();
  if (insertError) {
    console.error('Workshop registration insert failed:', insertError);
    return NextResponse.json({ error: 'Could not save the registration.' }, { status: 500 });
  }

  await supabase
    .from('workshop_registration_otps')
    .update({ used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('identity_key', identityKey);

  return NextResponse.json({ registrationId: registration.id }, { status: 201 });
}
