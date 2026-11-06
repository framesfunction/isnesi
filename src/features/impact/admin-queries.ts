import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import type { ImpactMetricUnit } from "@/features/impact/helpers";

/**
 * Admin reads for the Impact metrics module.
 *
 * Visibility is decided by Row Level Security (`pages.manage`), so these
 * functions add no authorisation of their own. They return `null` when Supabase
 * is not configured so the page can say so instead of showing an empty list.
 */

export type AdminImpactMetric = {
  id: string;
  key: string;
  label: string;
  value: number;
  unit: ImpactMetricUnit;
  currency: string | null;
  description: string | null;
  sourceNote: string | null;
  evidenceUrl: string | null;
  reportingPeriod: string | null;
  sortOrder: number;
  isPublished: boolean;
  approvedAt: string | null;
  updatedAt: string;
};

const METRIC_COLUMNS =
  "id, key, label, value, unit, currency, description, source_note, evidence_url, reporting_period, sort_order, is_published, approved_at, updated_at";

type MetricRow = {
  id: string;
  key: string;
  label: string;
  value: unknown;
  unit: string;
  currency: string | null;
  description: string | null;
  source_note: string | null;
  evidence_url: string | null;
  reporting_period: string | null;
  sort_order: number;
  is_published: boolean;
  approved_at: string | null;
  updated_at: string;
};

const UNITS: readonly ImpactMetricUnit[] = ["count", "percentage", "currency"];

function toNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toUnit(value: string): ImpactMetricUnit {
  return UNITS.includes(value as ImpactMetricUnit) ? (value as ImpactMetricUnit) : "count";
}

function toMetric(row: MetricRow): AdminImpactMetric {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    value: toNumber(row.value),
    unit: toUnit(row.unit),
    currency: row.currency,
    description: row.description,
    sourceNote: row.source_note,
    evidenceUrl: row.evidence_url,
    reportingPeriod: row.reporting_period,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    approvedAt: row.approved_at,
    updatedAt: row.updated_at,
  };
}

/** Impact metrics in display order; optional key/label search. */
export async function listAdminImpactMetrics(
  search: string,
): Promise<AdminImpactMetric[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("impact_metrics")
    .select(METRIC_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("key", { ascending: true })
    .limit(200);

  if (error) {
    console.warn("[isnesi] admin impact metrics unavailable", { code: error.code });
    return null;
  }

  const needle = search.trim().toLowerCase();

  return ((data ?? []) as MetricRow[])
    .map(toMetric)
    .filter(
      (metric) =>
        needle.length === 0 ||
        metric.key.includes(needle) ||
        metric.label.toLowerCase().includes(needle),
    );
}

/** One metric for editing, or null when it does not exist or is not readable. */
export async function getAdminImpactMetric(metricId: string): Promise<AdminImpactMetric | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("impact_metrics")
    .select(METRIC_COLUMNS)
    .eq("id", metricId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin impact metric unavailable", { metricId, code: error.code });
    return null;
  }
  if (!data) return null;

  return toMetric(data as MetricRow);
}
