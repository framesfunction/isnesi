import { siteConfig } from "@/lib/site";
import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";
import type { Json } from "@/types/database";

/**
 * Public site settings.
 *
 * Only rows flagged `is_public` are readable by anonymous visitors, enforced by
 * the `public_site_settings` RLS policy. Secrets must never live in
 * `site_settings`.
 */
export type PublicSiteSettings = {
  organisation: { name: string; tagline: string };
  donation: { currency: string; enabled: boolean };
};

const DEFAULTS: PublicSiteSettings = {
  organisation: { name: siteConfig.name, tagline: siteConfig.tagline },
  donation: { currency: siteConfig.currency, enabled: false },
};

function asRecord(value: Json | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  if (!hasPublicContentAccess()) return DEFAULTS;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .eq("is_public", true);

    if (error) {
      console.warn("[isnesi] unable to load public site settings", { code: error.code });
      return DEFAULTS;
    }

    const settings = new Map((data ?? []).map((row) => [row.key, row.value]));
    const organisation = asRecord(settings.get("organisation"));
    const donation = asRecord(settings.get("donation"));

    return {
      organisation: {
        name: asString(organisation.name, DEFAULTS.organisation.name),
        tagline: asString(organisation.tagline, DEFAULTS.organisation.tagline),
      },
      donation: {
        currency: asString(donation.currency, DEFAULTS.donation.currency),
        enabled: asBoolean(donation.enabled, DEFAULTS.donation.enabled),
      },
    };
  } catch (error) {
    console.warn("[isnesi] public settings unavailable", error);
    return DEFAULTS;
  }
}