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
  deleteDonationSchema,
  deleteDonationCampaignSchema,
  deletePaymentEventSchema,
  deleteReconciliationSchema,
  deleteRefundSchema,
  requestDonationRefundSchema,
  saveDonationCampaignSchema,
  saveReconciliationSchema,
  toggleDonationCampaignSchema,
} from "@/lib/validation/finance";
import { fieldErrors } from "@/lib/validation/form";

import { computeRefundPaymentStatus } from "@/features/finance/refund-status";

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
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = createDonationIntentSchema.safeParse({
    donationId: formData.get("donationId"),
    amountMinor: formData.get("amountMinor"),
    currency: formData.get("currency"),
    payerPhone: formData.get("payerPhone"),
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
        payerPhone: input.payerPhone,
      }),
      cache: "no-store",
    });
  } catch {
    return actionError("The payment provider is unavailable right now.");
  }

  if (response.status === 404) return actionNotConfigured();
  if (response.status === 401 || response.status === 403) return actionForbidden();
  if (response.status === 422) {
    const failure = (await response.json().catch(() => null)) as { error?: string } | null;
    return actionError(
      failure?.error ?? "This payment provider does not accept this currency.",
    );
  }
  if (!response.ok) return actionError("The payment provider could not create an intent.");

  const result = (await response.json()) as {
    providerReference?: string;
    resumed?: boolean;
    message?: string;
  };
  if (!result.providerReference) {
    return actionError("The provider returned no reference. Try again.");
  }

  const { error } = await supabase
    .from("donations")
    .update({
      provider_key: "mtn_momo",
      provider_transaction_id: result.providerReference,
    })
    .eq("id", input.donationId);
  if (error) return dbErrorMessage(error, "donation intent record");

  revalidatePath("/admin/donations");
  return actionOk(result.message ?? "Payment intent created.");
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
  const { data: refund } = await supabase
    .from("donation_refunds")
    .select("id, donation_id, amount_minor, reason, status, donations!inner(currency)")
    .eq("id", parsed.data.refundId)
    .eq("status", "requested")
    .maybeSingle();
  if (!refund) return actionError("Refund not found or already processed.");

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/donation-refund`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: supabaseAnonKey,
        authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        refundId: refund.id,
        amountMinor: refund.amount_minor,
        currency: (refund as { donations: { currency: string } }).donations
          .currency,
        reason: refund.reason,
      }),
      cache: "no-store",
    });
  } catch {
    return actionError("The refund provider is unavailable right now.");
  }

  if (response.status === 404) return actionNotConfigured();
  if (response.status === 401 || response.status === 403) return actionForbidden();
  if (!response.ok) {
    const failure = (await response.json().catch(() => null)) as { error?: string } | null;
    return actionError(failure?.error ?? "The refund could not be processed.");
  }

  const result = (await response.json()) as {
    ok: boolean;
    providerReference?: string;
    providerStatus?: string;
    message?: string;
  };
  if (!result.ok) {
    return actionError(result.message ?? "The refund could not be processed.");
  }

  const { error } = await supabase
    .from("donation_refunds")
    .update({
      status: "succeeded",
      provider_refund_id: result.providerReference ?? null,
    })
    .eq("id", refund.id)
    .eq("status", "requested");
  if (error) return dbErrorMessage(error, "donation refund approval");

  // Recompute the donation's payment status based on the total refunded
  // amount, so partial refunds are recorded as partially_refunded rather
  // than incorrectly marked fully refunded.
  const { data: refundedRows } = await supabase
    .from("donation_refunds")
    .select("amount_minor")
    .eq("donation_id", refund.donation_id)
    .eq("status", "succeeded");
  const totalRefunded = (refundedRows ?? []).reduce(
    (sum, row) => sum + (Number((row as { amount_minor: unknown }).amount_minor) || 0),
    0,
  );

  const { data: donation } = await supabase
    .from("donations")
    .select("amount_minor, payment_status")
    .eq("id", refund.donation_id)
    .maybeSingle();
  if (donation) {
    const amountMinor = Number(donation.amount_minor);
    const nextStatus = computeRefundPaymentStatus(
      totalRefunded,
      amountMinor,
      donation.payment_status,
    );
    if (nextStatus !== donation.payment_status) {
      await supabase
        .from("donations")
        .update({ payment_status: nextStatus })
        .eq("id", refund.donation_id);
    }
  }

  revalidatePath("/admin/donations");
  return actionOk(result.message ?? "Refund approved and sent to the provider.");
}

/* ---------------------------------- Delete ---------------------------------- */

export async function deleteDonationAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteDonationSchema.safeParse({ donationId: formData.get("donationId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { data: donation } = await supabase
    .from("donations")
    .select("id, payment_status")
    .eq("id", parsed.data.donationId)
    .maybeSingle();
  if (!donation) return actionForbidden();

  // Only created or failed donations can be deleted; succeeded ones must be refunded.
  if (donation.payment_status === "succeeded") {
    return actionError("Succeeded donations cannot be deleted. Issue a refund instead.");
  }

  const { error } = await supabase
    .from("donations")
    .delete()
    .eq("id", parsed.data.donationId);
  if (error) return dbErrorMessage(error, "donation delete");

  revalidatePath("/admin/donations");
  return actionOk("Donation deleted.");
}

export async function deleteRefundAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteRefundSchema.safeParse({ refundId: formData.get("refundId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { data: refund } = await supabase
    .from("donation_refunds")
    .select("id, status")
    .eq("id", parsed.data.refundId)
    .maybeSingle();
  if (!refund) return actionForbidden();

  // Only requested or failed refunds can be deleted.
  if (!["requested", "failed"].includes(refund.status)) {
    return actionError("Only requested or failed refunds can be deleted.");
  }

  const { error } = await supabase
    .from("donation_refunds")
    .delete()
    .eq("id", parsed.data.refundId);
  if (error) return dbErrorMessage(error, "refund delete");

  revalidatePath("/admin/donations");
  return actionOk("Refund deleted.");
}

export async function deleteReconciliationAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteReconciliationSchema.safeParse({
    reconciliationId: formData.get("reconciliationId"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { data: reconciliation } = await supabase
    .from("finance_reconciliations")
    .select("id, status")
    .eq("id", parsed.data.reconciliationId)
    .maybeSingle();
  if (!reconciliation) return actionForbidden();

  // Only open or disputed reconciliations can be deleted.
  if (!["open", "disputed"].includes(reconciliation.status)) {
    return actionError("Only open or disputed reconciliations can be deleted.");
  }

  const { error } = await supabase
    .from("finance_reconciliations")
    .delete()
    .eq("id", parsed.data.reconciliationId);
  if (error) return dbErrorMessage(error, "reconciliation delete");

  revalidatePath("/admin/donations");
  return actionOk("Reconciliation deleted.");
}

export async function deletePaymentEventAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("donations.manage");
  if (!user || !isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deletePaymentEventSchema.safeParse({ eventId: formData.get("eventId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_events")
    .delete()
    .eq("id", Number(parsed.data.eventId));
  if (error) return dbErrorMessage(error, "payment event delete");

  revalidatePath("/admin/donations");
  return actionOk("Payment event deleted.");
}
