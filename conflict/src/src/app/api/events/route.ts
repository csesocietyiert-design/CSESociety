import { NextRequest, NextResponse } from "next/server";
import { getAllEvents, createEvent } from "@/controllers/events";

// GET /api/events

export async function GET() {
  try {
    const events = await getAllEvents();
    return NextResponse.json({ events }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/events

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, event_date, venue, capacity, created_by, cover_image_url } = body;

  if (!title || !event_date || !created_by) {
    return NextResponse.json({ error: "title, event_date, created_by are required" }, { status: 400 });
  }

  try {
    const event = await createEvent({ title, description, event_date, venue, capacity, created_by, cover_image_url });
    return NextResponse.json({ event }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

