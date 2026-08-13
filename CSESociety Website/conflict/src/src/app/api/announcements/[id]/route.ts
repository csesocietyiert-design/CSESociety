import { NextRequest, NextResponse } from "next/server";
import { getAnnouncementById, deactivateAnnouncement } from "@/controllers/announcements";

// GET /api/announcements/[id]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const announcement = await getAnnouncementById(id);
    return NextResponse.json({ announcement }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "announcement not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

// DELETE /api/announcements/[id] — deactivate

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deactivateAnnouncement(id);
    return NextResponse.json({ message: "announcement deactivated" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "deactivation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
