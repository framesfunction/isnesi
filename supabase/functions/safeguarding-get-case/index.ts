import { requireSafeguardingCaller, serviceRequest } from "../_shared/safeguarding.ts";

Deno.serve(async (request) => {
  const auth = await requireSafeguardingCaller(request);
  if (!auth.ok) return auth.response;

  let body: { caseId?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof body.caseId !== "string") return Response.json({ error: "Invalid case" }, { status: 400 });

  const result = await serviceRequest(
    `/rest/v1/cases?id=eq.${body.caseId}&select=id,reference_code,status,severity,assigned_to,received_at,closed_at,retention_review_at`,
    { schema: "safeguarding" },
  );
  if (!result.ok) return result.response;
  const caseRow = (result.data as Array<Record<string, unknown>>)[0];
  if (!caseRow || (!auth.isLead && caseRow.assigned_to !== auth.userId)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const audit = await serviceRequest("/rest/v1/case_access_events", {
    method: "POST",
    schema: "safeguarding",
    body: { case_id: caseRow.id, actor_id: auth.userId, action: "view_case", purpose: "casework" },
  });
  if (!audit.ok) return audit.response;

  const [intake, notes] = await Promise.all([
    serviceRequest(`/rest/v1/intake_details?case_id=eq.${caseRow.id}&select=concern_type,location_general,immediate_risk,safe_contact_instructions,consent_or_legal_basis`, { schema: "safeguarding" }),
    serviceRequest(`/rest/v1/case_notes?case_id=eq.${caseRow.id}&select=id,note_type,created_at&order=created_at.desc`, { schema: "safeguarding" }),
  ]);
  if (!intake.ok || !notes.ok) return Response.json({ error: "Unavailable" }, { status: 503 });

  return Response.json({
    case: {
      id: caseRow.id, referenceCode: caseRow.reference_code, status: caseRow.status,
      severity: caseRow.severity, assignedTo: caseRow.assigned_to,
      receivedAt: caseRow.received_at, closedAt: caseRow.closed_at,
      retentionReviewAt: caseRow.retention_review_at,
    },
    intake: (intake.data as Array<unknown>)[0] ?? null,
    notes: notes.data ?? [],
  });
});
