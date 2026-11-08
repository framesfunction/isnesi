/**
 * Brevo (Sendinblue) email provider adapter.
 *
 * Reads: BREVO_API_KEY, BREVO_FROM_NAME, BREVO_FROM_EMAIL (function secrets).
 * Posts to https://api.brevo.com/v3/smtp/email.
 */

import type { ProviderAdapter, SendInput, SendResult } from "../providers.ts";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const brevoAdapter: ProviderAdapter = async (
  input: SendInput,
): Promise<SendResult> => {
  const apiKey = Deno.env.get("BREVO_API_KEY") ?? "";
  const fromName = Deno.env.get("BREVO_FROM_NAME") ?? "ISNESI";
  const fromEmail = Deno.env.get("BREVO_FROM_EMAIL") ?? input.from;
  if (!apiKey) {
    return { ok: false, error: "BREVO_API_KEY is not configured" };
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": apiKey,
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: input.to }],
      subject: input.subject,
      textContent: input.text,
      ...(input.html ? { htmlContent: input.html } : {}),
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { message?: string };
      detail = body.message ?? "";
    } catch {
      // ignore parse errors
    }
    return {
      ok: false,
      error: `Brevo API error (${response.status})${detail ? `: ${detail}` : ""}`,
    };
  }

  const body = (await response.json()) as { messageId?: string };
  return { ok: true, providerMessageId: body.messageId ?? undefined };
};
