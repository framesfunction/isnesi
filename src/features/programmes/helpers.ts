/**
 * Internal helpers for the Programmes Server Actions and admin form.
 *
 * No "use server" directive: only plain functions live here so they can be
 * imported by both the actions and the form component.
 */

/**
 * Parse a textarea value into a trimmed, non-empty list of lines. Objectives and
 * activities are edited as one item per line, which is easier than raw JSON and
 * still lands in a `jsonb` array column.
 */
export function parseLines(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 30);
}

/** Inverse of `parseLines`, for prefilling a textarea from stored jsonb. */
export function linesToText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.filter((item): item is string => typeof item === "string").join("\n");
}
