import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/empty-state";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Accessibility" };
export const dynamic = "force-dynamic";

const PREFERENCES = [
  { key: "reducedMotion", label: "Reduced motion", description: "Respect prefers-reduced-motion; avoid autoplaying animations." },
  { key: "highContrast", label: "High contrast", description: "Ensure text and UI meet WCAG contrast thresholds." },
  { key: "largeText", label: "Large text support", description: "Layouts accommodate increased text sizes without overlap." },
  { key: "dyslexicFont", label: "Dyslexic-friendly font", description: "Offer a font option optimised for readers with dyslexia." },
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

async function saveAccessibilitySettings(values: Record<PreferenceKey, boolean>) {
  if (!isSupabaseConfigured()) return { ok: false as const };
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert({
    key: "accessibility",
    value: values,
    is_public: false,
  });
  return { ok: !error };
}

export default async function AdminAccessibilityPage() {
  const { allowed } = await requirePermission("settings.manage", "/admin/accessibility");
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the settings.manage permission."
      />
    );
  }

  const settings = await getAccessibilitySettings();
  const values: Record<PreferenceKey, boolean> = {
    reducedMotion: settings?.reducedMotion ?? false,
    highContrast: settings?.highContrast ?? false,
    largeText: settings?.largeText ?? false,
    dyslexicFont: settings?.dyslexicFont ?? false,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Administration"
        title="Accessibility"
        description="Public accessibility preferences and the editorial review checklist for WCAG 2.2 AA conformance."
      />

      <Card className="mb-8 border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Accessibility preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={async (formData: FormData) => {
            const updated: Record<PreferenceKey, boolean> = {
              reducedMotion: formData.get("reducedMotion") === "on",
              highContrast: formData.get("highContrast") === "on",
              largeText: formData.get("largeText") === "on",
              dyslexicFont: formData.get("dyslexicFont") === "on",
            };
            await saveAccessibilitySettings(updated);
          }} className="space-y-6 p-4">
            {PREFERENCES.map((pref) => (
              <div key={pref.key} className="flex items-start gap-3 p-3 rounded-xl border border-line bg-white/50">
                <input
                  type="checkbox"
                  name={pref.key}
                  defaultChecked={values[pref.key]}
                  className="form-checkbox h-5 w-5 shrink-0"
                />
                <div>
                  <p className="font-medium text-ink">{pref.label}</p>
                  <p className="text-sm text-ink-muted">{pref.description}</p>
                </div>
              </div>
            ))}
            <div className="mt-6 flex justify-end">
              <Button type="submit">Save preferences</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Accessibility review checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted mb-4">
            Review published pages and stories for WCAG 2.2 AA conformance. Each
            review is recorded as compliance evidence.
          </p>
          <EmptyState
            title="No review records yet."
            description="Accessibility reviews are recorded when editorial staff complete a WCAG check on a page or story."
          />
        </CardContent>
      </Card>
    </div>
  );
}
