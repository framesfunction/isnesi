"use server";

import { headers } from "next/headers";

import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import {
  fieldErrors,
  newsletterSubscribeSchema,
  type NewsletterSubscribeInput,
} from "@/lib/validation/enquiry";
import type { NewsletterFormState } from "@/features/newsletter/state";

const RATE_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

/**
 * Newsletter signup.
 *
 * Subscriber tables deliberately grant no public INSERT, so the browser cannot
 * write them directly. Signup is handled by the `newsletter-subscribe` Supabase
 * Edge Function, which:
 *   1. validates and rate-limits the request,
 *   2. performs double opt-in (confirmation email),
 *   3. records consent evidence (source, policy version, hashed IP),
 *   4. writes with a server-only key.
 *
 * Until that function is deployed this action fails closed with a clear message.
 */
export async function subscribeToNewsletterAction(
  _previous: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const parsed = newsletterSubscribeSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName") ?? "",
    consent:
      formData.get("consent") === "on" || formData.get("consent") === "true",
    locale: formData.get("locale") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const input: NewsletterSubscribeInput = parsed.data;

  if (!input.consent) {
    return {
      status: "error",
      message: "Please confirm that you want to receive occasional updates.",
      fieldErrors: { consent: "We need your consent to send you the newsletter." },
    };
  }

  const requestHeaders = await headers();
  const limit = rateLimit(clientKey(requestHeaders, "newsletter"), RATE_LIMIT);
  if (!limit.ok) {
    return {
      status: "error",
      message: "Too many signup attempts. Please try again later.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Newsletter signup is not connected yet. Please try again soon.",
    };
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/newsletter-subscribe`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        email: input.email,
        fullName: input.fullName ?? null,
        locale: input.locale,
        source: "website",
        consent: true,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[isnesi] newsletter edge function responded", { status: response.status });
      return {
        status: "error",
        message: "We could not complete your signup. Please try again shortly.",
      };
    }
  } catch (error) {
    console.error("[isnesi] newsletter edge function unreachable", error);
    return {
      status: "error",
      message: "Newsletter signup is temporarily unavailable. Please try again shortly.",
    };
  }

  return {
    status: "success",
    message: "Almost there — check your inbox and confirm your subscription.",
  };
}