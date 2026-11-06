import { ActionForm } from "@/components/admin/action-form";
import { saveImpactMetricAction } from "@/features/impact/actions";
import type { AdminImpactMetric } from "@/features/impact/admin-queries";

/**
 * Shared create/edit form for an impact metric.
 *
 * One component keeps the two screens identical. Every figure the public Impact
 * page may show is entered here, together with its source, so a published number
 * can always be traced back to evidence.
 */

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";

const INPUT_CLASS = "min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink";

const UNITS = [
  { value: "count", label: "Count (a whole number)" },
  { value: "percentage", label: "Percentage" },
  { value: "currency", label: "Currency amount" },
] as const;

export function ImpactMetricForm({ metric }: { metric?: AdminImpactMetric }) {
  return (
    <ActionForm
      action={saveImpactMetricAction}
      submitLabel={metric ? "Save metric" : "Create metric"}
    >
      {metric ? <input type="hidden" name="metricId" value={metric.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={FIELD_LABELS}>
          <span>Key</span>
          <input
            type="text"
            name="key"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={metric?.key ?? ""}
            placeholder="e.g. children-reached"
            className={INPUT_CLASS}
          />
        </label>
        <label className={FIELD_LABELS}>
          <span>Label (shown on the public page)</span>
          <input
            type="text"
            name="label"
            required
            defaultValue={metric?.label ?? ""}
            placeholder="e.g. Children reached"
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <label className={FIELD_LABELS}>
          <span>Value</span>
          <input
            type="number"
            name="value"
            required
            step="any"
            min="0"
            defaultValue={metric?.value ?? 0}
            className={INPUT_CLASS}
          />
        </label>
        <label className={FIELD_LABELS}>
          <span>Unit</span>
          <select name="unit" defaultValue={metric?.unit ?? "count"} className={INPUT_CLASS}>
            {UNITS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </label>
        <label className={FIELD_LABELS}>
          <span>Currency (currency unit only)</span>
          <input
            type="text"
            name="currency"
            maxLength={3}
            defaultValue={metric?.currency ?? "XAF"}
            placeholder="XAF"
            className={`${INPUT_CLASS} uppercase`}
          />
        </label>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className={FIELD_LABELS}>
          <span>Description</span>
          <input
            type="text"
            name="description"
            defaultValue={metric?.description ?? ""}
            placeholder="One line explaining the figure"
            className={INPUT_CLASS}
          />
        </label>
        <label className={FIELD_LABELS}>
          <span>Reporting period</span>
          <input
            type="text"
            name="reportingPeriod"
            defaultValue={metric?.reportingPeriod ?? ""}
            placeholder="e.g. January to December 2026"
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className={FIELD_LABELS}>
          <span>Source note</span>
          <input
            type="text"
            name="sourceNote"
            defaultValue={metric?.sourceNote ?? ""}
            placeholder="Where the number comes from"
            className={INPUT_CLASS}
          />
        </label>
        <label className={FIELD_LABELS}>
          <span>Evidence URL (optional)</span>
          <input
            type="url"
            name="evidenceUrl"
            defaultValue={metric?.evidenceUrl ?? ""}
            placeholder="https://…"
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className={FIELD_LABELS}>
          <span>Sort order</span>
          <input
            type="number"
            name="sortOrder"
            defaultValue={metric?.sortOrder ?? 0}
            className={INPUT_CLASS}
          />
        </label>
        <label className={`${FIELD_LABELS} justify-start`}>
          <span>Published on the public page</span>
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={metric ? metric.isPublished : false}
            className="size-5 rounded border-2 border-line"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        Publishing stamps the approval date. A metric cannot be public without one, so an
        unpublished figure is never shown to visitors.
      </p>
    </ActionForm>
  );
}
