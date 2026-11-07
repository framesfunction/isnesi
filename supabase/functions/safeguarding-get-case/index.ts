import { clientIp, rateLimit, requireSafeguardingCaller } from "../_shared/safeguarding.ts";
import { serviceRequest } from "../_shared/safeguarding.ts";

const RATE = { limit: 10, windowMs: 60 * 60 * 1000 };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CaseRow = {
  id: string;
  reference_code: string;
  status: string;
  severity: string;
  assigned_to: string | null;
  received_at: string;
  retention_review_at: string | null;
};

function toCaseDetail(row: CaseRow) {
  return {
    id: row.id,
    referenceCode: row.reference_code,
    status: row.status,
    severity: row.severity,
    assignedTo: row.assigned_to,
    receivedAt: row.received_at,
    retentionReviewAt: row.retention_review_at,
  };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const caller = await requireSafeguardingCaller(request);
  if (!caller.ok) return caller.response;

  const ip = clientIp(request);
  if (!rateLimit(`safeguarding:get-case:${ip}`, RATE.limit, RATE.windowMs).ok) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: { caseId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const caseId = typeof body.caseId === "string" ? body.caseId : "";
  if (!UUID_RE.test(caseId)) {
    return Response.json({ error: "Invalid case id" }, { status: 400 });
  }

  const fetched = await serviceRequest(
    `/rest/v1/cases?id=eq.${caseId}&select=id,reference_code,status,severity,assigned_to,received_at,retention_review_at&limit=1`,
    { schema: "safeguarding" },
  );
  if (!fetched.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
  const rows = (fetched.data as Array<CaseRow>) ?? [];
  const row = rows[0];
  if (!row) {
    return Response.json({ error: "Case not found" }, { status: 404 });
  }

  const isLead = caller.permissions.includes("safeguarding.lead");
  if (!((isLead || row.assigned_to === caller.userId) as boolean)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const logged = await serviceRequest("/rest/v1/case_access_events", {
    schema: "safeguarding",
    method: "POST",
    body: { case_id: row.id, actor_id: caller.userId, action: "view", purpose: "case_review" },
  });
  if (!logged.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true, data: { case: toCaseDetail(row) } });
});
