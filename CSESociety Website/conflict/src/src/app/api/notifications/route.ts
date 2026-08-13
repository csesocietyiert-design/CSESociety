import { NextRequest, NextResponse } from "next/server";
import {
  sendNotification,
  getNotificationsForMember,
  getUnreadCount,
} from "@/controllers/notifications";
import type { CreateNotificationInput } from "@/models/notification";

// GET /api/notifications?member_id=xxx

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("member_id");

  if (!memberId) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

  try {
    const notifications = await getNotificationsForMember(memberId);
    const unread = await getUnreadCount(memberId);
    return NextResponse.json({ notifications, unread_count: unread }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/notifications — send a notification

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, message, sender_id, sender_role, recipient_type, recipient_role, specific_society_id } = body;

  if (!title || !message || !sender_id || !sender_role || !recipient_type) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  try {
    const notification = await sendNotification({
      title,
      message,
      sender_id,
      sender_role,
      recipient_type,
      recipient_role,
      specific_society_id,
    } as CreateNotificationInput);
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "failed to send notification";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

