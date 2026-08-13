import { createClient } from "@/lib/supabase/server";

// get current authenticated user session

export async function getSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

// get the currently logged in user

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

// sign in with email and password

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

// sign out

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// get member record for currently logged in user

export async function getCurrentMember() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*, member_roles(*, roles(*))")
    .eq("user_id", user.id)
    .single();

  if (error) return null;
  return data;
}

// get role name for currently logged in member

export async function getCurrentRole(): Promise<string | null> {
  const member = await getCurrentMember();
  if (!member || !member.member_roles || member.member_roles.length === 0)
    return null;
  return member.member_roles[0].roles.name;
}
