import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

export type SessionRefreshResult = {
  /** Response that carries any refreshed auth cookies. */
  response: NextResponse;
  /** The authenticated user, or null for anonymous visitors. */
  user: User | null;
};

/**
 * Refresh the Supabase session for an incoming request and return the caller.
 *
 * Auth cookies must be written back on every navigation, otherwise a session can
 * silently expire mid-visit. All routing decisions stay in `src/proxy.ts`.
 */
export async function refreshSession(request: NextRequest): Promise<SessionRefreshResult> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return { response, user: null };
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() validates the JWT with Supabase Auth; getSession() only decodes it.
  // Any failure (network, unreachable Auth service) degrades to anonymous rather
  // than crashing the middleware and surfacing the generic error page.
  let user: User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // Supabase Auth unreachable; treat the visitor as unsigned-in.
  }

  return { response, user };
}