import { NextRequest, NextResponse } from "next/server";
import { registerForEvent, cancelRegistration, getEventRegistrations } from "@/controllers/events";

// GET /api/events/[id]/register — get registrations for this event

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const registrations = await getEventRegistrations(id);
    return NextResponse.json({ registrations }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch registrations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/events/[id]/register — register a member

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { member_id } = body;

  if (!member_id) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

  try {
    const registration = await registerForEvent(id, member_id);
    return NextResponse.json({ registration }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/events/[id]/register — cancel registration

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { member_id } = body;

  if (!member_id) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

  try {
    await cancelRegistration(id, member_id);
    return NextResponse.json({ message: "registration cancelled" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "cancellation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
