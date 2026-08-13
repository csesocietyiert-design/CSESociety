import { createBrowserClient } from "@supabase/ssr";

// browser client — uses anon key, for client-side session reading only
// do not use this for sensitive data queries

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
