/**
 * Formatting helpers.
 *
 * Money is stored as an integer minor unit plus an explicit ISO currency code
 * (`donations.amount_minor` + `donations.currency`). XAF has no minor unit, so the
 * divisor is derived from the currency rather than hard-coded to 100.
 */

export function minorUnitDigits(currency: string): number {
  try {
    const options = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions();
    return options.maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export function formatCurrency(amountMinor: number, currency = "XAF"): string {
  const digits = minorUnitDigits(currency);
  const amount = amountMinor / 10 ** digits;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function truncate(value: string, maxLength = 160): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/** Human-readable label for a content status token. */
export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}