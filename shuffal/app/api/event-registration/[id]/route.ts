import { NextResponse } from 'next/server';
import { EVENT_REGISTRATION } from '@/lib/event-registration';
import { getEventRegistrationManager } from '@/lib/event-registration-server';

const attendanceStatuses = new Set(['registered', 'checked_in', 'no_show']);
const paymentStatuses = new Set(['verified', 'rejected']);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getEventRegistrationManager(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid update request.' }, { status: 400 });
  }

  const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.paymentStatus !== undefined) {
    if (!paymentStatuses.has(String(body.paymentStatus))) {
      return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
    }
    changes.payment_status = body.paymentStatus;
  }
  if (body.passStatus !== undefined) {
    if (body.passStatus !== 'pending' && body.passStatus !== 'sent') {
      return NextResponse.json({ error: 'Invalid pass status.' }, { status: 400 });
    }
    changes.pass_status = body.passStatus;
    changes.pass_sent_at = body.passStatus === 'sent' ? new Date().toISOString() : null;
  }
  if (body.attendanceStatus !== undefined) {
    if (!attendanceStatuses.has(String(body.attendanceStatus))) {
      return NextResponse.json({ error: 'Invalid attendance status.' }, { status: 400 });
    }
    changes.attendance_status = body.attendanceStatus;
  }
  if (body.evaluationScore !== undefined) {
    const score = body.evaluationScore === null || body.evaluationScore === '' ? null : Number(body.evaluationScore);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 1000)) {
      return NextResponse.json({ error: 'Evaluation score must be between 0 and 1000.' }, { status: 400 });
    }
    changes.evaluation_score = score;
  }
  if (body.evaluationNotes !== undefined) {
    if (typeof body.evaluationNotes !== 'string' || body.evaluationNotes.length > 2000) {
      return NextResponse.json({ error: 'Evaluation notes must be 2000 characters or fewer.' }, { status: 400 });
    }
    changes.evaluation_notes = body.evaluationNotes.trim() || null;
  }
  if (Object.keys(changes).length === 1) {
    return NextResponse.json({ error: 'No valid changes were provided.' }, { status: 400 });
  }

  const { data: current, error: currentError } = await auth.supabase
    .from('event_registrations')
    .select('id, payment_status, participant_type')
    .eq('id', id)
    .eq('event_key', EVENT_REGISTRATION.key)
    .maybeSingle();
  if (currentError) {
    console.error('Could not load event registration for update:', currentError);
    return NextResponse.json({ error: 'Could not update event registration.' }, { status: 500 });
  }
  if (!current) return NextResponse.json({ error: 'Event registration not found.' }, { status: 404 });

  const nextPaymentStatus = typeof changes.payment_status === 'string' ? changes.payment_status : current.payment_status;
  const nextPassStatus = typeof changes.pass_status === 'string' ? changes.pass_status : undefined;
  if (nextPassStatus === 'sent' && !['verified', 'waived'].includes(nextPaymentStatus)) {
    return NextResponse.json({ error: 'Verify payment before marking a non-member pass as sent.' }, { status: 409 });
  }
  if (current.participant_type === 'member' && changes.payment_status) {
    return NextResponse.json({ error: 'Verified member registrations are free and cannot be changed to a paid status.' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('event_registrations')
    .update(changes)
    .eq('id', id)
    .eq('event_key', EVENT_REGISTRATION.key)
    .select('*')
    .single();
  if (error) {
    console.error('Event registration update failed:', error);
    return NextResponse.json({ error: 'Could not update event registration.' }, { status: 500 });
  }

  return NextResponse.json({ registration: data });
}
