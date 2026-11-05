"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  approveDonationRefundSchema,
  createDonationIntentSchema,
  deleteDonationCampaignSchema,
  requestDonationRefundSchema,
  saveDonationCampaignSchema,
  saveReconciliationSchema,
  toggleDonationCampaignSchema,
} from "@/lib/validation/finance";
import { fieldErrors } from "@/lib/validation/form";

export async function createDonationCampaignAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveDonationCampaignSchema.safeParse({
    campaignId: formData.get("campaignId") ?? undefined,
    key: formData.get("key") ?? "",
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    isActive: formData.get("isActive") === "on",
    startsAt: formData.get("startsAt") ?? "",
    endsAt: formData.get("endsAt") ?? "",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data: campaign, error } = await supabase
    .from("donation_campaigns")
    .insert({
      key: input.key,
      is_active: input.isActive,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
    })
    .select("id")
    .maybeSingle();
  if (error || !campaign) return dbErrorMessage(error ?? { message: "No campaign returned" }, "donation campaign create");

  const { error: translationError } = await supabase.from("donation_campaign_translations").insert({
    campaign_id: campaign.id,
    locale: "en",
    title: input.title,
    description: input.description,
  });
  if (translationError) return dbErrorMessage(translationError, "donation campaign translation");

  revalidatePath("/admin/donations");
  return actionOk("Donation campaign created.");
}

export async function toggleDonationCampaignAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = toggleDonationCampaignSchema.safeParse({
    campaignId: formData.get("campaignId"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("donation_campaigns")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.campaignId);
  if (error) return dbErrorMessage(error, "donation campaign toggle");

  revalidatePath("/admin/donations");
  return actionOk(`Campaign ${parsed.data.isActive ? "activated" : "deactivated"}.`);
}

export async function deleteDonationCampaignAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteDonationCampaignSchema.safeParse({ campaignId: formData.get("campaignId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { count } = await supabase
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", parsed.data.campaignId);
  if ((count ?? 0) > 0) {
    return actionError("Cannot delete a campaign that still has donations. Reassign or archive them first.");
  }

  const { error } = await supabase.from("donation_campaigns").delete().eq("id", parsed.data.campaignId);
  if (error) return dbErrorMessage(error, "donation campaign delete");

  revalidatePath("/admin/donations");
  return actionOk("Donation campaign deleted.");
}

export async function createDonationIntentAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ providerReference: string }>> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = createDonationIntentSchema.safeParse({
    donationId: formData.get("donationId"),
    amountMinor: formData.get("amountMinor"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return actionForbidden();

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/donation-create-intent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: supabaseAnonKey,
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        amountMinor: input.amountMinor,
        currency: input.currency,
        donationId: input.donationId,
      }),
      cache: "no-store",
    });
  } catch {
    return actionError("The payment provider is unavailable right now.");
  }

  if (response.status === 404) return actionNotConfigured();
  if (response.status === 401 || response.status === 403) return actionForbidden();
  if (!response.ok) return actionError("The payment provider could not create an intent.");

  const result = (await response.json()) as { providerReference?: string; donationId?: string };
  if (!result.providerReference) {
    return actionError("The provider returned no reference. Try again.");
  }

  const { error } = await supabase
    .from("donations")
    .update({ provider_key: "generic", provider_transaction_id: result.providerReference })
    .eq("id", input.donationId);
  if (error) return dbErrorMessage(error, "donation intent record");

  revalidatePath("/admin/donations");
  return actionOk("Payment intent created.", { providerReference: result.providerReference });
}

export async function requestDonationRefundAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = requestDonationRefundSchema.safeParse({
    donationId: formData.get("donationId"),
    amountMinor: formData.get("amountMinor"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data: donation } = await supabase
    .from("donations")
    .select("id,amount_minor,payment_status")
    .eq("id", input.donationId)
    .maybeSingle();
  if (!donation || donation.payment_status !== "succeeded" || input.amountMinor > donation.amount_minor) {
    return actionError("Cannot refund this donation: it must be succeeded and the amount must not exceed the donation total.");
  }

  const { error } = await supabase.from("donation_refunds").insert({
    donation_id: input.donationId,
    amount_minor: input.amountMinor,
    reason: input.reason,
    requested_by: user.id,
  });
  if (error) return dbErrorMessage(error, "donation refund request");

  revalidatePath("/admin/donations");
  return actionOk("Refund requested. It awaits approval before being sent to the provider.");
}

export async function saveReconciliationAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveReconciliationSchema.safeParse({
    reconciliationId: formData.get("reconciliationId") ?? undefined,
    periodStart: formData.get("periodStart") ?? "",
    periodEnd: formData.get("periodEnd") ?? "",
    providerKey: formData.get("providerKey") ?? "",
    statementReference: formData.get("statementReference") ?? "",
    totalMinor: formData.get("totalMinor"),
    currency: formData.get("currency") ?? "XAF",
    status: formData.get("status") ?? "open",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("finance_reconciliations").insert({
    period_start: input.periodStart,
    period_end: input.periodEnd,
    provider_key: input.providerKey ?? null,
    statement_reference: input.statementReference ?? null,
    total_minor: input.totalMinor,
    currency: input.currency,
    status: input.status,
    notes: input.notes ?? null,
    created_by: user.id,
  });
  if (error) return dbErrorMessage(error, "finance reconciliation");

  revalidatePath("/admin/donations");
  return actionOk("Reconciliation record saved.");
}

export async function approveDonationRefundAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = approveDonationRefundSchema.safeParse({ refundId: formData.get("refundId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("donation_refunds")
    .update({ approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", parsed.data.refundId)
    .eq("status", "requested")
    .is("approved_at", null);
  if (error) return dbErrorMessage(error, "donation refund approval");

  revalidatePath("/admin/donations");
  return actionOk("Refund approved.");
}
