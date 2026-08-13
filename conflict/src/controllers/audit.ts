import { createAdminClient } from "@/lib/supabase/server";
import type { CreateAuditLogInput } from "../models/audit";

// log an action — uses admin client, bypasses RLS

export async function logAction(input: CreateAuditLogInput) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("audit_logs").insert(input);
  if (error) {
    // audit logging should never break the main operation
    console.error("audit log failed:", error.message);
  }
}

// get all audit logs — admin and faculty only

export async function getAuditLogs(limit = 100) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("audit_logs")
    .select("*, members(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}
