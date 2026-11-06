import {
  countPublishedStories,
  listPublishedStories,
  type StorySummary,
} from "@/features/editorial/queries";
import { listPublicPartners } from "@/features/partners/queries";
import { listProgrammes, type ProgrammeSummary } from "@/features/programmes/queries";
import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";

import {
  buildImpactFigures,
  buildImpactFiguresFromMetrics,
  toMetricNumber,
  type ImpactFigure,
  type ImpactMetricRow,
  type ImpactMetricUnit,
} from "./helpers";

/**
 * Everything the public Impact page needs, in one place.
 *
 * The route stays orchestration-only: this module owns the fan-out to the
 * metrics, programmes, partners and editorial queries and shapes the result.
 *
 * Reported figures prefer approved `impact_metrics` rows, because those carry an
 * approval date and a source. When none exist, the page falls back to live
 * counts of published records — still true, just less specific. Each source
 * already fails closed to an empty value when the database is unreachable, so
 * the page always renders an honest state rather than an error.
 */
export type ImpactFiguresSource = "metrics" | "published-records";

export type ImpactSnapshot = {
  figures: ImpactFigure[];
  figuresSource: ImpactFiguresSource;
  programmeAreas: ProgrammeSummary[];
  stories: StorySummary[];
};

const DEFAULT_STORY_LIMIT = 3;
const METRIC_UNITS: readonly ImpactMetricUnit[] = ["count", "percentage", "currency"];

function asUnit(value: string): ImpactMetricUnit {
  return METRIC_UNITS.includes(value as ImpactMetricUnit)
    ? (value as ImpactMetricUnit)
    : "count";
}

/**
 * Approved impact metrics, published and ordered by the admin.
 *
 * RLS already limits rows to published + approved; the explicit filter keeps the
 * intent readable. Returns an empty array (never throws) when the database is
 * unreachable, so the caller can fall back cleanly.
 */
export async function listPublishedImpactMetrics(): Promise<ImpactMetricRow[]> {
  if (!hasPublicContentAccess()) return [];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("impact_metrics")
      .select("key, label, value, unit, currency, description, evidence_url")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("key", { ascending: true });

    if (error) {
      console.warn("[isnesi] impact metrics unavailable", { code: error.code });
      return [];
    }

    return (data ?? []).map((row) => ({
      key: row.key,
      label: row.label,
      value: toMetricNumber(row.value),
      unit: asUnit(row.unit),
      currency: row.currency,
      description: row.description,
      evidenceUrl: row.evidence_url,
    }));
  } catch (error) {
    console.warn("[isnesi] impact metrics failed", error);
    return [];
  }
}

export async function getImpactSnapshot(
  options: { storyLimit?: number } = {},
): Promise<ImpactSnapshot> {
  const storyLimit = options.storyLimit ?? DEFAULT_STORY_LIMIT;

  const [programmes, partners, stories, storyCount, metrics] = await Promise.all([
    listProgrammes(),
    listPublicPartners(),
    listPublishedStories({ limit: storyLimit }),
    countPublishedStories(),
    listPublishedImpactMetrics(),
  ]);

  const hasMetrics = metrics.length > 0;

  return {
    figures: hasMetrics
      ? buildImpactFiguresFromMetrics(metrics)
      : buildImpactFigures({
          programmesCount: programmes.length,
          partnersCount: partners.length,
          storyCount,
        }),
    figuresSource: hasMetrics ? "metrics" : "published-records",
    programmeAreas: programmes,
    stories,
  };
}
