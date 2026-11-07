import { clientIp, rateLimit, requireSafeguardingCaller } from "../_shared/safeguarding.ts";
import { serviceRequest } from "../_shared/safeguarding.ts";

const RATE = { limit: 10, windowMs: 60 * 60 * 1000 };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = new Set([
  "received",
  "triage",
  "assigned",
  "action_required",
  "monitoring",
  "closed",
  "referred",
]);
const SEVERITIES = new Set(["unassessed", "low", "medium", "high", "urgent"]);

type CaseRow = {
  id: string;
  assigned_to: string | null;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const caller = await requireSafeguardingCaller(request);
  if (!caller.ok) return caller.response;

  const ip = clientIp(request);
  if (!rateLimit(`safeguarding:update-case:${ip}`, RATE.limit, RATE.windowMs).ok) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: {
    caseId?: unknown;
    status?: unknown;
    severity?: unknown;
    assignedTo?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const caseId = typeof body.caseId === "string" ? body.caseId : "";
  if (!UUID_RE.test(caseId)) {
    return Response.json({ error: "Invalid case id" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !STATUSES.has(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.severity !== undefined) {
    if (typeof body.severity !== "string" || !SEVERITIES.has(body.severity)) {
      return Response.json({ error: "Invalid severity" }, { status: 400 });
    }
    updates.severity = body.severity;
  }
  if (body.assignedTo !== undefined) {
    updates.assigned_to =
      body.assignedTo === null || body.assignedTo === ""
        ? null
        : typeof body.assignedTo === "string" && UUID_RE.test(body.assignedTo)
          ? body.assignedTo
          : null;
    if (updates.assigned_to === null && body.assignedTo !== null && body.assignedTo !== "") {
      return Response.json({ error: "Invalid assignee" }, { status: 400 });
    }
  }
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const current = await serviceRequest(
    `/rest/v1/cases?id=eq.${caseId}&select=id,assigned_to&limit=1`,
    { schema: "safeguarding" },
  );
  if (!current.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
  const rows = (current.data as Array<CaseRow>) ?? [];
  const row = rows[0];
  if (!row) {
    return Response.json({ error: "Case not found" }, { status: 404 });
  }

  const isLead = caller.permissions.includes("safeguarding.lead");
  if (!(isLead || row.assigned_to === caller.userId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await serviceRequest(`/rest/v1/cases?id=eq.${caseId}`, {
    schema: "safeguarding",
    method: "PATCH",
    body: updates,
  });
  if (!updated.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  const logged = await serviceRequest("/rest/v1/case_access_events", {
    schema: "safeguarding",
    method: "POST",
    body: {
      case_id: row.id,
      actor_id: caller.userId,
      action: "update",
      purpose: "case_work",
    },
  });
  if (!logged.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true, data: { ok: true } });
});
