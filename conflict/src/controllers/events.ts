import { createClient } from "@/lib/supabase/server";
import type {
  CreateEventInput,
  UpdateEventInput,
  AttendanceStatus,
} from "../models/event";

// get all events

export async function getAllEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// get published events only — for members

export async function getPublishedEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("event_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// get a single event by id

export async function getEventById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// create an event

export async function createEvent(input: CreateEventInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// update an event

export async function updateEvent(id: string, input: UpdateEventInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// delete an event

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// register a member for an event

export async function registerForEvent(eventId: string, memberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_registrations")
    .insert({ event_id: eventId, member_id: memberId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// cancel a registration

export async function cancelRegistration(eventId: string, memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("member_id", memberId);
  if (error) throw new Error(error.message);
}

// get registrations for an event

export async function getEventRegistrations(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*, members(id, full_name, roll_number, year)")
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
  return data;
}

// get registrations for a member

export async function getMemberRegistrations(memberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*, events(*)")
    .eq("member_id", memberId)
    .order("registered_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// mark attendance for a member at an event

export async function markAttendance(
  eventId: string,
  memberId: string,
  markedBy: string,
  status: AttendanceStatus
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      { event_id: eventId, member_id: memberId, marked_by: markedBy, status },
      { onConflict: "event_id,member_id" }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// get attendance for an event

export async function getEventAttendance(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("*, members(id, full_name, roll_number)")
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
  return data;
}

// get attendance for a member

export async function getMemberAttendance(memberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("*, events(id, title, event_date)")
    .eq("member_id", memberId)
    .order("marked_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
