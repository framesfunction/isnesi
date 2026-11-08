/**
 * SMTP email provider adapter (placeholder).
 *
 * Deno Edge Functions do not ship a bundled SMTP client, and implementing a
 * standards-compliant SMTP sender (TLS, AUTH, MIME, etc.) inside an Edge
 * Function is fragile. Until a dedicated SMTP adapter is wired here, selecting
 * "smtp" fails closed with a clear message.
 *
 * To enable SMTP: implement `smtpAdapter` below using Deno's `std/net` or a
 * fetch-based SMTP relay service, then register it in `providers.ts`.
 */

import type { ProviderAdapter, SendInput, SendResult } from "../providers.ts";

export const smtpAdapter: ProviderAdapter = async (): Promise<SendResult> => {
  return {
    ok: false,
    error:
      "SMTP adapter is not implemented yet. Use resend, brevo, or mailgun instead, or implement the SMTP adapter in supabase/functions/_shared/providers/smtp.ts.",
  };
};
