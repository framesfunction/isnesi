"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { accessibilityReviewSchema } from "@/lib/validation/kids";
import { fieldErrors } from "@/lib/validation/form";

const REVIEW_SETTING_KEY = "accessibility_reviews";

type AccessibilityReview = {
  entityType: "page" | "story";
  entityId: string;
  reviewerId?: string | null;
  wcagLevel: "A" | "AA" | "AAA";
  passed: boolean;
  issues?: string | null;
  notes?: string | null;
  reviewedAt: string;
};

/** Read stored accessibility review records from site_settings. */
export async function getAccessibilityReviews(): Promise<AccessibilityReview[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let value: unknown = null;
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", REVIEW_SETTING_KEY)
      .maybeSingle();
    value = data?.value;
  } catch {
    console.warn("[isnesi] accessibility reviews unavailable", { reason: "query failed" });
    return [];
  }
  if (!value || !Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => item && typeof item === "object")
    .map((item) => ({
      entityType: item.entityType as "page" | "story",
      entityId: item.entityId as string,
      reviewerId: item.reviewerId as string | undefined,
      wcagLevel: item.wcagLevel as "A" | "AA" | "AAA",
      passed: item.passed as boolean,
      issues: item.issues as string | null | undefined,
      notes: item.notes as string | null | undefined,
      reviewedAt: item.reviewedAt as string,
    }))
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""));
}

/** Save a new accessibility review record. */
export async function saveAccessibilityReviewAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("settings.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = accessibilityReviewSchema.safeParse({
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    reviewerId: formData.get("reviewerId") || undefined,
    wcagLevel: formData.get("wcagLevel"),
    passed: formData.get("passed") === "on",
    issues: formData.get("issues") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", REVIEW_SETTING_KEY)
    .maybeSingle();

  const reviews: AccessibilityReview[] = Array.isArray(existing?.value)
    ? (existing.value as unknown[]).map((r) => ({
        entityType: (r as Record<string, unknown>).entityType as "page" | "story",
        entityId: (r as Record<string, unknown>).entityId as string,
        reviewerId: (r as Record<string, unknown>).reviewerId as string | undefined,
        wcagLevel: (r as Record<string, unknown>).wcagLevel as "A" | "AA" | "AAA",
        passed: (r as Record<string, unknown>).passed as boolean,
        issues: (r as Record<string, unknown>).issues as string | null | undefined,
        notes: (r as Record<string, unknown>).notes as string | null | undefined,
        reviewedAt: (r as Record<string, unknown>).reviewedAt as string,
      }))
    : [];

  const review: AccessibilityReview = {
    entityType: input.entityType,
    entityId: input.entityId,
    reviewerId: input.reviewerId,
    wcagLevel: input.wcagLevel,
    passed: input.passed,
    issues: input.issues,
    notes: input.notes,
    reviewedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("site_settings")
    .upsert({
      key: REVIEW_SETTING_KEY,
      value: [...reviews, review],
      is_public: false,
    });

  if (error) {
    return actionError("Could not save the review. Please try again.");
  }

  revalidatePath("/admin/accessibility");
  return actionOk("Accessibility review recorded.");
}
