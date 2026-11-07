import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";

/**
 * Scheduled publishing cron.
 *
 * Flips editorial items parked in `scheduled` to `published` once their
 * `scheduled_at` has passed. Intended to be invoked by a cron trigger (for
 * example Vercel Cron) with a bearer secret matching `CRON_SECRET`; without
 * the secret the route is unreachable.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest): Promise<Response> {
  const secret = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
