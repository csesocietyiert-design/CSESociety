import { createClient } from "@/lib/supabase/server";
import type { CreateAnnouncementInput } from "../models/announcement";

export async function getAllAnnouncements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*, members(full_name)")
    .eq("is_active", true)
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getAnnouncementById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createAnnouncement(input: CreateAnnouncementInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deactivateAnnouncement(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
