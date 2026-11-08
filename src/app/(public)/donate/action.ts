"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/validation/form";
import { createDonationSchema } from "@/lib/validation/donation";

/**
 * Public donation creation.
 *
 * Creates a `created` donation record (not yet paid) so the caller can be
 * redirected to the payment provider via the `donation-create-intent` Edge
 * Function. Does not confirm payment — that happens only after a
 * signature-verified provider webhook. Never stores card data or MoMo PINs.
 */
export async function createDonationAction(
  _state: unknown,
  formData: FormData,
): Promise<{ status: string; message?: string; fieldErrors?: Record<string, string>; data?: { donationId: string; publicReference: string } }> {
  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = createDonationSchema.safeParse({
    amountMinor: formData.get("amountMinor"),
    currency: formData.get("currency"),
    payerPhone: formData.get("payerPhone"),
    donorName: formData.get("donorName"),
    donorEmail: formData.get("donorEmail"),
    campaignId: formData.get("campaignId") || undefined,
    isAnonymous: formData.get("isAnonymous") === "on",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data: donation, error } = await supabase
    .from("donations")
    .insert({
      donor_name: input.donorName ?? null,
      donor_email: input.donorEmail ?? null,
      amount_minor: input.amountMinor,
      currency: input.currency,
      donation_type: input.isAnonymous ? "one_time" : "one_time",
      campaign_id: input.campaignId ?? null,
      payment_status: "created",
      is_anonymous: input.isAnonymous,
    })
    .select("id, public_reference")
    .maybeSingle();
  if (error || !donation) {
    return { status: "error", message: "Could not create the donation record. Please try again." };
  }

  revalidatePath("/donate");
  return actionOk("Donation record created. You will be redirected to complete payment.", {
    donationId: donation.id,
    publicReference: donation.public_reference,
  });
}
