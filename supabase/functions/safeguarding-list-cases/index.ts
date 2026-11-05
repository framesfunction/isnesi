import { requireSafeguardingCaller, serviceRequest } from "../_shared/safeguarding.ts";

Deno.serve(async (request) => {
  const auth = await requireSafeguardingCaller(request);
  if (!auth.ok) return auth.response;

  const result = await serviceRequest(
    "/rest/v1/cases?select=id,reference_code,status,severity,assigned_to,received_at&order=received_at.desc&limit=200",
    { schema: "safeguarding" },
  );
  if (!result.ok) return result.response;
  const rows = (result.data as Array<Record<string, unknown>>)
    .filter((row) => auth.isLead || row.assigned_to === auth.userId);

  await serviceRequest("/rest/v1/case_access_events", {
    method: "POST",
    schema: "safeguarding",
    body: rows.map((row) => ({
      case_id: row.id,
      actor_id: auth.userId,
      action: "list_cases",
      purpose: "case workload review",
    })),
  });

  return Response.json({
    cases: rows.map((row) => ({
      id: row.id,
      referenceCode: row.reference_code,
      status: row.status,
      severity: row.severity,
      assignedTo: row.assigned_to,
      receivedAt: row.received_at,
    })),
  });
});
