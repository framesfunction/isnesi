/**
 * Newsletter provider adapters.
 *
 * Each adapter converts a common `SendInput` into a provider-specific API call
 * and returns a normalized `SendResult`. Providers are selected by the
 * `NEWSLETTER_PROVIDER` function secret. Unknown or unconfigured providers
 * fail closed.
 */

export type ProviderName = "resend" | "brevo" | "mailgun" | "smtp";

export type SendResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
};

export type SendInput = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
};

export type ProviderAdapter = (input: SendInput) => Promise<SendResult>;

import { resendAdapter } from "./providers/resend.ts";
import { brevoAdapter } from "./providers/brevo.ts";
import { mailgunAdapter } from "./providers/mailgun.ts";
import { smtpAdapter } from "./providers/smtp.ts";

const adapters: Record<string, ProviderAdapter | null> = {
  resend: resendAdapter,
  brevo: brevoAdapter,
  mailgun: mailgunAdapter,
  smtp: smtpAdapter,
};

/** Register a provider adapter by name. */
export function registerProvider(name: string, adapter: ProviderAdapter): void {
  adapters[name] = adapter;
}

/** Resolve a provider adapter by name, or null when unknown/unconfigured. */
export function getProvider(name: string): ProviderAdapter | null {
  return adapters[name] ?? null;
}
