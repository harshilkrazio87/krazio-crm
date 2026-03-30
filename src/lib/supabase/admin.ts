import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with service role. Use for admin operations (create user, bypass RLS).
 * Requires SUPABASE_SERVICE_ROLE_KEY in env. Never expose this client to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
