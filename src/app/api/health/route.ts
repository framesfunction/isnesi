import { NextResponse } from "next/server";

import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

/**
 * Operational health endpoint.
 *
 * Deliberately exposes only coarse booleans: no keys, hosts, versions or record
 * counts. Used by uptime monitoring and the admin "integration health" panel.
 */
export async function GET() {
  const supabaseConfigured = isSupabaseConfigured();

  let database: "ok" | "unreachable" | "not_configured" = "not_configured";

  if (supabaseConfigured) {
    try {
      const supabase = createPublicClient();
      const { error } = await supabase
        .from("site_settings")
        .select("key", { count: "exact", head: true })
        .limit(1);
      database = error ? "unreachable" : "ok";
    } catch {
      database = "unreachable";
    }
  }

  const healthy = supabaseConfigured && database === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: {
        supabase: supabaseConfigured ? "configured" : "not_configured",
        database,
        privilegedWorkflows: isServiceRoleConfigured() ? "configured" : "not_configured",
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}