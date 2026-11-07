"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { newsletterSubscribeSchema } from "@/lib/validation/enquiry";
import type { NewsletterFormState } from "@/features/newsletter/state";
import {
  campaignWorkflowSchema,
  consentRecordSchema,
  deleteCampaignSchema,
  deleteSegmentSchema,
  deleteSubscriberSchema,
  saveCampaignSchema,
  segmentMembershipSchema,
  segmentSchema,
  sendCampaignSchema,
  setCampaignChannelSchema,
  subscriberStatusSchema,
} from "@/lib/validation/engagement";
import { fieldErrors } from "@/lib/validation/form";
import type { TablesUpdate } from "@/types/database";

const NEWSLETTER_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

/**
 * Newsletter Server Actions.
 *
 * Consent is the spine of this module (spec 2.10): every status change writes a
 * consent row, unsubscribed and suppressed contacts are never marketed to, and
 * an unsubscribe stamps the timestamp immediately.
 *
 * There is no email provider connected yet, so campaigns can be drafted,
 * approved and scheduled but never sent — the interface is honest about that.
 */

function optionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function revalidateNewsletter(paths: string[]): void {
  for (const path of paths) revalidatePath(path);
  revalidatePath("/");
}

export async function subscribeNewsletterAction(
  _state: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const parsed = newsletterSubscribeSchema.safeParse({
    email: formData.get("email") ?? "",
    fullName: formData.get("fullName") ?? "",
    consent: formData.get("consent") === "on",
    locale: formData.get("locale") ?? "en",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the details below and try again.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  if (!parsed.data.consent) {
    return {
      status: "error",
      message: "Your consent is required to subscribe.",
      fieldErrors: { consent: "Please confirm that we may email you." },
    };
  }

  const requestHeaders = await headers();
  const limit = rateLimit(clientKey(requestHeaders, "newsletter"), NEWSLETTER_RATE_LIMIT);
  if (!limit.ok) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Newsletter sign-up is not configured yet." };
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const email = parsed.data.email.toLowerCase();

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/newsletter-subscribe`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        email,
        fullName: parsed.data.fullName || undefined,
        consent: parsed.data.consent,
        locale: parsed.data.locale,
      }),
    });
  } catch {
    return {
      status: "error",
      message: "Newsletter sign-up is unavailable right now. Please try again later.",
    };
  }

  if (response.status === 404) {
    return { status: "error", message: "Newsletter sign-up is not configured yet." };
  }
  if (!response.ok) {
    return { status: "error", message: "We could not save your subscription. Please try again." };
  }

  const result = (await response.json()) as {
    ok: boolean;
    alreadySubscribed?: boolean;
    message?: string;
  };
  if (!result.ok) {
    return {
      status: "error",
      message: result.message ?? "We could not save your subscription. Please try again.",
    };
  }

  if (result.alreadySubscribed) {
    return {
      status: "success",
      message: result.message ?? "You are already on our newsletter list. Thank you.",
    };
  }

  revalidateNewsletter(["/admin/newsletter"]);
  return {
    status: "success",
    message: result.message ?? "Thank you. Please confirm your subscription by email.",
  };
}

/* ------------------------------ Subscribers -------------------------------- */

export async function updateSubscriberStatusAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = subscriberStatusSchema.safeParse({
    subscriberId: formData.get("subscriberId"),
    status: formData.get("status"),
    source: formData.get("source") ?? "",
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { data: subscriber } = await supabase
    .from("newsletter_subscribers")
    .select("id, status, subscribed_at")
    .eq("id", parsed.data.subscriberId)
    .maybeSingle();
  if (!subscriber) return actionForbidden();

  const now = new Date().toISOString();
  const updates: TablesUpdate<"newsletter_subscribers"> = { status: parsed.data.status };

  if (parsed.data.status === "subscribed" && !subscriber.subscribed_at) {
    updates.subscribed_at = now;
    updates.confirmed_at = now;
  }
  if (parsed.data.status === "unsubscribed") {
    updates.unsubscribed_at = now;
  }

  const { error } = await supabase
    .from("newsletter_subscribers")
    .update(updates)
    .eq("id", parsed.data.subscriberId);
  if (error) return dbErrorMessage(error, "subscriber status");

  // Every status change is also a consent event.
  const consentStatus =
    parsed.data.status === "subscribed"
      ? "granted"
      : parsed.data.status === "unsubscribed"
        ? "withdrawn"
        : null;

  if (consentStatus !== null) {
    const { error: consentError } = await supabase.from("newsletter_consents").insert({
      subscriber_id: parsed.data.subscriberId,
      status: consentStatus,
      source: parsed.data.source ?? "admin_panel",
    });
    if (consentError) return dbErrorMessage(consentError, "consent record");

    if (consentStatus === "withdrawn") {
      await supabase
        .from("newsletter_consents")
        .update({ revoked_at: now })
        .eq("subscriber_id", parsed.data.subscriberId)
        .eq("status", "granted")
        .is("revoked_at", null);
    }
  }

  revalidateNewsletter([`/admin/newsletter/${parsed.data.subscriberId}`, "/admin/newsletter"]);
  return actionOk(`Subscriber marked ${parsed.data.status}.`);
}

export async function recordConsentAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = consentRecordSchema.safeParse({
    subscriberId: formData.get("subscriberId"),
    consentStatus: formData.get("consentStatus"),
    source: formData.get("source"),
    policyVersion: formData.get("policyVersion") ?? "",
    evidenceReference: formData.get("evidenceReference") ?? "",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }

  const supabase = await createClient();

  const { data: subscriber } = await supabase
    .from("newsletter_subscribers")
    .select("id")
    .eq("id", parsed.data.subscriberId)
    .maybeSingle();
  if (!subscriber) return actionForbidden();

  const now = new Date().toISOString();

  const { error } = await supabase.from("newsletter_consents").insert({
    subscriber_id: parsed.data.subscriberId,
    status: parsed.data.consentStatus,
    source: parsed.data.source,
    policy_version: parsed.data.policyVersion,
    evidence_reference: parsed.data.evidenceReference,
  });
  if (error) return dbErrorMessage(error, "consent record");

  if (parsed.data.consentStatus === "withdrawn") {
    await supabase
      .from("newsletter_consents")
      .update({ revoked_at: now })
      .eq("subscriber_id", parsed.data.subscriberId)
      .eq("status", "granted")
      .is("revoked_at", null);
    await supabase
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: now })
      .eq("id", parsed.data.subscriberId);
  }

  if (parsed.data.consentStatus === "granted") {
    await supabase
      .from("newsletter_subscribers")
      .update({ status: "subscribed", confirmed_at: now, subscribed_at: now })
      .eq("id", parsed.data.subscriberId);
  }

  revalidateNewsletter([`/admin/newsletter/${parsed.data.subscriberId}`]);
  return actionOk("Consent recorded.");
}

/* -------------------------------- Segments --------------------------------- */

export async function createSegmentAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = segmentSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_segments")
    .insert({ name: parsed.data.name, description: parsed.data.description });
  if (error) {
    if (error.code === "23505") return actionError("A segment with that name already exists.");
    return dbErrorMessage(error, "segment create");
  }

  revalidateNewsletter(["/admin/newsletter"]);
  return actionOk("Segment created.");
}

export async function toggleSegmentMembershipAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = segmentMembershipSchema.safeParse({
    subscriberId: formData.get("subscriberId"),
    segmentId: formData.get("segmentId"),
    member: formData.get("member") === "on",
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  if (parsed.data.member) {
    const { error } = await supabase
      .from("newsletter_segment_members")
      .insert({
        subscriber_id: parsed.data.subscriberId,
        segment_id: parsed.data.segmentId,
      });
    if (error) {
      if (error.code === "23505") return actionOk("Already a member.");
      return dbErrorMessage(error, "segment membership add");
    }
  } else {
    const { error } = await supabase
      .from("newsletter_segment_members")
      .delete()
      .eq("subscriber_id", parsed.data.subscriberId)
      .eq("segment_id", parsed.data.segmentId);
    if (error) return dbErrorMessage(error, "segment membership remove");
  }

  revalidateNewsletter([`/admin/newsletter/${parsed.data.subscriberId}`]);
  return actionOk(parsed.data.member ? "Added to segment." : "Removed from segment.");
}

/* -------------------------------- Campaigns -------------------------------- */

export async function saveCampaignAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ campaignId: string }>> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveCampaignSchema.safeParse({
    campaignId: optionalId(formData.get("campaignId")),
    name: formData.get("name"),
    subject: formData.get("subject"),
    bodyBlocks: formData.get("bodyBlocks") ?? [],
    scheduledAt: formData.get("scheduledAt") ?? "",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  if (input.campaignId) {
    // Only drafts may be edited; a scheduled or sent campaign is immutable.
    const { data: campaign } = await supabase
      .from("newsletter_campaigns")
      .select("id, status")
      .eq("id", input.campaignId)
      .maybeSingle();
    if (!campaign) return actionForbidden();
    if (campaign.status !== "draft") {
      return actionError("Only draft campaigns can be edited.");
    }

    let scheduledAtIso: string | null = null;
    if (input.scheduledAt) {
      const parsedDate = new Date(input.scheduledAt);
      scheduledAtIso = Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
    }

    const { data, error } = await supabase
      .from("newsletter_campaigns")
      .update({
        name: input.name,
        subject: input.subject,
        body: { blocks: input.bodyBlocks ?? [] },
        scheduled_at: scheduledAtIso,
      })
      .eq("id", input.campaignId)
      .select("id")
      .maybeSingle();
    if (error) return dbErrorMessage(error, "campaign update");
    if (!data) return actionForbidden();

    revalidateNewsletter([`/admin/newsletter/campaigns/${input.campaignId}`, "/admin/newsletter/campaigns"]);
    return actionOk("Campaign saved.", { campaignId: data.id });
  }

  const { data, error } = await supabase
    .from("newsletter_campaigns")
    .insert({
      name: input.name,
      subject: input.subject,
      body: { blocks: input.bodyBlocks ?? [] },
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return dbErrorMessage(error ?? {}, "campaign create");

  revalidateNewsletter(["/admin/newsletter/campaigns"]);
  return actionOk("Campaign created as a draft.", { campaignId: data.id });
}

export async function setCampaignChannelAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = setCampaignChannelSchema.safeParse({
    campaignId: formData.get("campaignId"),
    channel: formData.get("channel"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("newsletter_campaigns")
    .select("id, status")
    .eq("id", parsed.data.campaignId)
    .maybeSingle();
  if (!campaign) return actionForbidden();
  if (campaign.status !== "draft") {
    return actionError("Only draft campaigns can change channel.");
  }

  const { error } = await supabase
    .from("newsletter_campaigns")
    .update({ channel: parsed.data.channel })
    .eq("id", parsed.data.campaignId);
  if (error) return dbErrorMessage(error, "campaign channel");

  revalidateNewsletter([`/admin/newsletter/campaigns/${parsed.data.campaignId}`]);
  return actionOk(
    parsed.data.channel === "whatsapp"
      ? "Campaign set to WhatsApp: copy the rendered text and send it manually."
      : "Campaign set to email.",
  );
}

export async function campaignWorkflowAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = campaignWorkflowSchema.safeParse({
    campaignId: formData.get("campaignId"),
    action: formData.get("action"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("newsletter_campaigns")
    .select("id, status, scheduled_at")
    .eq("id", parsed.data.campaignId)
    .maybeSingle();
  if (!campaign) return actionForbidden();

  if (parsed.data.action === "approve") {
    if (campaign.status !== "draft") {
      return actionError("Only draft campaigns can be approved.");
    }
    const { error } = await supabase
      .from("newsletter_campaigns")
      .update({ approved_by: user.id, approved_at: new Date().toISOString() })
      .eq("id", parsed.data.campaignId);
    if (error) return dbErrorMessage(error, "campaign approval");

    revalidateNewsletter([`/admin/newsletter/campaigns/${parsed.data.campaignId}`]);
    return actionOk("Campaign approved. Schedule it when it should go out.");
  }

  if (campaign.status !== "draft" && campaign.status !== "scheduled") {
    return actionError("Only draft or scheduled campaigns can be cancelled.");
  }
  const { error } = await supabase
    .from("newsletter_campaigns")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.campaignId);
  if (error) return dbErrorMessage(error, "campaign cancel");

  revalidateNewsletter([`/admin/newsletter/campaigns/${parsed.data.campaignId}`, "/admin/newsletter/campaigns"]);
  return actionOk("Campaign cancelled.");
}

export async function scheduleCampaignAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const campaignId = formData.get("campaignId");
  if (typeof campaignId !== "string" || campaignId.length === 0) {
    return actionError("Malformed request.");
  }

  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("newsletter_campaigns")
    .select("id, status, approved_at, scheduled_at")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign) return actionForbidden();
  if (campaign.status !== "draft") {
    return actionError("Only draft campaigns can be scheduled.");
  }
  if (!campaign.approved_at) {
    return actionError("Approve the campaign before scheduling it.");
  }
  if (!campaign.scheduled_at) {
    return actionError("Set a schedule date first.");
  }

  const { error } = await supabase
    .from("newsletter_campaigns")
    .update({ status: "scheduled" })
    .eq("id", campaignId);
  if (error) return dbErrorMessage(error, "campaign schedule");

  revalidateNewsletter([`/admin/newsletter/campaigns/${campaignId}`, "/admin/newsletter/campaigns"]);
  return actionOk(
    "Campaign scheduled. Delivery runs through the newsletter provider once that integration is connected.",
  );
}

/* ---------------------------------- Send ---------------------------------- */

export async function sendCampaignAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = sendCampaignSchema.safeParse({ campaignId: formData.get("campaignId") });
  if (!parsed.success) return actionError("Malformed request.");

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return actionForbidden();

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/newsletter-send`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: supabaseAnonKey,
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ campaignId: parsed.data.campaignId }),
      cache: "no-store",
    });
  } catch {
    return actionError("The newsletter provider is unavailable right now.");
  }

  if (response.status === 404) return actionNotConfigured();
  if (response.status === 401 || response.status === 403) return actionForbidden();
  if (!response.ok) {
    const failure = (await response.json().catch(() => null)) as { error?: string } | null;
    return actionError(failure?.error ?? "The campaign could not be sent.");
  }

  const result = (await response.json()) as { ok?: boolean; data?: { queued?: number; note?: string } };
  if (!result.ok) {
    return actionError("The campaign could not be sent.");
  }

  revalidateNewsletter([`/admin/newsletter/campaigns/${parsed.data.campaignId}`, "/admin/newsletter"]);
  const note = result.data?.note;
  return actionOk(
    note
      ? `Campaign queued for ${result.data?.queued ?? 0} recipients. ${note}`
      : `Campaign queued for ${result.data?.queued ?? 0} recipients.`,
  );
}

/* ---------------------------------- Delete ---------------------------------- */

export async function deleteSubscriberAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteSubscriberSchema.safeParse({ subscriberId: formData.get("subscriberId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", parsed.data.subscriberId);
  if (error) return dbErrorMessage(error, "subscriber delete");

  revalidateNewsletter(["/admin/newsletter"]);
  return actionOk("Subscriber deleted.");
}

export async function deleteCampaignAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteCampaignSchema.safeParse({ campaignId: formData.get("campaignId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("newsletter_campaigns")
    .select("status")
    .eq("id", parsed.data.campaignId)
    .maybeSingle();
  if (!campaign) return actionForbidden();

  // Only draft or cancelled campaigns can be deleted.
  if (!["draft", "cancelled"].includes(campaign.status)) {
    return actionError("Only draft or cancelled campaigns can be deleted.");
  }

  const { error } = await supabase
    .from("newsletter_campaigns")
    .delete()
    .eq("id", parsed.data.campaignId);
  if (error) return dbErrorMessage(error, "campaign delete");

  revalidateNewsletter(["/admin/newsletter/campaigns"]);
  return actionOk("Campaign deleted.");
}

export async function deleteSegmentAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("newsletter.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteSegmentSchema.safeParse({ segmentId: formData.get("segmentId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  // A segment that still has members cannot be deleted.
  const { count } = await supabase
    .from("newsletter_segment_members")
    .select("subscriber_id", { count: "exact", head: true })
    .eq("segment_id", parsed.data.segmentId);
  if ((count ?? 0) > 0) {
    return actionError("Remove all members from the segment before deleting it.");
  }

  const { error } = await supabase
    .from("newsletter_segments")
    .delete()
    .eq("id", parsed.data.segmentId);
  if (error) return dbErrorMessage(error, "segment delete");

  revalidateNewsletter(["/admin/newsletter"]);
  return actionOk("Segment deleted.");
}
