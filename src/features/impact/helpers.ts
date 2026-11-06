/**
 * Pure support code for the public Impact page.
 *
 * Two decisions are worth testing and live here and nowhere else: which figures
 * the page is allowed to report, and the structured data the page hands to
 * search engines. Both stay honest — a figure is either an approved
 * `impact_metrics` row or a live count of published records, never a projection.
 */

import { formatCurrency, formatNumber, minorUnitDigits } from "@/lib/format";

/** How a figure is expressed; mirrors the `impact_metrics.unit` column. */
export type ImpactMetricUnit = "count" | "percentage" | "currency";

/** One reported figure: the number, how to display it, and where it is evidenced. */
export type ImpactFigure = {
  key: string;
  label: string;
  value: number;
  unit: ImpactMetricUnit;
  /** Pre-formatted value, so the presentation layer never formats numbers. */
  display: string;
  description: string;
  /** Evidence link; `null` when the figure has no public source to point at. */
  href: string | null;
  linkLabel: string | null;
};

export type ImpactFigureInput = {
  programmesCount: number;
  partnersCount: number;
  storyCount: number;
};

/** Clamp any incoming count to a whole, non-negative number. */
function toCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Format a metric for display.
 *
 * Percentages keep one decimal, currency uses the real ISO code (XAF has no
 * minor unit, which `minorUnitDigits` accounts for) and everything else is a
 * grouped integer.
 */
export function formatMetricValue(
  value: number,
  unit: ImpactMetricUnit,
  currency: string | null,
): string {
  const safe = Number.isFinite(value) && value > 0 ? value : 0;

  if (unit === "percentage") {
    return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(safe)}%`;
  }

  if (unit === "currency") {
    const code = currency && /^[A-Z]{3}$/.test(currency) ? currency : "XAF";
    const digits = minorUnitDigits(code);
    return formatCurrency(Math.round(safe * 10 ** digits), code);
  }

  return formatNumber(Math.floor(safe));
}

/**
 * Fallback figures: live counts of published records.
 *
 * Used only when no approved `impact_metrics` row exists, so the page still says
 * something true instead of something invented. Always returned in the same
 * order so the layout is stable.
 */
export function buildImpactFigures(input: ImpactFigureInput): ImpactFigure[] {
  const programmes = toCount(input.programmesCount);
  const partners = toCount(input.partnersCount);
  const stories = toCount(input.storyCount);

  return [
    {
      key: "programmes",
      label: "Active programmes",
      value: programmes,
      unit: "count",
      display: formatNumber(programmes),
      description:
        "Programme areas running today across inclusive education and social innovation.",
      href: "/programmes",
      linkLabel: "See the programmes",
    },
    {
      key: "partners",
      label: "Approved partners",
      value: partners,
      unit: "count",
      display: formatNumber(partners),
      description:
        "Organisations whose relationship with ISNESI is approved and publicly recorded.",
      href: "/partners",
      linkLabel: "Meet the partners",
    },
    {
      key: "stories",
      label: "Published stories",
      value: stories,
      unit: "count",
      display: formatNumber(stories),
      description: "Safeguarding-cleared stories and updates released by the editorial team.",
      href: "/stories",
      linkLabel: "Read the stories",
    },
  ];
}

/** A published `impact_metrics` row as the public page reads it. */
export type ImpactMetricRow = {
  key: string;
  label: string;
  value: number;
  unit: ImpactMetricUnit;
  currency: string | null;
  description: string | null;
  evidenceUrl: string | null;
};

/**
 * Postgres `numeric` arrives over the wire as a string; coerce it once here so
 * the rest of the page only ever sees a finite number.
 */
export function toMetricNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

/**
 * Turn approved metrics into reported figures, preserving the order the admin
 * chose. A metric with no `evidenceUrl` simply has no link.
 */
export function buildImpactFiguresFromMetrics(metrics: ImpactMetricRow[]): ImpactFigure[] {
  return metrics.map((metric) => {
    const value = toMetricNumber(metric.value);
    return {
      key: metric.key,
      label: metric.label,
      value,
      unit: metric.unit,
      display: formatMetricValue(value, metric.unit, metric.currency),
      description: metric.description ?? "",
      href: metric.evidenceUrl,
      linkLabel: metric.evidenceUrl ? "View the evidence" : null,
    };
  });
}

export type ImpactJsonLdInput = {
  baseUrl: string;
  path: string;
  name: string;
  description: string;
  siteName: string;
};

function normaliseBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function normalisePath(path: string): string {
  const trimmed = path.trim();
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailing = withLeading.replace(/\/+$/, "");
  return withoutTrailing.length === 0 ? "/" : withoutTrailing;
}

/**
 * JSON-LD for the Impact page: a `WebPage` describing the page and a
 * `BreadcrumbList` matching the on-page breadcrumb.
 *
 * Returned as an array so the route renders a single `<script type="application/ld+json">`
 * block. Values are plain strings and numbers, so the serialised output cannot
 * carry markup.
 */
export function buildImpactJsonLd(input: ImpactJsonLdInput): Record<string, unknown>[] {
  const base = normaliseBaseUrl(input.baseUrl);
  const path = normalisePath(input.path);
  const url = `${base}${path}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: input.name,
      description: input.description,
      url,
      inLanguage: "en",
      isPartOf: {
        "@type": "WebSite",
        name: input.siteName,
        url: base,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: input.name, item: url },
      ],
    },
  ];
}