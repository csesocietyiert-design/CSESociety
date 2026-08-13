import { createClient } from "@/lib/supabase/server";
import type { CreateCertificateInput } from "../models/certificate";

export async function getCertificatesForMember(memberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*, events(title, event_date)")
    .eq("member_id", memberId)
    .order("issued_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function issueCertificate(input: CreateCertificateInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getCertificateById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}
