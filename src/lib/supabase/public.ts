import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

let publicClient: SupabaseClient<Database> | null = null;

/**
 * Stateless anonymous client for published public content.
 *
 * It never reads or writes cookies, so public pages remain cacheable (static
 * generation / ISR) instead of becoming dynamic on every request. Row Level
 * Security still restricts it to published rows via the public policies.
 *
 * Do not use this for anything user-specific: use `lib/supabase/server.ts`.
 */
export function createPublicClient(): SupabaseClient<Database> {
  if (!publicClient) {
    const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
    publicClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return publicClient;
}

/** True when public content queries can be attempted at all. */
export function hasPublicContentAccess(): boolean {
  return isSupabaseConfigured();
}