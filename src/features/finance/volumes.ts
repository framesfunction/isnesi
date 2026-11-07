/**
 * Per-currency volume aggregation for finance.
 *
 * Money is never summed across currencies: minor-unit amounts in XAF and EUR
 * are not comparable, so every volume is grouped by its own currency code.
 * Pure functions, unit-tested independently of the database layer.
 */

export type CurrencyVolume = { currency: string; count: number; minor: number };

export function groupVolumeByCurrency(
  rows: { amount_minor: number; currency: string }[] | null,
): CurrencyVolume[] {
  const byCurrency = new Map<string, CurrencyVolume>();
  for (const row of rows ?? []) {
    const currency = row.currency || "XAF";
    const entry = byCurrency.get(currency) ?? { currency, count: 0, minor: 0 };
    entry.count += 1;
    entry.minor += row.amount_minor ?? 0;
    byCurrency.set(currency, entry);
  }
  return [...byCurrency.values()].sort((a, b) => b.minor - a.minor);
}

/** Volume labels like "XAF 1,500,000" (or "—" when the currency has no rows). */
export function describeVolumes(
  volumes: CurrencyVolume[],
  format: (amountMinor: number, currency: string) => string,
): string {
  if (volumes.length === 0) return "—";
  return volumes
    .map((volume) => `${format(volume.minor, volume.currency)} ${volume.currency}`.trim())
    .join(" · ");
}
