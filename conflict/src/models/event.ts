// event

export type EventStatus = "draft" | "published" | "completed" | "cancelled";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string | null;
  capacity: number | null;
  created_by: string;
  status: EventStatus;
  cover_image_url: string | null;
  created_at: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  event_date: string;
  venue?: string;
  capacity?: number;
  created_by: string;
  cover_image_url?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  event_date?: string;
  venue?: string;
  capacity?: number;
  status?: EventStatus;
  cover_image_url?: string;
}

// event registration

export type RegistrationStatus = "registered" | "cancelled" | "attended";

export interface EventRegistration {
  id: string;
  event_id: string;
  member_id: string;
  registered_at: string;
  status: RegistrationStatus;
}

// attendance

export type AttendanceStatus = "present" | "absent";

export interface Attendance {
  id: string;
  event_id: string;
  member_id: string;
  marked_by: string;
  marked_at: string;
  status: AttendanceStatus;
}
