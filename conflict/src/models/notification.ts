import type { RoleName } from "./role";

// recipient type for a notification

export type RecipientType = "all" | "role" | "year_rep" | "specific";

export interface Notification {
  id: string;
  title: string;
  message: string;
  sender_id: string;
  sender_role: RoleName;
  recipient_type: RecipientType;
  recipient_role: RoleName | null;
  created_at: string;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  sender_id: string;
  sender_role: RoleName;
  recipient_type: RecipientType;
  recipient_role?: RoleName;
  specific_society_id?: string;
}

// one row per recipient per notification — tracks individual read status

export interface NotificationRecipient {
  id: string;
  notification_id: string;
  recipient_id: string;
  is_read: boolean;
  read_at: string | null;
}

// combined shape returned to the client

export interface NotificationWithStatus extends Notification {
  is_read: boolean;
  read_at: string | null;
}
