import { NextResponse } from 'next/server';
import { EVENT_REGISTRATION } from '@/lib/event-registration';
import { createEventSupabase, hashEventPassToken } from '@/lib/event-registration-server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!/^[A-Za-z0-9_-]{32,100}$/.test(token)) {
    return NextResponse.json({ error: 'Entry pass not found.' }, { status: 404 });
  }

  let supabase;
  try {
    supabase = createEventSupabase();
  } catch (error) {
    console.error('Event pass database configuration error:', error);
    return NextResponse.json({ error: 'Entry pass is temporarily unavailable.' }, { status: 503 });
  }

  const tokenHash = hashEventPassToken('', token);
  const { data: registration, error } = await supabase
    .from('event_registrations')
    .select('id, full_name, participant_type, society_id, college_roll_number, session_selection, games, team_format, team_name, fee_amount, payment_status, pass_token_hash, attendance_status')
    .eq('event_key', EVENT_REGISTRATION.key)
    .eq('pass_token_hash', tokenHash)
    .maybeSingle();
  if (error) {
    console.error('Event pass lookup failed:', error);
    return NextResponse.json({ error: 'Entry pass is temporarily unavailable.' }, { status: 503 });
  }

  if (!registration || !['verified', 'waived'].includes(registration.payment_status)) {
    return NextResponse.json({ error: 'Entry pass not found or payment has not been verified.' }, { status: 404 });
  }

  return NextResponse.json({
    pass: {
      id: registration.id,
      fullName: registration.full_name,
      participantType: registration.participant_type,
      societyId: registration.society_id,
      studentId: registration.college_roll_number,
      session: registration.session_selection,
      games: registration.games,
      teamFormat: registration.team_format,
      teamName: registration.team_name,
      feeAmount: registration.fee_amount,
      attendanceStatus: registration.attendance_status,
      eventTitle: EVENT_REGISTRATION.title,
      venue: EVENT_REGISTRATION.venue,
      eventDate: EVENT_REGISTRATION.eventDate,
    },
  });
}
