import { NextResponse } from 'next/server';
import { canManageAttendance, getAttendanceActor, isValidAttendanceDate } from '@/lib/attendance-auth';
import { logActivity } from '@/lib/activity-logger';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { actor, error: authError } = await getAttendanceActor(request);
  if (authError) return authError;
  const { id } = await params;

  const { data: session, error: sessionError } = await actor.supabase
    .from('attendance_sessions')
    .select('id, event_name, date, created_at, approval_status')
    .eq('id', id)
    .maybeSingle();
  if (sessionError) {
    console.error('Error fetching attendance session:', sessionError);
    return NextResponse.json({ error: 'Failed to load attendance session' }, { status: 500 });
  }
  if (!session) return NextResponse.json({ error: 'Attendance session not found' }, { status: 404 });

  const { data: records, error: recordsError } = await actor.supabase
    .from('attendance_records')
    .select('id, attendee_id, marked_by_role, marked_at')
    .eq('session_id', id)
    .order('marked_at', { ascending: false });
  if (recordsError) {
    console.error('Error fetching attendance records:', recordsError);
    return NextResponse.json({ error: 'Failed to load attendance records' }, { status: 500 });
  }

  const attendeeIds = [...new Set((records || []).map((record) => record.attendee_id))];
  const { data: attendees, error: attendeesError } = attendeeIds.length
    ? await actor.supabase.from('users').select('id, cse_id, name, year').in('id', attendeeIds)
    : { data: [], error: null };
  if (attendeesError) {
    console.error('Error fetching attendance member details:', attendeesError);
    return NextResponse.json({ error: 'Failed to load attendee details' }, { status: 500 });
  }

  const attendeeById = new Map((attendees || []).map((attendee) => [attendee.id, attendee]));
  return NextResponse.json({
    session: {
      id: session.id,
      eventName: session.event_name,
      date: session.date,
      createdAt: session.created_at,
      approvalStatus: session.approval_status,
    },
    attendees: (records || []).flatMap((record) => {
      const attendee = attendeeById.get(record.attendee_id);
      return attendee ? [{
        id: record.id,
        societyId: attendee.cse_id,
        name: attendee.name,
        year: attendee.year,
        markedAt: record.marked_at,
        markedByRole: record.marked_by_role,
      }] : [];
    }),
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { actor, error: authError } = await getAttendanceActor(request);
  if (authError) return authError;
  if (!canManageAttendance(actor.role)) {
    return NextResponse.json({ error: 'Only the General, Cultural, or Technical Secretary can edit sessions' }, { status: 403 });
  }

  const { id } = await params;
  let body: { eventName?: unknown; date?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : '';
  const date = typeof body.date === 'string' ? body.date : '';
  if (!eventName || eventName.length > 255 || !isValidAttendanceDate(date)) {
    return NextResponse.json({ error: 'A valid event name and date are required' }, { status: 400 });
  }

  const { data: currentSession, error: currentSessionError } = await actor.supabase
    .from('attendance_sessions')
    .select('approval_status')
    .eq('id', id)
    .maybeSingle();
  if (currentSessionError) {
    console.error('Error checking attendance session status:', currentSessionError);
    return NextResponse.json({ error: 'Failed to verify attendance session status' }, { status: 500 });
  }
  if (!currentSession) return NextResponse.json({ error: 'Attendance session not found' }, { status: 404 });
  if (currentSession.approval_status !== 'pending') {
    return NextResponse.json({ error: 'Approved attendance sessions cannot be edited' }, { status: 409 });
  }

  const { data, error } = await actor.supabase
    .from('attendance_sessions')
    .update({ event_name: eventName, date })
    .eq('id', id)
    .eq('approval_status', 'pending')
    .select('id, event_name, date, created_at, approval_status')
    .maybeSingle();
  if (error) {
    console.error('Error updating attendance session:', error);
    return NextResponse.json({ error: 'Failed to update attendance session' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Session was deleted or approved and can no longer be edited' }, { status: 409 });
  }

  await logActivity(actor.supabase, {
    userId: actor.userId,
    action: 'Attendance Session Updated',
    description: `${eventName} attendance session was updated`,
    entityType: 'attendance_session',
    entityId: id,
  });

  return NextResponse.json({
    session: {
      id: data.id,
      eventName: data.event_name,
      date: data.date,
      createdAt: data.created_at,
      approvalStatus: data.approval_status,
    },
  });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { actor, error: authError } = await getAttendanceActor(request);
  if (authError) return authError;
  if (actor.role !== 'admin') {
    return NextResponse.json({ error: 'Only an admin can delete attendance sessions' }, { status: 403 });
  }

  const { id } = await params;
  const { data, error } = await actor.supabase
    .from('attendance_sessions')
    .delete()
    .eq('id', id)
    .select('id, event_name')
    .maybeSingle();
  if (error) {
    console.error('Error deleting attendance session:', error);
    return NextResponse.json({ error: 'Failed to delete attendance session' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Attendance session not found' }, { status: 404 });

  await logActivity(actor.supabase, {
    userId: actor.userId,
    action: 'Attendance Session Deleted',
    description: `${data.event_name} attendance session was deleted`,
    entityType: 'attendance_session',
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
