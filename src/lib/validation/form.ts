import { z } from "zod";

import { actionError, type ActionResult } from "@/lib/admin/action-result";

/**
 * Shared form validation helpers.
 *
 * One `field -> message` shape is used by every Server Action and every form,
 * so error rendering is identical across the admin application.
 */

/** Flatten Zod issues into a `field -> message` map for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

/**
 * Parse form input with a schema and return either the data or a ready-to-return
 * `ActionResult`. Keeps every action's validation branch to three lines.
 */
export function validateForm<S extends z.ZodType>(
  schema: S,
  input: unknown,
):
  | { ok: true; data: z.infer<S> }
  | { ok: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return {
    ok: false,
    result: actionError(
      "Please correct the highlighted fields and try again.",
      fieldErrors(parsed.error),
    ),
  };
}
