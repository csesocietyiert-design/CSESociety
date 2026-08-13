import { NextRequest, NextResponse } from "next/server";
import { getAllAnnouncements, createAnnouncement } from "@/controllers/announcements";

// GET /api/announcements

export async function GET() {
  try {
    const announcements = await getAllAnnouncements();
    return NextResponse.json({ announcements }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch announcements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/announcements

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, content, author_id, target_role } = body;

  if (!title || !content || !author_id) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  try {
    const announcement = await createAnnouncement({ title, content, author_id, target_role: target_role || "all" });
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to create announcement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

