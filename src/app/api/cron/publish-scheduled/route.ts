import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";

import { createAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { timingSafeEqual } from "@/lib/security/timing-safe";

/**
 * Scheduled publishing cron.
 *
 * Flips editorial items parked in `scheduled` to `published` once their
 * `scheduled_at` has passed. Intended to be invoked by a cron trigger (for
 * example Vercel Cron) with a bearer secret matching `CRON_SECRET`.
 *
 * Fails closed (503) when `CRON_SECRET` is not configured. Compares the
 * secret in constant time. Rate-limits invocations per IP to prevent
 * brute-forcing the secret.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CRON_RATE = { limit: 30, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest): Promise<Response> {
  const configured = process.env.CRON_SECRET ?? "";
  if (!configured) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const secret = request.headers.get("authorization");
  const expected = `Bearer ${configured}`;
  if (!secret || !timingSafeEqual(secret, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit cron invocations per IP to prevent brute-forcing the secret.
  const requestHeaders = await headers();
  const limit = rateLimit(clientKey(requestHeaders, "cron"), CRON_RATE);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  if (!isAdminClientAvailable()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("content_items")
    .update({ status: "published", published_at: now })
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .is("published_at", null)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    published: (data ?? []).length,
    at: now,
  });
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
