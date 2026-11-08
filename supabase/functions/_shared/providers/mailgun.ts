/**
 * Mailgun email provider adapter.
 *
 * Reads: MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM (function secrets).
 * Posts to https://api.mailgun.net/v3/{domain}/messages with basic auth.
 */

import type { ProviderAdapter, SendInput, SendResult } from "../providers.ts";

export const mailgunAdapter: ProviderAdapter = async (
  input: SendInput,
): Promise<SendResult> => {
  const apiKey = Deno.env.get("MAILGUN_API_KEY") ?? "";
  const domain = Deno.env.get("MAILGUN_DOMAIN") ?? "";
  const from = Deno.env.get("MAILGUN_FROM") ?? input.from;
  if (!apiKey || !domain) {
    return {
      ok: false,
      error: "MAILGUN_API_KEY and MAILGUN_DOMAIN must be configured",
    };
  }

  const form = new FormData();
  form.append("from", from);
  form.append("to", input.to);
  form.append("subject", input.subject);
  form.append("text", input.text);
  if (input.html) form.append("html", input.html);

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`api:${apiKey}`)}`,
    },
    body: form,
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
      error: `Mailgun API error (${response.status})${detail ? `: ${detail}` : ""}`,
    };
  }

  const body = (await response.json()) as { id?: string };
  return { ok: true, providerMessageId: body.id ?? undefined };
};
