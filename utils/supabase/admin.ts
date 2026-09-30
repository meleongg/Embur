import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for privileged server-only operations (e.g. account deletion).
 * Requires SUPABASE_SERVICE_ROLE_KEY — never expose this to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Account deletion requires SUPABASE_SERVICE_ROLE_KEY on the server"
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
