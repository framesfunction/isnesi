import { requireSafeguardingCaller, serviceRequest } from "../_shared/safeguarding.ts";

Deno.serve(async (request) => {
  const auth = await requireSafeguardingCaller(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null) as { caseId?: unknown; status?: unknown; severity?: unknown; assignedTo?: unknown } | null;
  const statuses = ["received", "triage", "assigned", "action_required", "monitoring", "closed", "referred"];
  const severities = ["unassessed", "low", "medium", "high", "urgent"];
  if (!body || typeof body.caseId !== "string" || typeof body.status !== "string" || !statuses.includes(body.status) ||
      typeof body.severity !== "string" || !severities.includes(body.severity)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const current = await serviceRequest(`/rest/v1/cases?id=eq.${body.caseId}&select=id,assigned_to`, { schema: "safeguarding" });
  if (!current.ok) return current.response;
  const row = (current.data as Array<Record<string, unknown>>)[0];
  if (!row || (!auth.isLead && row.assigned_to !== auth.userId)) return Response.json({ error: "Not found" }, { status: 404 });
  if (body.assignedTo !== undefined && !auth.isLead) return Response.json({ error: "Forbidden" }, { status: 403 });

  const patch: Record<string, unknown> = {
    status: body.status,
    severity: body.severity,
    updated_at: new Date().toISOString(),
    closed_at: body.status === "closed" ? new Date().toISOString() : null,
  };
  if (typeof body.assignedTo === "string") {
    patch.assigned_to = body.assignedTo;
    patch.assigned_by = auth.userId;
  }
  const audit = await serviceRequest("/rest/v1/case_access_events", {
    method: "POST", schema: "safeguarding",
    body: { case_id: body.caseId, actor_id: auth.userId, action: "update_case", purpose: "casework" },
  });
  if (!audit.ok) return audit.response;
  const updated = await serviceRequest(`/rest/v1/cases?id=eq.${body.caseId}`, { method: "PATCH", schema: "safeguarding", body: patch });
  return updated.ok ? Response.json({ ok: true }) : updated.response;
});
