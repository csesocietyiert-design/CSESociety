import { createClient } from "@/lib/supabase/server";
import type { CreateResourceInput } from "../models/resource";

export async function getAllResources() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getResourcesByCategory(category: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function uploadResource(input: CreateResourceInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteResource(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
