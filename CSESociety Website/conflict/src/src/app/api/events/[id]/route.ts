import { NextRequest, NextResponse } from "next/server";
import { getEventById, updateEvent, deleteEvent } from "@/controllers/events";

// GET /api/events/[id]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const event = await getEventById(id);
    return NextResponse.json({ event }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "event not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

// PATCH /api/events/[id]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  try {
    const event = await updateEvent(id, body);
    return NextResponse.json({ event }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/events/[id]

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteEvent(id);
    return NextResponse.json({ message: "event deleted" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
