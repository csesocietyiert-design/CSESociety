import { NextRequest, NextResponse } from "next/server";
import { getNotificationHistory, markAllAsRead } from "@/controllers/notifications";

// GET /api/notifications/history?member_id=xxx

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("member_id");

  if (!memberId) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

  try {
    const history = await getNotificationHistory(memberId);
    return NextResponse.json({ history }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/notifications/history — mark all as read

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { member_id } = body;

  if (!member_id) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

  try {
    await markAllAsRead(member_id);
    return NextResponse.json({ message: "all marked as read" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to mark all as read";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

