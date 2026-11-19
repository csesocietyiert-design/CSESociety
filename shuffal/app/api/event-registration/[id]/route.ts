import { NextResponse } from 'next/server';
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
    .select('id, event_key, payment_status, participant_type')
    .eq('id', id)
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
    .eq('event_key', current.event_key)
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
    return NextResponse.json({ error: 'Only admins can cancel event registrations.' }, { status: 403 });
  }

  const { id } = await context.params;
  const url = new URL(request.url);
  const eventType = url.searchParams.get('eventType') || 'esports';
  const eventKey = url.searchParams.get('eventKey') || '';
  if ((eventType !== 'esports' && eventType !== 'workshop') || !eventKey || eventKey.length > 120) {
    return NextResponse.json({ error: 'Choose a valid event registration.' }, { status: 400 });
  }

  if (eventType === 'workshop') {
    const { data: registration, error: loadError } = await auth.supabase
      .from('workshop_registrations')
      .select('id, participant_category, society_id, email, iit_roll_number')
      .eq('id', id)
      .eq('event_key', eventKey)
      .maybeSingle();
    if (loadError) {
      console.error('Workshop registration could not be loaded for cancellation:', loadError);
      return NextResponse.json({ error: 'Could not cancel workshop registration.' }, { status: 500 });
    }
    if (!registration) return NextResponse.json({ error: 'Workshop registration not found.' }, { status: 404 });

    const { data: deleted, error: deleteError } = await auth.supabase
      .from('workshop_registrations')
      .delete()
      .eq('id', id)
      .eq('event_key', eventKey)
      .select('id')
      .maybeSingle();
    if (deleteError) {
      console.error('Workshop registration cancellation failed:', deleteError);
      return NextResponse.json({ error: 'Could not cancel workshop registration.' }, { status: 500 });
    }
    if (!deleted) return NextResponse.json({ error: 'Workshop registration not found.' }, { status: 404 });

    const identity = registration.participant_category === 'society'
      ? registration.society_id
      : registration.participant_category === 'iert'
        ? registration.email
        : registration.iit_roll_number;
    let cleanupWarning: string | null = null;
    if (identity) {
      const { error: otpCleanupError } = await auth.supabase
        .from('workshop_registration_otps')
        .delete()
        .eq('identity_key', `${registration.participant_category}:${identity}`);
      if (otpCleanupError) {
        console.error('Workshop verification data cleanup failed after cancellation:', otpCleanupError);
        cleanupWarning = 'Registration removed, but its verification data could not be deleted.';
      }
    } else {
      cleanupWarning = 'Registration removed, but its verification data could not be matched for cleanup.';
    }
    return NextResponse.json({ success: true, cleanupWarning });
  }

  const { data: registration, error: loadError } = await auth.supabase
    .from('esports_event_registrations')
    .select('id, event_key, payment_screenshot_path, society_id')
    .eq('id', id)
    .eq('event_key', eventKey)
    .maybeSingle();
  if (loadError) {
    console.error('Event registration could not be loaded for cancellation:', loadError);
    return NextResponse.json({ error: 'Could not cancel event registration.' }, { status: 500 });
  }
  if (!registration) return NextResponse.json({ error: 'Event registration not found.' }, { status: 404 });

  const { data: deleted, error: deleteError } = await auth.supabase
    .from('esports_event_registrations')
    .delete()
    .eq('id', id)
    .eq('event_key', registration.event_key)
    .select('id')
    .maybeSingle();
  if (deleteError) {
    console.error('Event registration cancellation failed:', deleteError);
    return NextResponse.json({ error: 'Could not cancel event registration.' }, { status: 500 });
  }
  if (!deleted) return NextResponse.json({ error: 'Event registration not found.' }, { status: 404 });

  const cleanupWarnings: string[] = [];
  if (registration.society_id) {
    const { error: otpCleanupError } = await auth.supabase
      .from('esports_event_registration_otps')
      .delete()
      .eq('society_id', registration.society_id);
    if (otpCleanupError) {
      console.error('Event verification data cleanup failed after cancellation:', otpCleanupError);
      cleanupWarnings.push('Registration removed, but its verification data could not be deleted.');
    }
  }
  if (registration.payment_screenshot_path) {
    const { error: cleanupError } = await auth.supabase.storage
      .from('event-payment-proofs')
      .remove([registration.payment_screenshot_path]);
    if (cleanupError) {
      console.error('Payment screenshot cleanup failed after cancellation:', cleanupError);
      cleanupWarnings.push('Registration removed, but its payment screenshot could not be removed.');
    }
  }

  return NextResponse.json({ success: true, cleanupWarning: cleanupWarnings.join(' ') || null });
}
