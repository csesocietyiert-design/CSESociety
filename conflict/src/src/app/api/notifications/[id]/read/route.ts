import { NextRequest, NextResponse } from "next/server";
import { markNotificationAsRead } from "@/controllers/notifications";

// POST /api/notifications/[id]/read — mark a single notification as read

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
    await markNotificationAsRead(id, member_id);
    return NextResponse.json({ message: "marked as read" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to mark as read";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
