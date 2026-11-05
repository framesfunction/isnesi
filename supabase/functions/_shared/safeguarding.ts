const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function response(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

async function getPermissions(userId: string): Promise<string[]> {
  const result = await serviceRequest(
    `/rest/v1/user_roles?user_id=eq.${userId}&select=role:roles(role_permissions(permission:permissions(key)))`,
  );
  if (!result.ok) return [];
  const rows = result.data as Array<{ role: { role_permissions: Array<{ permission: { key: string } }> } }>;
  return rows.flatMap((row) => row.role.role_permissions.map((item) => item.permission.key));
}

export async function requireSafeguardingCaller(
  request: Request,
  requireLead = false,
): Promise<{ ok: true; userId: string; isLead: boolean } | { ok: false; response: Response }> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !supabaseUrl || !serviceRoleKey) {
    return { ok: false, response: response({ error: "Unauthorized" }, 401) };
  }

  const userResult = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceRoleKey, authorization: `Bearer ${token}` },
  });
  if (!userResult.ok) return { ok: false, response: response({ error: "Unauthorized" }, 401) };
  const user = await userResult.json() as { id: string };
  const permissions = await getPermissions(user.id);
  if (!permissions.includes("safeguarding.access")) {
    return { ok: false, response: response({ error: "Forbidden" }, 403) };
  }
  const isLead = permissions.includes("safeguarding.lead");
  if (requireLead && !isLead) return { ok: false, response: response({ error: "Forbidden" }, 403) };
  return { ok: true, userId: user.id, isLead };
}

export async function serviceRequest(
  path: string,
  options: { method?: string; schema?: string; body?: unknown; prefer?: string } = {},
): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  const headers = new Headers({
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: "application/json",
  });
  if (options.schema) headers.set("accept-profile", options.schema);
  if (options.schema && options.method && options.method !== "GET") {
    headers.set("content-profile", options.schema);
  }
  if (options.prefer) headers.set("prefer", options.prefer);
  if (options.body !== undefined) headers.set("content-type", "application/json");

  const result = await fetch(`${supabaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!result.ok) {
    return { ok: false, response: response({ error: "Service unavailable" }, 503) };
  }
  if (result.status === 204) return { ok: true, data: null };
  const text = await result.text();
  return { ok: true, data: text ? JSON.parse(text) : null };
}
