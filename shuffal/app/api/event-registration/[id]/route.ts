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
    .from('esports_event_registrations')
    .select('id, payment_status, participant_type')
    .eq('id', id)
    .eq('event_key', EVENT_REGISTRATION.key)
    .maybeSingle();
  if (currentError) {
    console.error('Could not load event registration for update:', currentError);
    return NextResponse.json({ error: 'Could not update event registration.' }, { status: 500 });
  }
  if (!current) return NextResponse.json({ error: 'Event registration not found.' }, { status: 404 });

  if (current.participant_type === 'member' && changes.pass_status !== undefined) {
    return NextResponse.json({ error: 'Society members do not receive a separate entry pass.' }, { status: 400 });
  }
  const nextPaymentStatus = typeof changes.payment_status === 'string' ? changes.payment_status : current.payment_status;
  const nextPassStatus = typeof changes.pass_status === 'string' ? changes.pass_status : undefined;
  if (nextPassStatus === 'sent' && !['verified', 'waived'].includes(nextPaymentStatus)) {
    return NextResponse.json({ error: 'Verify payment before marking a non-member pass as sent.' }, { status: 409 });
  }
  if (current.participant_type === 'member' && changes.payment_status) {
    return NextResponse.json({ error: 'Verified member registrations are free and cannot be changed to a paid status.' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('esports_event_registrations')
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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getEventRegistrationManager(request);
  if (auth.error) return auth.error;

  const { data: requester, error: requesterError } = await auth.supabase
    .from('users')
    .select('role')
    .eq('id', auth.managerId)
    .maybeSingle();
  if (requesterError) {
    console.error('Event registration delete permission lookup failed:', requesterError);
    return NextResponse.json({ error: 'Could not verify delete permission.' }, { status: 500 });
  }
  if (String(requester?.role).toLowerCase() !== 'admin') {
    return NextResponse.json({ error: 'Only admins can delete event registrations.' }, { status: 403 });
  }

  const { id } = await context.params;
  const { data: registration, error: loadError } = await auth.supabase
    .from('esports_event_registrations')
    .select('id, payment_screenshot_path')
    .eq('id', id)
    .eq('event_key', EVENT_REGISTRATION.key)
    .maybeSingle();
  if (loadError) {
    console.error('Event registration could not be loaded for deletion:', loadError);
    return NextResponse.json({ error: 'Could not delete event registration.' }, { status: 500 });
  }
  if (!registration) return NextResponse.json({ error: 'Event registration not found.' }, { status: 404 });

  const { error: deleteError } = await auth.supabase
    .from('esports_event_registrations')
    .delete()
    .eq('id', id)
    .eq('event_key', EVENT_REGISTRATION.key);
  if (deleteError) {
    console.error('Event registration deletion failed:', deleteError);
    return NextResponse.json({ error: 'Could not delete event registration.' }, { status: 500 });
  }

  let cleanupWarning: string | null = null;
  if (registration.payment_screenshot_path) {
    const { error: cleanupError } = await auth.supabase.storage
      .from('event-payment-proofs')
      .remove([registration.payment_screenshot_path]);
    if (cleanupError) {
      console.error('Payment screenshot cleanup failed after registration deletion:', cleanupError);
      cleanupWarning = 'Registration deleted, but its payment screenshot could not be removed.';
    }
  }

  return NextResponse.json({ success: true, cleanupWarning });
}
