import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  EVENT_REGISTRATION,
  getEventFee,
  isEventRegistrationOpen,
  FIRST_HALF_GAMES,
  SECOND_HALF_GAMES,
  type EventGame,
} from '@/lib/event-registration';
import {
  createEventSupabase,
  getEventRegistrationManager,
  hashEventOtp,
  sendEventRegistrationNotice,
} from '@/lib/event-registration-server';

const allowedGames = new Set<EventGame>([...FIRST_HALF_GAMES, ...SECOND_HALF_GAMES]);
const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type RegistrationPayload = {
  participantType?: unknown;
  societyId?: unknown;
  verificationToken?: unknown;
  memberPhone?: unknown;
  nonMember?: unknown;
  session?: unknown;
  games?: unknown;
  teamFormat?: unknown;
  teamName?: unknown;
  identity?: unknown;
  deliveryMethod?: unknown;
  transactionId?: unknown;
  rulesAccepted?: unknown;
};

function getString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function getMemberEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

function validPhone(phone: string): boolean {
  return /^\+?[0-9 ()-]{8,25}$/.test(phone);
}

function validIdentity(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  const identity = value as Record<string, unknown>;
  return {
    bgmiIgn: getString(identity.bgmiIgn, 80),
    bgmiUid: getString(identity.bgmiUid, 40),
    freeFireIgn: getString(identity.freeFireIgn, 80),
    freeFireUid: getString(identity.freeFireUid, 40),
  };
}

function hasValidImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

function isMissingRegistrationSchema(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || error.message?.toLowerCase().includes('esports_event_registrations') === true;
}

export async function GET(request: Request) {
  const auth = await getEventRegistrationManager(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('esports_event_registrations')
    .select('*')
    .eq('event_key', EVENT_REGISTRATION.key)
    .order('participant_type', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(2000);

  if (error) {
    console.error('Event registrations could not be loaded:', error);
    return NextResponse.json({
      error: isMissingRegistrationSchema(error)
        ? 'Event registration tables are missing. Apply migration 036_create_event_registration.sql.'
        : 'Could not load event registrations.',
    }, { status: 500 });
  }

  return NextResponse.json({ registrations: data || [] });
}

export async function POST(request: Request) {
  if (!isEventRegistrationOpen()) {
    return NextResponse.json({ error: 'Event registration is closed.' }, { status: 410 });
  }

  let supabase;
  try {
    supabase = createEventSupabase();
  } catch (error) {
    console.error('Event registration database configuration error:', error);
    return NextResponse.json({ error: 'Registration is temporarily unavailable.' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid registration submission.' }, { status: 400 });
  }

  let body: RegistrationPayload;
  try {
    const rawPayload = formData.get('registration');
    if (typeof rawPayload !== 'string') throw new Error('Registration data is missing.');
    body = JSON.parse(rawPayload) as RegistrationPayload;
  } catch {
    return NextResponse.json({ error: 'Registration details are invalid.' }, { status: 400 });
  }

  const participantType = body.participantType;
  const session = body.session;
  if (participantType !== 'member' && participantType !== 'non_member') {
    return NextResponse.json({ error: 'Choose member or non-member registration.' }, { status: 400 });
  }
  if (session !== 'first_half' && session !== 'second_half' && session !== 'both') {
    return NextResponse.json({ error: 'Choose a valid event session.' }, { status: 400 });
  }
  if (body.rulesAccepted !== true) {
    return NextResponse.json({ error: 'Accept the event rules before submitting.' }, { status: 400 });
  }

  const rawGames = Array.isArray(body.games) ? body.games : [];
  const games = rawGames.filter((game): game is EventGame => typeof game === 'string' && allowedGames.has(game as EventGame));
  if (rawGames.length !== games.length || new Set(games).size !== games.length) {
    return NextResponse.json({ error: 'One or more selected games are invalid.' }, { status: 400 });
  }
  const hasFirstHalf = session === 'first_half' || session === 'both';
  const hasSecondHalf = session === 'second_half' || session === 'both';
  const firstHalfGames = games.filter((game) => FIRST_HALF_GAMES.includes(game));
  const secondHalfGames = games.filter((game) => SECOND_HALF_GAMES.includes(game));
  if (firstHalfGames.length !== Number(hasFirstHalf) || secondHalfGames.length !== Number(hasSecondHalf)) {
    return NextResponse.json({ error: 'Choose exactly one game for each selected half.' }, { status: 400 });
  }

  const teamFormat = body.teamFormat;
  if (teamFormat !== 'solo' && teamFormat !== 'duo') {
    return NextResponse.json({ error: 'Choose a valid player format.' }, { status: 400 });
  }
  if (session === 'second_half' && games.includes('Chess') && teamFormat === 'duo') {
    return NextResponse.json({ error: 'Chess is a Solo-only event.' }, { status: 400 });
  }
  const teamName = getString(body.teamName, 80);
  if (!teamName) {
    return NextResponse.json({ error: 'A team name is required for registration.' }, { status: 400 });
  }

  const identity = validIdentity(body.identity);

  const deliveryMethod = participantType === 'member' ? 'email' : body.deliveryMethod;
  if (deliveryMethod !== 'email' && deliveryMethod !== 'whatsapp') {
    return NextResponse.json({ error: 'Choose email or WhatsApp entry-pass delivery.' }, { status: 400 });
  }

  const memberSocietyId = typeof body.societyId === 'string' ? body.societyId.trim().toUpperCase() : '';
  let member: {
    id: string;
    cse_id: string;
    name: string;
    email: string;
    phone: string | null;
    department: string | null;
    year: number;
  } | null = null;
  let verificationTokenHash = '';

  if (participantType === 'member') {
    const verificationToken = typeof body.verificationToken === 'string' ? body.verificationToken : '';
    if (!/^[A-Z0-9-]{3,20}$/i.test(memberSocietyId) || !/^[A-Za-z0-9_-]{32,100}$/.test(verificationToken)) {
      return NextResponse.json({ error: 'Verify your Society ID by email OTP before submitting.' }, { status: 403 });
    }

    const { data: verifiedMember, error: memberError } = await supabase
      .from('users')
      .select('id, cse_id, name, email, department, year, is_verified')
      .ilike('cse_id', memberSocietyId)
      .maybeSingle();
    if (memberError) {
      console.error('Event registration member lookup failed:', memberError);
      return NextResponse.json({ error: 'Could not load verified member details.' }, { status: 503 });
    }
    if (!verifiedMember || verifiedMember.is_verified !== true || !verifiedMember.email) {
      return NextResponse.json({ error: 'A verified Society member was not found.' }, { status: 403 });
    }

    const { data: existingRegistration, error: existingRegistrationError } = await supabase
      .from('esports_event_registrations')
      .select('id')
      .eq('event_key', EVENT_REGISTRATION.key)
      .ilike('society_id', verifiedMember.cse_id)
      .maybeSingle();
    if (existingRegistrationError) {
      console.error('Existing event registration lookup failed:', existingRegistrationError);
      return NextResponse.json({ error: 'Could not check whether this Society ID is already registered.' }, { status: 503 });
    }
    if (existingRegistration) {
      return NextResponse.json({ error: 'This Society ID is already registered for this event.' }, { status: 409 });
    }

    const { data: memberContact, error: contactError } = await supabase
      .from('users')
      .select('phone')
      .eq('id', verifiedMember.id)
      .maybeSingle();
    if (contactError) {
      console.warn('Member phone is unavailable in the users table; using the event registration contact:', contactError);
    }
    member = {
      ...verifiedMember,
      phone: memberContact?.phone || getString(body.memberPhone, 25) || null,
    };

    verificationTokenHash = hashEventOtp(member.cse_id, verificationToken);
    const now = new Date();
    const { data: otpRecord, error: otpError } = await supabase
      .from('esports_event_registration_otps')
      .select('verified_at, verified_token_hash, expires_at, used_at')
      .eq('society_id', member.cse_id)
      .maybeSingle();
    if (otpError) {
      console.error('Event registration OTP state lookup failed:', otpError);
      return NextResponse.json({ error: 'Could not validate member verification.' }, { status: 503 });
    }
    if (
      !otpRecord
      || !otpRecord.verified_at
      || otpRecord.used_at
      || new Date(otpRecord.expires_at).getTime() <= now.getTime()
      || otpRecord.verified_token_hash !== verificationTokenHash
    ) {
      return NextResponse.json({ error: 'Member verification expired. Verify your Society ID again.' }, { status: 403 });
    }

    if (deliveryMethod === 'whatsapp' && !validPhone(member.phone || '')) {
      return NextResponse.json({ error: 'No valid phone number is saved for this member. Choose email delivery.' }, { status: 400 });
    }
  }

  let nonMember: Record<string, unknown> = {};
  if (participantType === 'non_member') {
    if (!body.nonMember || typeof body.nonMember !== 'object') {
      return NextResponse.json({ error: 'Participant details are required.' }, { status: 400 });
    }
    nonMember = body.nonMember as Record<string, unknown>;
  }

  const fullName = participantType === 'member' ? member!.name : getString(nonMember.name, 255);
  const email = participantType === 'member' ? member!.email.trim().toLowerCase() : getString(nonMember.email, 255).toLowerCase();
  const phone = participantType === 'member' ? (member!.phone || '').trim() : getString(nonMember.phone, 25);
  const department = participantType === 'member' ? (member!.department || 'CSE') : getString(nonMember.department, 100);
  const collegeRollNumber = participantType === 'member' ? null : getString(nonMember.aktuRollNumber ?? nonMember.collegeRollNumber, 50) || null;
  const yearValue = participantType === 'member' ? member!.year : Number(nonMember.year);
  const year = Number.isInteger(yearValue) && yearValue >= 1 && yearValue <= 6 ? yearValue : null;

  if (
    !fullName
    || !getMemberEmail(email)
    || (participantType === 'non_member' && !validPhone(phone))
    || (deliveryMethod === 'whatsapp' && !validPhone(phone))
  ) {
    return NextResponse.json({ error: 'Enter valid name, email, and WhatsApp contact details.' }, { status: 400 });
  }
  if (participantType === 'non_member' && ((!collegeRollNumber && year !== 1) || !department || year === null)) {
    return NextResponse.json({ error: 'Enter valid department and year. AKTU Roll Number is required after Year 1.' }, { status: 400 });
  }
  const feeAmount = getEventFee(participantType, session);
  const transactionId = participantType === 'member' ? '' : getString(body.transactionId, 80);
  if (participantType === 'non_member' && !/^[A-Za-z0-9-]{6,80}$/.test(transactionId)) {
    return NextResponse.json({ error: 'A valid UPI transaction ID / UTR is required after payment.' }, { status: 400 });
  }

  const screenshotValue = formData.get('paymentScreenshot');
  let screenshot: File | null = null;
  let screenshotBuffer: Buffer | null = null;
  if (participantType === 'non_member' && screenshotValue instanceof File) {
    screenshot = screenshotValue;
    if (screenshot.size > 5 * 1024 * 1024 || !imageExtensions[screenshot.type]) {
      return NextResponse.json({ error: 'Payment screenshot must be a JPG, PNG, or WebP image up to 5 MB.' }, { status: 400 });
    }
    screenshotBuffer = Buffer.from(await screenshot.arrayBuffer());
    if (!hasValidImageSignature(screenshotBuffer, screenshot.type)) {
      return NextResponse.json({ error: 'Payment screenshot is not a valid image.' }, { status: 400 });
    }
  } else if (screenshotValue && typeof screenshotValue !== 'string') {
    return NextResponse.json({ error: 'Payment screenshot is invalid.' }, { status: 400 });
  }

  if (!isEventRegistrationOpen()) {
    return NextResponse.json({ error: 'Event registration is closed.' }, { status: 410 });
  }

  let screenshotPath: string | null = null;
  if (screenshot && screenshotBuffer) {
    screenshotPath = `${EVENT_REGISTRATION.key}/${randomUUID()}.${imageExtensions[screenshot.type]}`;
    const { error: uploadError } = await supabase.storage
      .from('event-payment-proofs')
      .upload(screenshotPath, screenshotBuffer, { contentType: screenshot.type, upsert: false });
    if (uploadError) {
      console.error('Event payment screenshot upload failed:', uploadError);
      return NextResponse.json({ error: 'Could not save the payment screenshot. Try again without the optional screenshot or use a smaller image.' }, { status: 503 });
    }
  }

  if (participantType === 'member') {
    const now = new Date().toISOString();
    const { data: consumed, error: consumeError } = await supabase
      .from('esports_event_registration_otps')
      .update({ verified_token_hash: null, used_at: now, updated_at: now })
      .eq('society_id', member!.cse_id)
      .eq('verified_token_hash', verificationTokenHash)
      .is('used_at', null)
      .select('society_id')
      .maybeSingle();
    if (consumeError || !consumed) {
      if (consumeError) console.error('Event member verification token could not be consumed:', consumeError);
      if (screenshotPath) await removeScreenshot(supabase, screenshotPath);
      return NextResponse.json({ error: 'Member verification was already used or expired. Verify your Society ID again.' }, { status: 403 });
    }
  }

  const row = {
    event_key: EVENT_REGISTRATION.key,
    participant_type: participantType,
    member_user_id: member?.id || null,
    society_id: member?.cse_id || null,
    full_name: fullName,
    college_roll_number: collegeRollNumber,
    department,
    year,
    whatsapp_phone: phone || null,
    email,
    session_selection: session,
    games,
    team_format: teamFormat,
    team_name: teamName || null,
    bgmi_ign: games.includes('BGMI') ? identity.bgmiIgn || null : null,
    bgmi_uid: games.includes('BGMI') ? identity.bgmiUid || null : null,
    free_fire_ign: games.includes('Free Fire') ? identity.freeFireIgn || null : null,
    free_fire_uid: games.includes('Free Fire') ? identity.freeFireUid || null : null,
    fee_amount: feeAmount,
    payment_transaction_id: transactionId || null,
    payment_screenshot_path: screenshotPath,
    payment_status: participantType === 'member' ? 'waived' : 'pending',
    delivery_method: deliveryMethod,
    rules_accepted: true,
  };

  const { data: registration, error: insertError } = await supabase
    .from('esports_event_registrations')
    .insert(row)
    .select('id')
    .single();

  if (insertError) {
    console.error('Event registration could not be saved:', insertError);
    if (screenshotPath) await removeScreenshot(supabase, screenshotPath);
    if (
      insertError.code === '23505'
      && (
        insertError.message.includes('idx_esports_event_registrations_society_event')
        || insertError.message.includes('idx_esports_event_registrations_member_event')
      )
    ) {
      return NextResponse.json({ error: 'This Society ID is already registered for this event.' }, { status: 409 });
    }
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'This member is already registered, or this UPI transaction ID has already been used.' }, { status: 409 });
    }
    if (isMissingRegistrationSchema(insertError)) {
      return NextResponse.json({ error: 'Event registration tables are missing. Apply migration 036_create_event_registration.sql.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Could not save your registration. Please try again.' }, { status: 500 });
  }

  let notificationError: string | null = null;
  try {
    await sendEventRegistrationNotice(email, fullName, registration.id, feeAmount, deliveryMethod, participantType);
  } catch (emailError) {
    console.error('Event registration confirmation email failed:', emailError);
    notificationError = 'Your registration is saved, but the confirmation email could not be sent. Please keep your reference and contact the CSE Society.';
  }

  return NextResponse.json({
    registrationId: registration.id,
    feeAmount,
    notificationError,
  }, { status: 201 });
}

async function removeScreenshot(
  supabase: ReturnType<typeof createEventSupabase>,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage.from('event-payment-proofs').remove([path]);
  if (error) console.error('Failed to remove orphaned event payment screenshot:', error);
}
