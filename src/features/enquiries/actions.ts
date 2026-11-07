"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { enquirySchema, fieldErrors } from "@/lib/validation/enquiry";
import {
  assignEnquirySchema,
  deleteEnquiryAssignmentSchema,
  deleteEnquiryMessageSchema,
  deleteEnquiryNoteSchema,
  deleteEnquirySchema,
  enquiryMessageSchema,
  enquiryNoteSchema,
  enquiryStatusSchema,
} from "@/lib/validation/engagement";
import { fieldErrors as formFieldErrors } from "@/lib/validation/form";
import type { EnquiryFormState } from "@/features/enquiries/state";

const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

/**
 * Public enquiry intake.
 *
 * Submission is routed through the `enquiry-intake` Edge Function when it is
 * deployed; until then the action falls back to a direct server-side insert so
 * the form keeps working in development and pre-launch environments.
 *
 * Security notes:
 *  - The Edge Function insert deliberately omits `status`, `assigned_to` and
 *    `reference_code`; the database defaults and RLS policy reject anything
 *    else.
 *  - Child safeguarding referrals must never be submitted through this form.
 *    The public referral route stays disabled until the dedicated Edge Function
 *    and the restricted workflow are in place.
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

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  // Route through the enquiry-intake Edge Function when deployed; fall back to
  // a direct server-side insert until then (404 = not deployed yet).
  let efResponse: Response;
  try {
    efResponse = await fetch(`${supabaseUrl}/functions/v1/enquiry-intake`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        enquiryType: data.enquiryType,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        message: data.message,
        consentToContact: data.consentToContact,
      }),
    });
  } catch {
    efResponse = null as unknown as Response;
  }

  if (efResponse && efResponse.status === 404) {
    // Edge Function not deployed yet: fall back to direct insert.
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

  if (!efResponse || !efResponse.ok) {
    return {
      status: "error",
      message: "We could not save your message. Please try again, or contact us directly.",
    };
  }

  const result = (await efResponse.json()) as {
    ok: boolean;
    message?: string;
    referenceCode?: string | null;
  };
  if (!result.ok) {
    return {
      status: "error",
      message: result.message ?? "We could not save your message. Please try again, or contact us directly.",
    };
  }

  return {
    status: "success",
    message: result.message ?? "Thank you — your message has reached the ISNESI team and we will reply soon.",
  };
}

/* -------------------------------------------------------------------------- */
/*                        Admin workflow (enquiries.manage)                    */
/* -------------------------------------------------------------------------- */

function revalidateEnquiries(enquiryId?: string): void {
  revalidatePath("/admin/enquiries");
  if (enquiryId) revalidatePath(`/admin/enquiries/${enquiryId}`);
}

/**
 * Assign or reassign an enquiry. Every change writes an `enquiry_assignments`
 * audit row, and the new assignee gets an in-app notification pointing back at
 * the secure application (spec 7.3: notifications never carry case content).
 */
export async function assignEnquiryAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("enquiries.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = assignEnquirySchema.safeParse({
    enquiryId: formData.get("enquiryId"),
    assigneeId: formData.get("assigneeId"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", formFieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  const { data: enquiry } = await supabase
    .from("general_enquiries")
    .select("id, status, assigned_to")
    .eq("id", input.enquiryId)
    .maybeSingle();
  if (!enquiry) return actionForbidden();

  const { error: updateError } = await supabase
    .from("general_enquiries")
    .update({
      assigned_to: input.assigneeId,
      status: enquiry.status === "new" || enquiry.status === "triaged" ? "assigned" : enquiry.status,
    })
    .eq("id", input.enquiryId);
  if (updateError) return dbErrorMessage(updateError, "enquiry assignment");

  const { error: auditError } = await supabase.from("enquiry_assignments").insert({
    enquiry_id: input.enquiryId,
    assigned_from: enquiry.assigned_to,
    assigned_to: input.assigneeId,
    reason: input.reason,
    assigned_by: user.id,
  });
  if (auditError) return dbErrorMessage(auditError, "enquiry assignment record");

  await supabase.from("notifications").insert({
    recipient_user_id: input.assigneeId,
    notification_type: "enquiry_assigned",
    channel: "in_app",
    related_entity_type: "general_enquiry",
    related_entity_id: input.enquiryId,
  });

  revalidateEnquiries(input.enquiryId);
  return actionOk("Enquiry assigned.");
}

export async function updateEnquiryStatusAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("enquiries.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = enquiryStatusSchema.safeParse({
    enquiryId: formData.get("enquiryId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { data: enquiry } = await supabase
    .from("general_enquiries")
    .select("id, status")
    .eq("id", parsed.data.enquiryId)
    .maybeSingle();
  if (!enquiry) return actionForbidden();

  // Closing stamps the closure date; reopening clears it.
  const closing = parsed.data.status === "closed";
  const wasClosed = enquiry.status === "closed";

  const { error } = await supabase
    .from("general_enquiries")
    .update({
      status: parsed.data.status,
      ...(closing && !wasClosed ? { closed_at: new Date().toISOString() } : {}),
      ...(!closing && wasClosed ? { closed_at: null } : {}),
    })
    .eq("id", parsed.data.enquiryId);
  if (error) return dbErrorMessage(error, "enquiry status");

  revalidateEnquiries(parsed.data.enquiryId);
  return actionOk("Status updated.");
}

export async function addEnquiryNoteAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("enquiries.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = enquiryNoteSchema.safeParse({
    enquiryId: formData.get("enquiryId"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", formFieldErrors(parsed.error));
  }

  const supabase = await createClient();

  const { data: enquiry } = await supabase
    .from("general_enquiries")
    .select("id")
    .eq("id", parsed.data.enquiryId)
    .maybeSingle();
  if (!enquiry) return actionForbidden();

  const { error } = await supabase.from("enquiry_notes").insert({
    enquiry_id: parsed.data.enquiryId,
    author_id: user.id,
    note: parsed.data.note,
  });
  if (error) return dbErrorMessage(error, "enquiry note");

  revalidateEnquiries(parsed.data.enquiryId);
  return actionOk("Note added.");
}

/**
 * Record a response in the history. There is no email provider connected yet,
 * so outbound messages are stored with delivery_status `queued` — the record is
 * honest about never having been sent.
 */
export async function recordEnquiryMessageAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("enquiries.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = enquiryMessageSchema.safeParse({
    enquiryId: formData.get("enquiryId"),
    direction: formData.get("direction"),
    channel: formData.get("channel"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", formFieldErrors(parsed.error));
  }

  const supabase = await createClient();

  const { data: enquiry } = await supabase
    .from("general_enquiries")
    .select("id")
    .eq("id", parsed.data.enquiryId)
    .maybeSingle();
  if (!enquiry) return actionForbidden();

  const { error } = await supabase.from("enquiry_messages").insert({
    enquiry_id: parsed.data.enquiryId,
    direction: parsed.data.direction,
    channel: parsed.data.channel,
    body: parsed.data.body,
    delivery_status: parsed.data.direction === "outbound" ? "queued" : "delivered",
    sent_by: user.id,
  });
  if (error) return dbErrorMessage(error, "enquiry message");

  revalidateEnquiries(parsed.data.enquiryId);
  return actionOk(
    parsed.data.direction === "outbound"
      ? "Response recorded. Delivery through an email provider is not connected yet."
      : "Inbound message recorded.",
  );
}

/* ---------------------------------- Delete ---------------------------------- */

export async function deleteEnquiryAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("enquiries.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteEnquirySchema.safeParse({ enquiryId: formData.get("enquiryId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { data: enquiry } = await supabase
    .from("general_enquiries")
    .select("id, status")
    .eq("id", parsed.data.enquiryId)
    .maybeSingle();
  if (!enquiry) return actionForbidden();

  // Only closed or spam enquiries may be deleted; active ones must be closed first.
  if (!["closed", "spam"].includes(enquiry.status)) {
    return actionError("Close or mark the enquiry as spam before deleting it.");
  }

  const { error } = await supabase
    .from("general_enquiries")
    .delete()
    .eq("id", parsed.data.enquiryId);
  if (error) return dbErrorMessage(error, "enquiry delete");

  revalidateEnquiries();
  return actionOk("Enquiry deleted.");
}

export async function deleteEnquiryNoteAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("enquiries.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteEnquiryNoteSchema.safeParse({ noteId: formData.get("noteId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("enquiry_notes")
    .delete()
    .eq("id", parsed.data.noteId);
  if (error) return dbErrorMessage(error, "enquiry note delete");

  revalidateEnquiries();
  return actionOk("Note deleted.");
}

export async function deleteEnquiryMessageAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("enquiries.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteEnquiryMessageSchema.safeParse({ messageId: formData.get("messageId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("enquiry_messages")
    .delete()
    .eq("id", parsed.data.messageId);
  if (error) return dbErrorMessage(error, "enquiry message delete");

  revalidateEnquiries();
  return actionOk("Message deleted.");
}

export async function deleteEnquiryAssignmentAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("enquiries.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteEnquiryAssignmentSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("enquiry_assignments")
    .delete()
    .eq("id", parsed.data.assignmentId);
  if (error) return dbErrorMessage(error, "enquiry assignment delete");

  revalidateEnquiries();
  return actionOk("Assignment record deleted.");
}