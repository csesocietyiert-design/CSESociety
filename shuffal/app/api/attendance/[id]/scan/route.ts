import { NextResponse } from 'next/server';
import { canManageAttendance, getAttendanceActor } from '@/lib/attendance-auth';
import { parseSocietyIdQr, recordAttendance } from '@/lib/attendance-checkin';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { actor, error: authError } = await getAttendanceActor(request);
  if (authError) return authError;
  if (!canManageAttendance(actor.role)) {
    return NextResponse.json({ error: 'Only the General, Cultural, or Technical Secretary can mark attendance' }, { status: 403 });
  }

  const { id: sessionId } = await params;
  let body: { qrCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const societyId = parseSocietyIdQr(body.qrCode);
  if (!societyId) return NextResponse.json({ error: 'The QR code does not contain a valid Society ID' }, { status: 400 });

  return recordAttendance(actor, sessionId, societyId);
}
