import { NextResponse } from 'next/server';
import { canManageAttendance, getAttendanceActor, isValidAttendanceDate } from '@/lib/attendance-auth';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  const { actor, error: authError } = await getAttendanceActor(request);
  if (authError) return authError;

  const { data, error } = await actor.supabase
    .from('attendance_sessions')
    .select('id, event_name, date, created_at, approval_status')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching attendance sessions:', error);
    return NextResponse.json({ error: 'Failed to load attendance sessions' }, { status: 500 });
  }

  return NextResponse.json({
    sessions: (data || []).map((session) => ({
      id: session.id,
      eventName: session.event_name,
      date: session.date,
      createdAt: session.created_at,
      approvalStatus: session.approval_status,
    })),
  });
}

export async function POST(request: Request) {
  const { actor, error: authError } = await getAttendanceActor(request);
  if (authError) return authError;
  if (!canManageAttendance(actor.role)) {
    return NextResponse.json({ error: 'Only the General, Cultural, or Technical Secretary can create sessions' }, { status: 403 });
  }

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

  const { data, error } = await actor.supabase
    .from('attendance_sessions')
    .insert({ event_name: eventName, date, created_by: actor.userId })
    .select('id, event_name, date, created_at, approval_status')
    .single();
  if (error) {
    console.error('Error creating attendance session:', error);
    return NextResponse.json({ error: 'Failed to create attendance session' }, { status: 500 });
  }

  await logActivity(actor.supabase, {
    userId: actor.userId,
    action: 'Attendance Session Created',
    description: `${eventName} attendance session was created`,
    entityType: 'attendance_session',
    entityId: data.id,
  });

  return NextResponse.json({
    session: {
      id: data.id,
      eventName: data.event_name,
      date: data.date,
      createdAt: data.created_at,
      approvalStatus: data.approval_status,
    },
  }, { status: 201 });
}
