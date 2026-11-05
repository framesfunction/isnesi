import { requireSafeguardingCaller, serviceRequest } from "../_shared/safeguarding.ts";

Deno.serve(async (request) => {
  const auth = await requireSafeguardingCaller(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null) as { caseId?: unknown; note?: unknown; noteType?: unknown } | null;
  if (!body || typeof body.caseId !== "string" || typeof body.note !== "string" || !body.note.trim() || body.note.length > 20_000) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const current = await serviceRequest(`/rest/v1/cases?id=eq.${body.caseId}&select=id,assigned_to`, { schema: "safeguarding" });
  if (!current.ok) return current.response;
  const row = (current.data as Array<Record<string, unknown>>)[0];
  if (!row || (!auth.isLead && row.assigned_to !== auth.userId)) return Response.json({ error: "Not found" }, { status: 404 });

  const audit = await serviceRequest("/rest/v1/case_access_events", {
    method: "POST", schema: "safeguarding",
    body: { case_id: body.caseId, actor_id: auth.userId, action: "add_note", purpose: "casework" },
  });
  if (!audit.ok) return audit.response;

  const keyMaterial = Deno.env.get("SAFEGUARDING_NOTE_ENCRYPTION_KEY");
  if (!keyMaterial) return Response.json({ error: "Encryption unavailable" }, { status: 503 });
  const keyBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(keyMaterial));
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    new TextEncoder().encode(body.note),
  );
  const bytes = Array.from(new Uint8Array([...iv, ...new Uint8Array(ciphertext)]));
  const saved = await serviceRequest("/rest/v1/case_notes", {
    method: "POST",
    schema: "safeguarding",
    body: { case_id: body.caseId, author_id: auth.userId, note_encrypted: bytes, note_type: typeof body.noteType === "string" ? body.noteType.slice(0, 60) : "case_note" },
  });
  return saved.ok ? Response.json({ ok: true }) : saved.response;
});
