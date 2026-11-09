import { NextResponse, type NextRequest } from "next/server";

import { refreshSession } from "@/lib/supabase/session-refresh";

/**
 * Proxy (formerly "middleware" — the Next.js 16 file convention).
 *
 * Responsibilities, in order:
 *  1. Refresh the Supabase session so auth cookies stay valid.
 *  2. Redirect unauthenticated visitors away from /admin.
 *  3. Redirect already-signed-in staff away from /login.
 *  4. Wire a per-request CSP nonce into request headers (for Server Components to
 *     apply to inline script/style tags) and set the Content-Security-Policy
 *     response header.
 *
 * Authorisation (roles and permissions) is intentionally NOT decided here; it is
 * enforced on the server in layouts/actions and by Row Level Security. This layer
 * only distinguishes "signed in" from "anonymous".
 */

const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/login";

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

function isLoginPath(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
}

/** Copy refreshed auth cookies onto a redirect response. */
function withSessionCookies(redirect: NextResponse, source: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

/** Generate a URL-safe base64 nonce for CSP. */
function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/** Build a strict Content-Security-Policy header using a per-request nonce. */
function buildCsp(nonce: string, supabaseUrl: string | null): string {
  const connectSrc = ["'self'"];
  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      connectSrc.push(`${parsed.protocol}//${parsed.hostname}`);
    } catch {
      // Ignore malformed URLs; fall back to self-only connect.
    }
  }
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "object-src 'none'",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const { response, user } = await refreshSession(request);
  const { pathname, search } = request.nextUrl;

  const nonce = makeNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const csp = buildCsp(nonce, supabaseUrl);

  if (isAdminPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const redirect = withSessionCookies(
      NextResponse.redirect(loginUrl),
      response,
    );
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  if (isLoginPath(pathname) && user) {
    const requested = request.nextUrl.searchParams.get("next");
    const destination = requested && requested.startsWith("/admin") ? requested : ADMIN_PREFIX;
    const adminUrl = request.nextUrl.clone();
    const [path, query] = destination.split("?");
    adminUrl.pathname = path;
    adminUrl.search = query ? `?${query}` : "";
    const redirect = withSessionCookies(
      NextResponse.redirect(adminUrl),
      response,
    );
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  const nextResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  nextResponse.headers.set("Content-Security-Policy", csp);
  return nextResponse;
}

export const config = {
  /**
   * Run on navigations only: static assets and the service worker are excluded so
   * they are never subject to an auth round-trip.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|robots.txt|sitemap.xml|icons/|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|txt|xml|webmanifest)$).*)",
  ],
};