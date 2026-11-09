/**
 * Amazon SES email provider adapter.
 *
 * Sends via the SES v2 API (`POST /v2/email/outbound-emails`) using AWS
 * Signature V4 request signing, implemented with `fetch` and
 * `crypto.subtle` — no extra dependency.
 *
 * Reads: SES_REGION, SES_ACCESS_KEY_ID, SES_SECRET_ACCESS_KEY (function
 * secrets). Default region `us-east-1` when SES_REGION is unset.
 *
 * Implementation note: this adapter is code-complete and structurally tested,
 * but it has not been exercised against live AWS (no credentials in this
 * environment). It fails closed — a signing or network error returns
 * `{ ok: false }` rather than silently succeeding.
 */

import type { ProviderAdapter, SendInput, SendResult } from "../providers.ts";

const SES_SERVICE = "es";
const SES_API_VERSION = "v2";
const DEFAULT_REGION = "us-east-1";

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

async function hmacSha256(
  key: Uint8Array,
  data: string | Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, buf);
  return new Uint8Array(sig);
}

async function awsSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<Uint8Array> {
  const kDate = await hmacSha256(
    new TextEncoder().encode(`AWS4${secretAccessKey}`),
    dateStamp,
  );
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

function isoDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function signV4Request({
  region,
  accessKeyId,
  secretAccessKey,
  method,
  host,
  path,
  body,
  date,
}: {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  method: string;
  host: string;
  path: string;
  body: Uint8Array;
  date: Date;
}): Promise<{ authorization: string; "x-amz-date": string }> {
  const amzDate = isoDate(date);
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = hex(await sha256(body));
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-date";

  const canonicalRequest = [
    method.toUpperCase(),
    path,
    "", // query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${SES_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hex(await sha256(new TextEncoder().encode(canonicalRequest))),
  ].join("\n");

  const signingKey = await awsSigningKey(
    secretAccessKey,
    dateStamp,
    region,
    SES_SERVICE,
  );
  const signature = hex(await hmacSha256(signingKey, stringToSign));

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return { authorization, "x-amz-date": amzDate };
}

export const sesAdapter: ProviderAdapter = async (
  input: SendInput,
): Promise<SendResult> => {
  const region = Deno.env.get("SES_REGION") ?? DEFAULT_REGION;
  const accessKeyId = Deno.env.get("SES_ACCESS_KEY_ID") ?? "";
  const secretAccessKey = Deno.env.get("SES_SECRET_ACCESS_KEY") ?? "";
  const from = Deno.env.get("SES_FROM") ?? input.from;

  if (!accessKeyId || !secretAccessKey) {
    return {
      ok: false,
      error: "SES credentials are not configured (SES_ACCESS_KEY_ID, SES_SECRET_ACCESS_KEY)",
    };
  }

  const host = `email.${region}.amazonaws.com`;
  const path = `/${SES_API_VERSION}/email/outbound-emails`;
  const url = `https://${host}${path}`;
  const date = new Date();

  const body = new TextEncoder().encode(
    JSON.stringify({
      FromEmailAddress: from,
      Destination: { ToAddresses: [input.to] },
      Content: {
        Simple: {
          Subject: { Data: input.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: input.text, Charset: "UTF-8" },
            ...(input.html ? { Html: { Data: input.html, Charset: "UTF-8" } } : {}),
          },
        },
      },
    }),
  );

  let authorization: string;
  let xAmzDate: string;
  try {
    ({ authorization, "x-amz-date": xAmzDate } = await signV4Request({
      region,
      accessKeyId,
      secretAccessKey,
      method: "POST",
      host,
      path,
      body,
      date,
    }));
  } catch (error) {
    return {
      ok: false,
      error: `SES signing failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization,
        "content-type": "application/json",
        host,
        "x-amz-date": xAmzDate,
      },
      body,
    });
    if (!response.ok) {
      let detail = "";
      try {
        const parsed = (await response.json()) as { Message?: string; Error?: { Message?: string } };
        detail = parsed.Message ?? parsed.Error?.Message ?? "";
      } catch {
        // ignore parse errors
      }
      return {
        ok: false,
        error: `SES API error (${response.status})${detail ? `: ${detail}` : ""}`,
      };
    }
    const parsed = (await response.json()) as { MessageId?: string } | null;
    return { ok: true, providerMessageId: parsed?.MessageId ?? undefined };
  } catch (error) {
    return {
      ok: false,
      error: `SES request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
