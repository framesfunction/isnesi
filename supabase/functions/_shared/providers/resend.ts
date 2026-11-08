/**
 * Resend email provider adapter.
 *
 * Reads: RESEND_API_KEY, RESEND_FROM (function secrets).
 * Posts to https://api.resend.com/emails.
 */

import type { ProviderAdapter, SendInput, SendResult } from "../providers.ts";

const RESEND_API_URL = "https://api.resend.com/emails";

export const resendAdapter: ProviderAdapter = async (
  input: SendInput,
): Promise<SendResult> => {
  const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const from = Deno.env.get("RESEND_FROM") ?? input.from;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
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
      error: `Resend API error (${response.status})${detail ? `: ${detail}` : ""}`,
    };
  }

  const body = (await response.json()) as { id?: string };
  return { ok: true, providerMessageId: body.id ?? undefined };
};
