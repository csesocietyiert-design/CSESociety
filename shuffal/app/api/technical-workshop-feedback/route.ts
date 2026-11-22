import { NextResponse } from 'next/server';
import {
  createEventSupabase,
  getFeedbackIdentityKey,
  hashEventOtp,
  secureStringEquals,
  TECHNICAL_WORKSHOP_FEEDBACK_EVENT_KEY,
} from '@/lib/technical-workshop-feedback-server';

function isRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid feedback submission.' }, { status: 400 });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Invalid feedback submission.' }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;

  const societyId = typeof body.societyId === 'string' ? body.societyId.trim().toUpperCase() : '';
  const verificationToken = typeof body.verificationToken === 'string' ? body.verificationToken : '';
  const highlight = typeof body.highlight === 'string' ? body.highlight.trim() : '';
  const suggestions = typeof body.suggestions === 'string' ? body.suggestions.trim() : '';
  if (
    !/^[A-Z0-9]{7}$/.test(societyId)
    || !/^[A-Za-z0-9_-]{43}$/.test(verificationToken)
    || !isRating(body.overallRating)
    || !isRating(body.contentRating)
    || !isRating(body.speakerRating)
    || !isRating(body.organizationRating)
    || highlight.length < 3
    || highlight.length > 600
    || suggestions.length > 1500
  ) {
    return NextResponse.json({ error: 'Complete the required feedback fields with valid values.' }, { status: 400 });
  }

  let supabase: ReturnType<typeof createEventSupabase>;
  try {
    supabase = createEventSupabase();
  } catch (error) {
    console.error('Technical workshop feedback database configuration error:', error);
    return NextResponse.json({ error: 'Feedback submission is temporarily unavailable.' }, { status: 503 });
  }

  const { data: member, error: memberError } = await supabase
    .from('users')
    .select('id,cse_id,is_verified')
    .ilike('cse_id', societyId)
    .maybeSingle();
  if (memberError) {
    console.error('Technical workshop feedback member lookup failed:', memberError);
    return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
  }
  if (!member || member.is_verified !== true) {
    return NextResponse.json({ error: 'Verify your CSE Society ID before submitting feedback.' }, { status: 403 });
  }

  const canonicalSocietyId = String(member.cse_id).toUpperCase();
  const identityKey = getFeedbackIdentityKey(canonicalSocietyId);
  const { data: otp, error: otpError } = await supabase
    .from('technical_workshop_feedback_otps')
    .select('expires_at,verified_at,used_at,verified_token_hash')
    .eq('society_id', canonicalSocietyId)
    .eq('member_user_id', member.id)
    .maybeSingle();
  if (otpError) {
    console.error('Technical workshop feedback verification lookup failed:', otpError);
    return NextResponse.json({ error: 'Member verification is temporarily unavailable.' }, { status: 503 });
  }
  if (
    !otp
    || !otp.verified_at
    || otp.used_at
    || new Date(otp.expires_at).getTime() <= Date.now()
    || !otp.verified_token_hash
    || !secureStringEquals(otp.verified_token_hash, hashEventOtp(identityKey, verificationToken))
  ) {
    return NextResponse.json({ error: 'Your verification has expired. Verify your Society ID again.' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const { data: consumedOtp, error: consumeError } = await supabase
    .from('technical_workshop_feedback_otps')
    .update({ used_at: now, updated_at: now })
    .eq('society_id', canonicalSocietyId)
    .eq('member_user_id', member.id)
    .eq('verified_token_hash', otp.verified_token_hash)
    .is('used_at', null)
    .select('society_id')
    .maybeSingle();
  if (consumeError) {
    console.error('Technical workshop feedback verification token could not be consumed:', consumeError);
    return NextResponse.json({ error: 'Could not verify this submission. Please try again.' }, { status: 503 });
  }
  if (!consumedOtp) {
    return NextResponse.json({ error: 'Your verification has expired. Verify your Society ID again.' }, { status: 403 });
  }

  const { error: insertError } = await supabase
    .from('technical_workshop_feedback')
    .insert({
      event_key: TECHNICAL_WORKSHOP_FEEDBACK_EVENT_KEY,
      member_user_id: member.id,
      society_id: canonicalSocietyId,
      overall_rating: body.overallRating,
      content_rating: body.contentRating,
      speaker_rating: body.speakerRating,
      organization_rating: body.organizationRating,
      highlight,
      suggestions: suggestions || null,
    });
  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Feedback has already been submitted for this Society ID.' }, { status: 409 });
    }
    console.error('Technical workshop feedback could not be saved:', insertError);
    return NextResponse.json({ error: 'Could not save feedback. Please request a new verification code and try again.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Thank you. Your feedback has been submitted to CSE Society.' }, { status: 201 });
}
