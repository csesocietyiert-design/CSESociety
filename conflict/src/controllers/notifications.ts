import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { CreateNotificationInput } from "../models/notification";
import type { RoleName } from "../models/role";

// send a notification
// this resolves recipients based on recipient_type and inserts rows into notification_recipients

export async function sendNotification(input: CreateNotificationInput) {
  const adminClient = createAdminClient();

  // create the notification record
  const { data: notification, error: notifError } = await adminClient
    .from("notifications")
    .insert({
      title: input.title,
      message: input.message,
      sender_id: input.sender_id,
      sender_role: input.sender_role,
      recipient_type: input.recipient_type,
      recipient_role: input.recipient_role ?? null,
    })
    .select()
    .single();

  if (notifError) throw new Error(notifError.message);

  // resolve recipient member ids
  let recipientIds: string[] = [];

  if (input.recipient_type === "all") {
    // all active members
    const { data } = await adminClient
      .from("members")
      .select("id")
      .eq("is_active", true);
    recipientIds = (data ?? []).map((m: { id: string }) => m.id);
  } else if (input.recipient_type === "role" && input.recipient_role) {
    // all members with a specific role
    const { data: roleData } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", input.recipient_role)
      .single();

    if (roleData) {
      const { data } = await adminClient
        .from("member_roles")
        .select("member_id")
        .eq("role_id", roleData.id);
      recipientIds = (data ?? []).map((r: { member_id: string }) => r.member_id);
    }
  } else if (input.recipient_type === "specific" && input.specific_society_id) {
    // one specific member by society id
    const { data } = await adminClient
      .from("society_ids")
      .select("member_id")
      .eq("society_id_code", input.specific_society_id)
      .single();
    if (data) recipientIds = [data.member_id];
  }

  if (recipientIds.length === 0) return notification;

  // insert one row per recipient
  const rows = recipientIds.map((id) => ({
    notification_id: notification.id,
    recipient_id: id,
  }));

  const { error: recipError } = await adminClient
    .from("notification_recipients")
    .insert(rows);

  if (recipError) throw new Error(recipError.message);

  return notification;
}

// get notifications for the currently logged in member

export async function getNotificationsForMember(memberId: string, limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_recipients")
    .select("*, notifications(*)")
    .eq("recipient_id", memberId)
    .order("notifications(created_at)", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// get full notification history for a member

export async function getNotificationHistory(memberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_recipients")
    .select("*, notifications(*)")
    .eq("recipient_id", memberId)
    .order("notifications(created_at)", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// mark a notification as read

export async function markNotificationAsRead(
  notificationId: string,
  memberId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_recipients")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("notification_id", notificationId)
    .eq("recipient_id", memberId);
  if (error) throw new Error(error.message);
}

// mark all notifications as read for a member

export async function markAllAsRead(memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_recipients")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", memberId)
    .eq("is_read", false);
  if (error) throw new Error(error.message);
}

// get unread count for a member

export async function getUnreadCount(memberId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notification_recipients")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", memberId)
    .eq("is_read", false);
  if (error) return 0;
  return count ?? 0;
}
