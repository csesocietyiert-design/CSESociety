import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { CreateMemberInput, UpdateMemberInput } from "../models/member";

// get all members — for admin, faculty, executives

export async function getAllMembers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*, society_ids(*), member_roles(*, roles(*))")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw new Error(error.message);
  return data;
}

// get a single member by id

export async function getMemberById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*, society_ids(*), member_roles(*, roles(*))")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// get member by user_id (from auth session)

export async function getMemberByUserId(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*, society_ids(*), member_roles(*, roles(*))")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
}

// get member by society id code (e.g. 23F2601)

export async function getMemberBySocietyId(societyIdCode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("society_ids")
    .select("*, members(*)")
    .eq("society_id_code", societyIdCode)
    .single();
  if (error) return null;
  return data?.members ?? null;
}

// get members by year — for year representatives

export async function getMembersByYear(year: 1 | 2 | 3 | 4) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*, society_ids(*)")
    .eq("year", year)
    .eq("is_active", true)
    .order("full_name");
  if (error) throw new Error(error.message);
  return data;
}

// create a new member — uses admin client to also create auth user

export async function createMember(
  input: CreateMemberInput,
  email: string,
  password: string,
  societyIdCode: string
) {
  const adminClient = createAdminClient();

  // create auth user
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) throw new Error(authError.message);

  const userId = authData.user.id;

  // create user record
  const { error: userError } = await adminClient
    .from("users")
    .insert({ id: userId, email });

  if (userError) throw new Error(userError.message);

  // create member record
  const { data: member, error: memberError } = await adminClient
    .from("members")
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (memberError) throw new Error(memberError.message);

  // assign member role by default
  const { data: roleData } = await adminClient
    .from("roles")
    .select("id")
    .eq("name", "member")
    .single();

  if (roleData) {
    await adminClient.from("member_roles").insert({
      member_id: member.id,
      role_id: roleData.id,
    });
  }

  // issue society id
  await adminClient.from("society_ids").insert({
    member_id: member.id,
    society_id_code: societyIdCode,
  });

  return member;
}

// update member details

export async function updateMember(id: string, input: UpdateMemberInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// deactivate a member (soft delete)

export async function deactivateMember(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
