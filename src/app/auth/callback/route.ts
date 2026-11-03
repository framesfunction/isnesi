import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/validation/auth";

/**
 * Supabase Auth callback (PKCE code exchange).
 *
 * Used by email confirmation, magic links, invitation links and password
 * recovery. The destination is sanitised so the callback cannot be turned into an
 * open redirect.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = safeRedirectPath(url.searchParams.get("next"), "/admin");

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=callback", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.warn("[isnesi] auth callback failed", { code: error.code });
    return NextResponse.redirect(new URL("/login?error=callback", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}