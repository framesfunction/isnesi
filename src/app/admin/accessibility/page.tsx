import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/empty-state";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { requirePermission } from "@/lib/auth/guards";
import { getAccessibilityReviews, saveAccessibilityReviewAction } from "@/features/accessibility/actions";

export const metadata: Metadata = { title: "Accessibility" };
export const dynamic = "force-dynamic";

const PREFERENCES = [
  {
    key: "reducedMotion",
    label: "Reduced motion",
    description: "Respect prefers-reduced-motion; avoid autoplaying animations.",
  },
  {
    key: "highContrast",
    label: "High contrast",
    description: "Ensure text and UI meet WCAG contrast thresholds.",
  },
  {
    key: "largeText",
    label: "Large text support",
    description: "Layouts accommodate increased text sizes without overlap.",
  },
  {
    key: "dyslexicFont",
    label: "Dyslexic-friendly font",
    description: "Offer a font option optimised for readers with dyslexia.",
  },
] as const;

type PreferenceKey = (typeof PREFERENCES)[number]["key"];

async function getAccessibilitySettings() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "accessibility")
    .maybeSingle();
  return data?.value as Record<string, boolean> | null;
}

async function saveAccessibilitySettings(
  values: Record<PreferenceKey, boolean>,
) {
  if (!isSupabaseConfigured()) return { ok: false as const };
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "accessibility", value: values, is_public: false });
  return { ok: !error };
}

type WCAGLevel = "A" | "AA" | "AAA";
const WCAG_LEVELS: { value: WCAGLevel; label: string }[] = [
  { value: "A", label: "WCAG 2.1 A" },
  { value: "AA", label: "WCAG 2.1 AA" },
  { value: "AAA", label: "WCAG 2.1 AAA" },
];

const ENTITY_TYPES = [
  { value: "page", label: "Page" },
  { value: "story", label: "Story" },
] as const;

export default async function AdminAccessibilityPage() {
  const { allowed } = await requirePermission(
    "settings.manage",
    "/admin/accessibility",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the settings.manage permission."
      />
    );
  }
  const settings = await getAccessibilitySettings();
  const reviews = await getAccessibilityReviews();
  const values: Record<PreferenceKey, boolean> = {
    reducedMotion: settings?.reducedMotion ?? false,
    highContrast: settings?.highContrast ?? false,
    largeText: settings?.largeText ?? false,
    dyslexicFont: settings?.dyslexicFont ?? false,
  };

  return (
    <div className="mx-auto max-w-6xl">
      {" "}
      <AdminPageHeader
        eyebrow="Administration"
        title="Accessibility"
        description="Public accessibility preferences and the editorial review checklist for WCAG 2.1 conformance."
      />{" "}
      <Card className="mb-8 border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            {" "}
            Accessibility preferences{" "}
          </CardTitle>{" "}
        </CardHeader>
        <CardContent>
          {" "}
          <form
            action={async (formData: FormData) => {
              const updated: Record<PreferenceKey, boolean> = {
                reducedMotion: formData.get("reducedMotion") === "on",
                highContrast: formData.get("highContrast") === "on",
                largeText: formData.get("largeText") === "on",
                dyslexicFont: formData.get("dyslexicFont") === "on",
              };
              await saveAccessibilitySettings(updated);
            }}
            className="space-y-6 p-4"
          >
            {" "}
            {PREFERENCES.map((pref) => (
              <div
                key={pref.key}
                className="flex items-start gap-3 p-3 rounded-xl border border-line bg-white/50"
              >
                {" "}
                <input
                  type="checkbox"
                  name={pref.key}
                  defaultChecked={values[pref.key]}
                  className="form-checkbox h-5 w-5 shrink-0"
                />{" "}
                <div>
                  {" "}
                  <p className="font-medium text-ink">{pref.label}</p>{" "}
                  <p className="text-sm text-ink-muted">
                    {pref.description}
                  </p>{" "}
                </div>
              </div>
            ))}
            <div className="mt-6 flex justify-end">
              {" "}
              <Button type="submit">Save preferences</Button>{" "}
            </div>
          </form>
          {" "}
        </CardContent>{" "}
      </Card>{" "}
      <Card className="border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            {" "}
            Accessibility review checklist{" "}
          </CardTitle>{" "}
        </CardHeader>
        <CardContent>
          {" "}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted mb-1">
                  Record a WCAG check on a page or story. Each review is stored
                  as compliance evidence.
                </p>
              </div>
            </div>

            <form
              action={async (formData: FormData) => {
                await saveAccessibilityReviewAction(undefined, formData);
              }}
              className="space-y-4 p-4 rounded-xl border border-line bg-white/50"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                    Entity type
                  </label>
                  <select
                    name="entityType"
                    required
                    className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                  >
                    {ENTITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                    Entity ID
                  </label>
                  <input
                    type="text"
                    name="entityId"
                    placeholder="UUID of the page or story"
                    className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                    WCAG level
                  </label>
                  <select
                    name="wcagLevel"
                    required
                    className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                  >
                    {WCAG_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                    Passed?
                  </label>
                  <input
                    type="checkbox"
                    name="passed"
                    className="form-checkbox h-5 w-5 shrink-0 mt-1"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                    Reviewer ID (optional)
                  </label>
                  <input
                    type="text"
                    name="reviewerId"
                    placeholder="UUID"
                    className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                    Issues
                  </label>
                  <textarea
                    name="issues"
                    rows={2}
                    className="min-h-20 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="min-h-20 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button type="submit">Record review</Button>
                </div>
              </div>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">
                Recorded reviews ({reviews.length})
              </h3>
              {reviews.length === 0 ? (
                <EmptyState
                  title="No review records yet."
                  description="Record a WCAG check using the form above."
                />
              ) : (
                <div className="space-y-2">
                  {reviews.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-line bg-white/50 text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold ${
                            r.passed ? "text-leaf-strong" : "text-coral-strong"
                          }`}
                        >
                          {r.passed ? "Passed" : "Not passed"}
                        </span>
                        <span className="text-ink-muted">{r.wcagLevel}</span>
                        <span className="text-ink-muted">{r.entityType}</span>
                        <span className="font-mono text-xs text-ink-muted">
                          {r.entityId}
                        </span>
                        <span className="text-ink-muted text-xs">
                          {new Date(r.reviewedAt ?? "").toLocaleDateString()}
                        </span>
                      </div>
                      {r.issues && (
                        <p className="text-xs text-ink-muted">
                          Issues: {r.issues}
                        </p>
                      )}
                      {r.notes && (
                        <p className="text-xs text-ink-muted">
                          Notes: {r.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
