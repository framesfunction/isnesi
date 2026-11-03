import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server Supabase client bound to the caller's session cookies.
 *
 * Use in Server Components, Server Actions and Route Handlers. Row Level
 * Security still applies, so this client can never exceed the signed-in user's
 * own permissions.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot mutate cookies. The auth middleware
          // refreshes the session instead, so this can be safely ignored.
        }
      },
    },
  });
}


