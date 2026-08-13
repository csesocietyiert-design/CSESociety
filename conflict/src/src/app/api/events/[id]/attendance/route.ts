import { NextRequest, NextResponse } from "next/server";
import { markAttendance, getEventAttendance } from "@/controllers/events";
import type { AttendanceStatus } from "@/models/event";

// GET /api/events/[id]/attendance

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const attendance = await getEventAttendance(id);
    return NextResponse.json({ attendance }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/events/[id]/attendance — mark attendance

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { member_id, marked_by, status } = body;

  if (!member_id || !marked_by || !status) {
    return NextResponse.json(
      { error: "member_id, marked_by, and status are required" },
      { status: 400 }
    );
  }

  try {
    const record = await markAttendance(id, member_id, marked_by, status as AttendanceStatus);
    return NextResponse.json({ attendance: record }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to mark attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
