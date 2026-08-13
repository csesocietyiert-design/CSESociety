import { createClient } from "@/lib/supabase/server";
import type { RoleName } from "../models/role";

// get all available roles

export async function getAllRoles() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("roles").select("*");
  if (error) throw new Error(error.message);
  return data;
}

// get roles assigned to a member

export async function getMemberRoles(memberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_roles")
    .select("*, roles(*)")
    .eq("member_id", memberId);
  if (error) throw new Error(error.message);
  return data;
}

// assign a role to a member

export async function assignRole(
  memberId: string,
  roleName: RoleName,
  assignedBy: string
) {
  const supabase = await createClient();

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .single();

  if (roleError || !role) throw new Error("Role not found");

  const { data, error } = await supabase
    .from("member_roles")
    .insert({ member_id: memberId, role_id: role.id, assigned_by: assignedBy })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// remove a role from a member

export async function removeRole(memberId: string, roleName: RoleName) {
  const supabase = await createClient();

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .single();

  if (roleError || !role) throw new Error("Role not found");

  const { error } = await supabase
    .from("member_roles")
    .delete()
    .eq("member_id", memberId)
    .eq("role_id", role.id);

  if (error) throw new Error(error.message);
}
