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
  reference_code: string;
  status: string;
  severity: string;
  assigned_to: string | null;
  received_at: string;
};

function toCaseSummary(row: CaseRow) {
  return {
    id: row.id,
    referenceCode: row.reference_code,
    status: row.status,
    severity: row.severity,
    assignedTo: row.assigned_to,
    receivedAt: row.received_at,
  };
}

function accessAllowed(row: CaseRow | null, userId: string, isLead: boolean): boolean {
  if (!row) return false;
  return isLead || row.assigned_to === userId;
}

async function logAccess(
  caseId: string | null,
  actorId: string,
  action: string,
  purpose: string,
): Promise<boolean> {
  const recorded = await serviceRequest("/rest/v1/case_access_events", {
    schema: "safeguarding",
    method: "POST",
    body: { case_id: caseId, actor_id: actorId, action, purpose },
  });
  return recorded.ok;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const caller = await requireSafeguardingCaller(request);
  if (!caller.ok) return caller.response;

  const ip = clientIp(request);
  if (!rateLimit(`safeguarding:list-cases:${ip}`, RATE.limit, RATE.windowMs).ok) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const isLead = caller.permissions.includes("safeguarding.lead");
  const path = isLead
    ? "/rest/v1/cases?select=id,reference_code,status,severity,assigned_to,received_at&order=received_at.desc&limit=200"
    : `/rest/v1/cases?select=id,reference_code,status,severity,assigned_to,received_at&assigned_to=eq.${caller.userId}&order=received_at.desc&limit=200`;

  const fetched = await serviceRequest(path, { schema: "safeguarding" });
  if (!fetched.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  const rows = (fetched.data as Array<CaseRow>) ?? [];
  const visible = rows.filter((row) => accessAllowed(row, caller.userId, isLead));

  await Promise.all(
    visible.map((row) =>
      logAccess(row.id, caller.userId, "list", "case_review"),
    ),
  );

  return Response.json({
    ok: true,
    data: { cases: visible.map(toCaseSummary) },
  });
});
