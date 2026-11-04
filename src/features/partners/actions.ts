"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { savePartnerSchema, partnerApprovalSchema } from "@/lib/validation/cms";
import { fieldErrors } from "@/lib/validation/form";

/**
 * Partners Server Actions.
 *
 * RLS enforces `partners.manage` on every statement; the public site only ever
 * renders partners that are approved *and* flagged visible, which the actions
 * keep mutually consistent: approval records who approved and when, a rejection
 * clears the flag, and turning visibility on requires an approved status.
 */

function optionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function revalidatePartners(): void {
  revalidatePath("/admin/partners");
  revalidatePath("/partners");
  revalidatePath("/");
}

export async function savePartnerAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ partnerId: string }>> {
  const user = await assertPermission("partners.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = savePartnerSchema.safeParse({
    partnerId: optionalId(formData.get("partnerId")),
    name: formData.get("name"),
    relationshipType: formData.get("relationshipType") ?? "",
    websiteUrl: formData.get("websiteUrl") ?? "",
    logoMediaId: formData.get("logoMediaId") ?? "",
    descriptionEn: formData.get("descriptionEn") ?? "",
    descriptionFr: formData.get("descriptionFr") ?? "",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  const itemValues = {
    name: input.name,
    relationship_type: input.relationshipType,
    website_url: input.websiteUrl,
    logo_media_id: input.logoMediaId,
  };

  let partnerId: string;
  if (input.partnerId) {
    const { data, error } = await supabase
      .from("partners")
      .update(itemValues)
      .eq("id", input.partnerId)
      .select("id")
      .maybeSingle();
    if (error) return dbErrorMessage(error, "partner update");
    if (!data) return actionForbidden();
    partnerId = data.id;
  } else {
    const { data, error } = await supabase
      .from("partners")
      .insert(itemValues)
      .select("id")
      .single();
    if (error || !data) return dbErrorMessage(error ?? {}, "partner create");
    partnerId = data.id;
  }

  for (const entry of [
    { locale: "en", description: input.descriptionEn },
    { locale: "fr", description: input.descriptionFr },
  ] as const) {
    if (entry.description === null) continue;
    const { error } = await supabase.from("partner_translations").upsert(
      {
        partner_id: partnerId,
        locale: entry.locale,
        description: entry.description,
      },
      { onConflict: "partner_id,locale" },
    );
    if (error) return dbErrorMessage(error, "partner translation save");
  }

  revalidatePartners();
  return actionOk("Partner saved.", { partnerId });
}

export async function partnerDecisionAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("partners.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const input = partnerApprovalSchema.safeParse({
    partnerId: formData.get("partnerId"),
    decision: formData.get("decision"),
    publicVisible: formData.get("publicVisible") === "on",
  });
  if (!input.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("id, approval_status, public_visible")
    .eq("id", input.data.partnerId)
    .maybeSingle();
  if (!partner) return actionForbidden();

  if (input.data.decision === "approve") {
    const { error } = await supabase
      .from("partners")
      .update({
        approval_status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        public_visible: input.data.publicVisible || partner.public_visible,
      })
      .eq("id", input.data.partnerId);
    if (error) return dbErrorMessage(error, "partner approval");

    revalidatePartners();
    return actionOk(
      input.data.publicVisible
        ? "Approved and visible on the public site."
        : "Approved. Turn on visibility when the partner profile is ready.",
    );
  }

  // A rejected partner never stays public.
  const { error } = await supabase
    .from("partners")
    .update({ approval_status: "rejected", public_visible: false })
    .eq("id", input.data.partnerId);
  if (error) return dbErrorMessage(error, "partner rejection");

  revalidatePartners();
  return actionOk("Rejected. The partner is hidden from the public site.");
}

export async function togglePartnerVisibilityAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("partners.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = z
    .object({
      partnerId: z.uuid(),
      publicVisible: z.boolean(),
    })
    .safeParse({
      partnerId: formData.get("partnerId"),
      publicVisible: formData.get("publicVisible") === "on",
    });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("id, approval_status")
    .eq("id", parsed.data.partnerId)
    .maybeSingle();
  if (!partner) return actionForbidden();

  // Visibility alone never lifts an unapproved partner public.
  if (parsed.data.publicVisible && partner.approval_status !== "approved") {
    return actionError("Approve the partner before making them public.");
  }

  const { error } = await supabase
    .from("partners")
    .update({ public_visible: parsed.data.publicVisible })
    .eq("id", parsed.data.partnerId);
  if (error) return dbErrorMessage(error, "partner visibility");

  revalidatePartners();
  return actionOk(parsed.data.publicVisible ? "Partner shown publicly." : "Partner hidden.");
}

export async function deletePartnerAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("partners.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const partnerId = z.uuid().safeParse(formData.get("partnerId"));
  if (!partnerId.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase.from("partners").delete().eq("id", partnerId.data);
  if (error) {
    if (error.code === "23503") {
      return actionError("This partner still has references and cannot be deleted.");
    }
    return dbErrorMessage(error, "partner delete");
  }

  revalidatePartners();
  return actionOk("Partner deleted.");
}
