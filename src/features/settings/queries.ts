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
  donation: {
    currency: string;
    enabled: boolean;
    /** Currency codes accepted alongside the reporting currency. */
    currencies: string[];
    /** Per-currency funding instructions (bank/mobile money), keyed by code. */
    channels: Record<string, string>;
  };
};

const DEFAULTS: PublicSiteSettings = {
  organisation: { name: siteConfig.name, tagline: siteConfig.tagline },
  donation: {
    currency: siteConfig.currency,
    enabled: false,
    currencies: ["XAF", "EUR", "USD", "GBP"],
    channels: {},
  },
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

function asCurrencyCodes(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const codes = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toUpperCase())
    .filter((item) => /^[A-Z]{3}$/.test(item))
    .slice(0, 8);
  return codes.length > 0 ? [...new Set(codes)] : fallback;
}

function asChannelNotes(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].trim().length > 0,
  );
  return Object.fromEntries(entries.slice(0, 8));
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
        currencies: asCurrencyCodes(donation.currencies, DEFAULTS.donation.currencies),
        channels: asChannelNotes(donation.channels),
      },
    };
  } catch (error) {
    console.warn("[isnesi] public settings unavailable", error);
    return DEFAULTS;
  }
}