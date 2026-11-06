"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  actionForbidden,
  actionNotConfigured,
  actionOk,
} from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  deleteImpactMetricSchema,
  impactMetricPublishSchema,
  saveImpactMetricSchema,
} from "@/lib/validation/cms";
import { fieldErrors } from "@/lib/validation/form";

/**
 * Impact metrics Server Actions.
 *
 * Every action re-checks `pages.manage` and RLS enforces the same permission on
 * each query.
 *
 * Publication is the honesty gate: publishing stamps `approved_at`, unpublishing
 * clears it. The database refuses a published row without an approval date, so no
 * code path can present an unapproved figure to the public.
 */

const PERMISSION = "pages.manage";

function optionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function revalidateImpact(): void {
  revalidatePath("/admin/impact-metrics");
  revalidatePath("/impact");
}

export async function saveImpactMetricAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ metricId: string }>> {
  const user = await assertPermission(PERMISSION);
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveImpactMetricSchema.safeParse({
    metricId: optionalId(formData.get("metricId")),
    key: formData.get("key"),
    label: formData.get("label"),
    value: formData.get("value"),
    unit: formData.get("unit"),
    currency: formData.get("currency") ?? "",
    description: formData.get("description") ?? "",
    sourceNote: formData.get("sourceNote") ?? "",
    evidenceUrl: formData.get("evidenceUrl") ?? "",
    reportingPeriod: formData.get("reportingPeriod") ?? "",
    sortOrder: formData.get("sortOrder"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();
  const now = new Date().toISOString();

  const values = {
    key: input.key,
    label: input.label,
    value: input.value,
    unit: input.unit,
    currency: input.currency,
    description: input.description,
    source_note: input.sourceNote,
    evidence_url: input.evidenceUrl,
    reporting_period: input.reportingPeriod,
    sort_order: input.sortOrder,
    is_published: input.isPublished,
    updated_by: user.id,
  };

  if (input.metricId) {
    // Publishing stamps approval; unpublishing clears it. An existing approval
    // date is kept while the metric stays published.
    const { data: existing } = await supabase
      .from("impact_metrics")
      .select("approved_at")
      .eq("id", input.metricId)
      .maybeSingle();

    const approvedAt = input.isPublished ? (existing?.approved_at ?? now) : null;

    const { data, error } = await supabase
      .from("impact_metrics")
      .update({ ...values, approved_at: approvedAt })
      .eq("id", input.metricId)
      .select("id")
      .maybeSingle();

    if (error) return dbErrorMessage(error, "impact metric update");
    if (!data) return actionForbidden();

    revalidateImpact();
    return actionOk("Impact metric saved.", { metricId: data.id });
  }

  const { data, error } = await supabase
    .from("impact_metrics")
    .insert({ ...values, created_by: user.id, approved_at: input.isPublished ? now : null })
    .select("id")
    .maybeSingle();

  if (error) return dbErrorMessage(error, "impact metric create");
  if (!data) return actionForbidden();

  revalidateImpact();
  return actionOk("Impact metric created.", { metricId: data.id });
}

export async function toggleImpactMetricPublishAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission(PERMISSION);
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = impactMetricPublishSchema.safeParse({
    metricId: formData.get("metricId"),
    isPublished: formData.get("isPublished") === "true",
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("impact_metrics")
    .update({
      is_published: parsed.data.isPublished,
      approved_at: parsed.data.isPublished ? new Date().toISOString() : null,
      updated_by: user.id,
    })
    .eq("id", parsed.data.metricId);

  if (error) return dbErrorMessage(error, "impact metric publish");

  revalidateImpact();
  return actionOk(parsed.data.isPublished ? "Metric published." : "Metric unpublished.");
}

export async function deleteImpactMetricAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission(PERMISSION);
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteImpactMetricSchema.safeParse({ metricId: formData.get("metricId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("impact_metrics")
    .delete()
    .eq("id", parsed.data.metricId);

  if (error) return dbErrorMessage(error, "impact metric delete");

  revalidateImpact();
  return actionOk("Impact metric deleted.");
}