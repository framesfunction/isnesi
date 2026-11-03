"use server";

import { headers } from "next/headers";

import { isSupabaseConfigured } from "@/lib/env";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { enquirySchema, fieldErrors } from "@/lib/validation/enquiry";
import type { EnquiryFormState } from "@/features/enquiries/state";

const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

/**
 * Public enquiry intake.
 *
 * Security notes:
 *  - The insert deliberately omits `status`, `assigned_to` and `reference_code`;
 *    the database defaults and RLS policy (`consent_to_contact = true`,
 *    `status = 'new'`, `assigned_to is null`) reject anything else.
 *  - No `.select()` is chained: anonymous visitors have no SELECT grant on
 *    `general_enquiries`, so the request uses `Prefer: return=minimal`.
 *  - Child safeguarding referrals must never be submitted through this form. The
 *    public referral route stays disabled until the dedicated Edge Function and
 *    the restricted workflow are in place.
 *  - Before public launch this moves behind the rate-limited intake Edge Function.
 */
export async function submitEnquiryAction(
  _previous: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  const parsed = enquirySchema.safeParse({
    enquiryType: formData.get("enquiryType"),
    fullName: formData.get("fullName"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    message: formData.get("message"),
    consentToContact:
      formData.get("consentToContact") === "on" || formData.get("consentToContact") === "true",
    companyWebsite: formData.get("companyWebsite") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  if (!data.consentToContact) {
    return {
      status: "error",
      message: "We need your permission before we can reply.",
      fieldErrors: {
        consentToContact: "Please confirm that we may contact you about this enquiry.",
      },
    };
  }

  // Honeypot: accept silently so bots do not learn the rule.
  if (data.companyWebsite) {
    return { status: "success", message: "Thank you — your message has reached the ISNESI team." };
  }

  const requestHeaders = await headers();
  const limit = rateLimit(clientKey(requestHeaders, "enquiry"), RATE_LIMIT);
  if (!limit.ok) {
    return {
      status: "error",
      message: "Too many submissions from this connection. Please try again later.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "The enquiry service is not configured yet. Please contact us by phone or email.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("general_enquiries").insert({
    enquiry_type: data.enquiryType,
    full_name: data.fullName,
    email: data.email ? data.email : null,
    phone: data.phone ? data.phone : null,
    message: data.message,
    source: "website",
    consent_to_contact: true,
  });

  if (error) {
    console.error("[isnesi] enquiry submission failed", { code: error.code });
    return {
      status: "error",
      message: "We could not save your message. Please try again, or contact us directly.",
    };
  }

  return {
    status: "success",
    message: "Thank you — your message has reached the ISNESI team and we will reply soon.",
  };
}