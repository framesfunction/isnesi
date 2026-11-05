import { getPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side client for the restricted safeguarding workflow.
 * The safeguarding schema has no browser grants and is only accessed through
 * Edge Functions with service-role credentials.
 */

export type SafeguardingResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not_deployed" | "unauthorised" | "unavailable" };

export async function callSafeguardingFunction<T>(
  functionName: string,
  payload: Record<string, unknown> = {},
): Promise<SafeguardingResult<T>> {
  if (typeof window !== "undefined") {
    throw new Error("Safeguarding functions can only be called from server code.");
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { ok: false, reason: "unauthorised" };

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
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (response.status === 404) return { ok: false, reason: "not_deployed" };
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: "unauthorised" };
  }
  if (!response.ok) return { ok: false, reason: "unavailable" };

  return { ok: true, data: (await response.json()) as T };
}
