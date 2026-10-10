import { NextResponse } from 'next/server';
import { getAttendanceActor } from '@/lib/attendance-auth';
import { logActivity } from '@/lib/activity-logger';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { actor, error: authError } = await getAttendanceActor(request);
  if (authError) return authError;
  if (actor.role !== 'admin') {
    return NextResponse.json({ error: 'Only an admin can approve attendance sessions' }, { status: 403 });
  }

  const { id } = await params;
  const { data: session, error } = await actor.supabase
    .from('attendance_sessions')
    .update({
      approval_status: 'approved',
      approved_by: actor.userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('approval_status', 'pending')
    .select('id, event_name, date, created_at, approval_status')
    .maybeSingle();

  if (error) {
    console.error('Error approving attendance session:', error);
    return NextResponse.json({ error: 'Failed to approve attendance session' }, { status: 500 });
  }
  if (!session) {
    const { data: existing, error: lookupError } = await actor.supabase
      .from('attendance_sessions')
      .select('id, approval_status')
      .eq('id', id)
      .maybeSingle();
    if (lookupError) {
      console.error('Error checking attendance session approval:', lookupError);
      return NextResponse.json({ error: 'Failed to verify attendance session' }, { status: 500 });
    }
    if (!existing) return NextResponse.json({ error: 'Attendance session not found' }, { status: 404 });
    return NextResponse.json({ error: 'Attendance session is already approved' }, { status: 409 });
  }

  await logActivity(actor.supabase, {
    userId: actor.userId,
    action: 'Attendance Session Approved',
    description: `${session.event_name} attendance session was approved`,
    entityType: 'attendance_session',
    entityId: session.id,
  });

  return NextResponse.json({
    session: {
      id: session.id,
      eventName: session.event_name,
      date: session.date,
      createdAt: session.created_at,
      approvalStatus: session.approval_status,
    },
  });
}
