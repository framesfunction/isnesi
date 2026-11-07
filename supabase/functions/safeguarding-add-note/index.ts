import { clientIp, rateLimit, requireSafeguardingCaller } from "../_shared/safeguarding.ts";
import { serviceRequest } from "../_shared/safeguarding.ts";
import { encryptNote } from "../_shared/encrypted.ts";

const RATE = { limit: 10, windowMs: 60 * 60 * 1000 };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  if (!rateLimit(`safeguarding:add-note:${ip}`, RATE.limit, RATE.windowMs).ok) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: { caseId?: unknown; note?: unknown; noteType?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const caseId = typeof body.caseId === "string" ? body.caseId : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const noteType =
    typeof body.noteType === "string" && body.noteType.trim().length > 0
      ? body.noteType.trim()
      : "case_note";
  if (!UUID_RE.test(caseId)) {
    return Response.json({ error: "Invalid case id" }, { status: 400 });
  }
  if (note.length === 0 || note.length > 4000) {
    return Response.json({ error: "Invalid note" }, { status: 400 });
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

  const encrypted = await encryptNote(note, Deno.env);
  if (!encrypted) {
    return Response.json(
      { error: "Safeguarding encryption is not configured on the server." },
      { status: 503 },
    );
  }

  const created = await serviceRequest("/rest/v1/case_notes", {
    schema: "safeguarding",
    method: "POST",
    body: {
      case_id: row.id,
      author_id: caller.userId,
      note_encrypted: encrypted,
      note_type: noteType,
    },
  });
  if (!created.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  const logged = await serviceRequest("/rest/v1/case_access_events", {
    schema: "safeguarding",
    method: "POST",
    body: {
      case_id: row.id,
      actor_id: caller.userId,
      action: "note_added",
      purpose: "case_work",
    },
  });
  if (!logged.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true, data: { ok: true } });
});
