/**
 * MTN Mobile Money Collections client.
 *
 * Used by `donation-create-intent` (request to pay) and `payment-webhook`
 * (status verification). Credentials come from function secrets only:
 *
 *   MOMO_BASE_URL        https://sandbox.momodeveloper.mtn.com or https://proxy.momoapi.mtn.com
 *   MOMO_SUBSCRIPTION_KEY
 *   MOMO_API_USER / MOMO_API_KEY
 *   MOMO_TARGET_ENV      sandbox or the production environment name (e.g. mtnliberia, mtnghana)
 *   MOMO_CURRENCY        defaults to XAF
 *
 * The function env is read lazily so tests can stub it.
 */

export type MoMoConfig = {
  baseUrl: string;
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
  targetEnv: string;
  currency: string;
};

export function readMoMoConfig(env: { get(key: string): string | undefined }): MoMoConfig | null {
  const baseUrl = env.get("MOMO_BASE_URL") ?? "";
  const subscriptionKey = env.get("MOMO_SUBSCRIPTION_KEY") ?? "";
  const apiUser = env.get("MOMO_API_USER") ?? "";
  const apiKey = env.get("MOMO_API_KEY") ?? "";
  const targetEnv = env.get("MOMO_TARGET_ENV") ?? "sandbox";
  if (!baseUrl || !subscriptionKey || !apiUser || !apiKey) return null;
  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    subscriptionKey,
    apiUser,
    apiKey,
    targetEnv,
    currency: env.get("MOMO_CURRENCY") ?? "XAF",
  };
}

let cachedToken: { value: string; expiresAtMs: number } | null = null;

async function getAccessToken(config: MoMoConfig): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAtMs > Date.now() + 30_000) {
    return cachedToken.value;
  }
  const response = await fetch(`${config.baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${config.apiUser}:${config.apiKey}`)}`,
      "ocp-apim-subscription-key": config.subscriptionKey,
      "x-target-environment": config.targetEnv,
    },
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) return null;
  cachedToken = {
    value: body.access_token,
    expiresAtMs: Date.now() + Math.max(60, (body.expires_in ?? 3600)) * 1000,
  };
  return cachedToken.value;
}

function headersFor(config: MoMoConfig, token: string): Headers {
  const headers = new Headers({
    authorization: `Bearer ${token}`,
    "ocp-apim-subscription-key": config.subscriptionKey,
    "x-target-environment": config.targetEnv,
  });
  return headers;
}

/** Normalize a local phone number to MSISDN format (no leading +, digits only). */
export function normalizeMsisdn(phone: string, defaultCountryCode = "237"): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("237") || digits.length > 10) return digits;
  return `${defaultCountryCode}${digits}`;
}

export type RequestToPayResult =
  | { ok: true }
  | { ok: false; status: number };

/** Kick off a payment request. The payer approves the prompt on their phone. */
export async function requestToPay(
  config: MoMoConfig,
  input: { referenceId: string; externalId: string; phoneMsisdn: string; majorAmount: string; reason: string },
): Promise<RequestToPayResult> {
  const token = await getAccessToken(config);
  if (!token) return { ok: false, status: 502 };

  const headers = headersFor(config, token);
  headers.set("x-reference-id", input.referenceId);
  headers.set("content-type", "application/json");
  const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      amount: input.majorAmount,
      currency: config.currency,
      externalId: input.externalId,
      payer: { partyIdType: "MSISDN", partyId: input.phoneMsisdn },
      payerMessage: input.reason,
      payeeNote: input.reason,
    }),
  });
  return { ok: response.ok, status: response.status };
}

export type MoMoStatus = "PENDING" | "SUCCESSFUL" | "FAILED" | "REJECTED" | "TIMEOUT" | "UNKNOWN";

/** Ask the provider what happened to a payment request. Never trust a webhook payload. */
export async function checkStatus(
  config: MoMoConfig,
  referenceId: string,
): Promise<{ ok: true; status: MoMoStatus; externalId: string | null } | { ok: false }> {
  const token = await getAccessToken(config);
  if (!token) return { ok: false };

  const response = await fetch(
    `${config.baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`,
    { headers: headersFor(config, token) },
  );
  if (!response.ok) return { ok: false };
  const body = (await response.json()) as { status?: string; externalId?: string };
  const status = body.status;
  return {
    ok: true,
    status: (["PENDING", "SUCCESSFUL", "FAILED", "REJECTED", "TIMEOUT"].includes(status ?? "")
      ? status
      : "UNKNOWN") as MoMoStatus,
    externalId: typeof body.externalId === "string" ? body.externalId : null,
  };
}
