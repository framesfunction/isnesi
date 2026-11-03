import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Guard against accidentally bundling privileged code into the browser.
 * `typeof window` is undefined in every server runtime (Node, Edge) and defined
 * in the browser.
 */
function assertServerRuntime(context: string): void {
  if (typeof window !== "undefined") {
    throw new Error(
      `${context} can only run on the server. The service role key must never reach the browser.`,
    );
  }
}

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely.
 *
 * Permitted uses (all of which must first verify the caller and their
 * permissions server-side, and write an audit record):
 *  - Public intake that the schema deliberately does not expose for insert
 *    (for example newsletter double opt-in) until the rate-limited Edge
 *    Function exists.
 *  - Privileged maintenance jobs.
 *  - Safeguarding casework inside server-side Edge Functions.
 *
 * Never import this module from a Client Component.
 */
export function createAdminClient() {
  assertServerRuntime("createAdminClient()");
  const { supabaseUrl } = getPublicEnv();
  const { serviceRoleKey } = getServerEnv();

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/** True when privileged server-side clients can be constructed. */
export function isAdminClientAvailable(): boolean {
  try {
    getPublicEnv();
    getServerEnv();
    return true;
  } catch {
    return false;
  }
}
