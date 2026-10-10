import { NextResponse } from 'next/server';
import { getAttendanceActor } from '@/lib/attendance-auth';
import { parseSocietyId, recordAttendance } from '@/lib/attendance-checkin';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { actor, error: authError } = await getAttendanceActor(request);
  if (authError) return authError;
  if (actor.role !== 'admin') {
    return NextResponse.json({ error: 'Only an admin can manually mark attendance' }, { status: 403 });
  }

  let body: { societyId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const societyId = parseSocietyId(body.societyId);
  if (!societyId) {
    return NextResponse.json({ error: 'A valid Society ID is required' }, { status: 400 });
  }

  return recordAttendance(actor, (await params).id, societyId);
}
