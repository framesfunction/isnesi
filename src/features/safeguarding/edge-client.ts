import { getPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side client for the restricted safeguarding workflow.
 *
 * The `safeguarding` schema is NOT an exposed PostgREST schema and grants nothing
 * to `anon` or `authenticated`. The browser must never query it directly.
 *
 * Every safeguarding interaction goes through a Supabase Edge Function that:
 *   1. verifies the caller's JWT,
 *   2. checks `safeguarding.access` / `safeguarding.lead` and case assignment,
 *   3. writes `safeguarding.case_access_events` before returning any data,
 *   4. performs reads/writes with a server-only service role key.
 *
 * The functions are not deployed yet, so this client fails closed.
 */

export class SafeguardingUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafeguardingUnavailableError";
  }
}

export type SafeguardingResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not_deployed" | "unauthorised" | "unavailable" };

export async function callSafeguardingFunction<T>(
  functionName: string,
  payload: Record<string, unknown> = {},
): Promise<SafeguardingResult<T>> {
  if (typeof window !== "undefined") {
    throw new Error(
      "Safeguarding functions must only be called from server code. Case data must never be fetched in the browser.",
    );
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, reason: "unauthorised" };
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: supabaseAnonKey,
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[isnesi] safeguarding function unreachable", { functionName, error });
    return { ok: false, reason: "unavailable" };
  }

  if (response.status === 404) {
    return { ok: false, reason: "not_deployed" };
  }
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: "unauthorised" };
  }
  if (!response.ok) {
    console.error("[isnesi] safeguarding function failed", {
      functionName,
      status: response.status,
    });
    return { ok: false, reason: "unavailable" };
  }

  return { ok: true, data: (await response.json()) as T };
}