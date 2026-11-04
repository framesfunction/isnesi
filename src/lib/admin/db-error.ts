import type { ActionResult } from "@/lib/admin/action-result";

/**
 * Translate a Postgres/Supabase error into an admin-safe `ActionResult`.
 *
 * The single place every module maps database failures to a message a staff
 * member can act on. Raw database text is never shown: constraint and RLS
 * errors are recognised by their SQLSTATE code, and anything unrecognised is
 * logged server-side and reported generically so internals never leak.
 */
export function dbErrorMessage(
  error: { code?: string; message?: string },
  context: string,
): ActionResult<never> {
  if (error.code === "23505") {
    return { status: "error", message: "That value is already in use by another record." };
  }
  if (error.code === "23514") {
    return { status: "error", message: "A database constraint rejected the value — check the fields." };
  }
  if (error.code === "23503") {
    return { status: "error", message: "That record is still referenced elsewhere and cannot be removed." };
  }
  if (error.code === "42501") {
    console.warn(`[isnesi] ${context} blocked by row level security`);
    return { status: "error", message: "Your account does not have permission to perform this action." };
  }
  console.warn(`[isnesi] ${context} failed`, { code: error.code });
  return { status: "error", message: "The database rejected the change. Please try again." };
}
