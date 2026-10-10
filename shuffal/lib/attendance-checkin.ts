import { NextResponse } from 'next/server';
import type { AttendanceActor } from '@/lib/attendance-auth';

export function parseSocietyId(value: unknown) {
  if (typeof value !== 'string') return null;
  const societyId = value.trim();
  return /^[a-zA-Z0-9._-]{1,20}$/.test(societyId) ? societyId : null;
}

export function parseSocietyIdQr(value: unknown) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  let societyId = raw;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      const candidate = record.societyId ?? record.society_id ?? record.cseId ?? record.cse_id;
      if (typeof candidate === 'string') societyId = candidate.trim();
    }
  } catch {
    try {
      const parsedUrl = new URL(raw);
      societyId = parsedUrl.searchParams.get('societyId')
        || parsedUrl.searchParams.get('cseId')
        || parsedUrl.searchParams.get('cse_id')
        || raw;
    } catch {
      societyId = raw;
    }
  }

  return parseSocietyId(societyId);
}

export async function recordAttendance(
  actor: AttendanceActor,
  sessionId: string,
  societyId: string
) {
  const { data: session, error: sessionError } = await actor.supabase
    .from('attendance_sessions')
    .select('id')
    .eq('id', sessionId)
    .maybeSingle();
  if (sessionError) {
    console.error('Error checking attendance session:', sessionError);
    return NextResponse.json({ error: 'Failed to verify attendance session' }, { status: 500 });
  }
  if (!session) return NextResponse.json({ error: 'Attendance session not found' }, { status: 404 });

  const { data: attendee, error: attendeeError } = await actor.supabase
    .from('users')
    .select('id, cse_id, name, year, is_verified')
    .ilike('cse_id', societyId)
    .maybeSingle();
  if (attendeeError) {
    console.error('Error finding attendee:', attendeeError);
    return NextResponse.json({ error: 'Failed to find attendee' }, { status: 500 });
  }
  if (!attendee || attendee.is_verified === false) {
    return NextResponse.json({ error: 'No verified member matches that Society ID' }, { status: 404 });
  }

  const { data: record, error: recordError } = await actor.supabase
    .from('attendance_records')
    .insert({
      session_id: sessionId,
      attendee_id: attendee.id,
      marked_by: actor.userId,
      marked_by_role: actor.role,
    })
    .select('id, marked_at')
    .single();
  if (recordError) {
    if (recordError.code === '23505') {
      return NextResponse.json({ error: `${attendee.name} is already marked present` }, { status: 409 });
    }
    console.error('Error recording attendance:', recordError);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }

  return NextResponse.json({
    attendee: {
      id: record.id,
      societyId: attendee.cse_id,
      name: attendee.name,
      year: attendee.year,
      markedAt: record.marked_at,
      markedByRole: actor.role,
    },
  }, { status: 201 });
}
