import { clientIp, rateLimit } from "../_shared/caller.ts";

const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };
const ENQUIRY_TYPES = new Set(["volunteer", "partnership", "contact", "media", "other"]);

function validateBody(body: unknown): {
  ok: true;
  data: { enquiryType: string; fullName: string; email: string | null; phone: string | null; message: string; consentToContact: boolean };
} | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request" };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.enquiryType !== "string" || !ENQUIRY_TYPES.has(b.enquiryType)) {
    return { ok: false, error: "Invalid enquiry type" };
  }
  if (typeof b.fullName !== "string" || !b.fullName.trim() || b.fullName.trim().length > 120) {
    return { ok: false, error: "Invalid full name" };
  }
  if (b.email !== undefined && b.email !== null && (typeof b.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) || b.email.length > 254)) {
    return { ok: false, error: "Invalid email" };
  }
  if (b.phone !== undefined && b.phone !== null && (typeof b.phone !== "string" || !/^[+()\d\s-]*$/.test(b.phone) || b.phone.length > 32)) {
    return { ok: false, error: "Invalid phone" };
  }
  if (typeof b.message !== "string" || !b.message.trim() || b.message.trim().length < 20 || b.message.trim().length > 4000) {
    return { ok: false, error: "Invalid message" };
  }
  const consent = b.consent_to_contact === true || b.consentToContact === true || b.consent === true;
  if (!consent) {
    return { ok: false, error: "Consent is required" };
  }
  // Honeypot: real users never submit a company website.
  if (b.company_website || b.companyWebsite) {
    return { ok: true, data: { enquiryType: b.enquiryType as string, fullName: b.fullName.trim(), email: null, phone: null, message: b.message.trim(), consentToContact: true } };
  }

  return {
    ok: true,
    data: {
      enquiryType: b.enquiryType as string,
      fullName: b.fullName.trim(),
      email: typeof b.email === "string" ? b.email.trim() || null : null,
      phone: typeof b.phone === "string" ? b.phone.trim() || null : null,
      message: b.message.trim(),
      consentToContact: true,
    },
  };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const ip = clientIp(request);
  if (!rateLimit(`enquiry:intake:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs).ok) {
    return Response.json({ error: "Too many submissions from this connection. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = validateBody(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const data = parsed.data;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  const created = await serviceRequest("/rest/v1/general_enquiries", {
    method: "POST",
    body: {
      enquiry_type: data.enquiryType,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      message: data.message,
      source: "website",
      consent_to_contact: data.consentToContact,
    },
  });
  if (!created.ok) {
    return Response.json({ error: "We could not save your message. Please try again, or contact us directly." }, { status: 503 });
  }

  const row = (created.data as Array<Record<string, unknown>>)?.[0] as { reference_code?: string } | undefined;
  return Response.json({
    ok: true,
    message: "Thank you — your message has reached the ISNESI team and we will reply soon.",
    referenceCode: row?.reference_code ?? null,
  });
});
