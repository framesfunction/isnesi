/**
 * The single result shape returned by every admin Server Action.
 *
 * One shape for every module means the shared client components
 * (`FormMessage`, `SubmitButton`) and the form state types stay identical
 * across the whole admin application, and a mutation can never succeed
 * silently: it either returns `actionOk(...)` or an explicit error.
 */

export type ActionStatus = "idle" | "success" | "error";

export type ActionResult<T = undefined> = {
  status: ActionStatus;
  message?: string;
  /** `field -> message` map, rendered next to the matching input. */
  fieldErrors?: Record<string, string>;
  data?: T;
};

/** Fresh form state before anything has been submitted. */
export const idleResult: ActionResult = { status: "idle" };

export function actionOk<T = undefined>(message?: string, data?: T): ActionResult<T> {
  return data === undefined ? { status: "success", message } : { status: "success", message, data };
}

export function actionError(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionResult<never> {
  return fieldErrors ? { status: "error", message, fieldErrors } : { status: "error", message };
}

export const FORBIDDEN_MESSAGE =
  "Your account does not have permission to perform this action.";

/** The actor is not authorised. Never a silent no-op. */
export function actionForbidden(): ActionResult<never> {
  return actionError(FORBIDDEN_MESSAGE);
}

export const NOT_CONFIGURED_MESSAGE =
  "The database is not connected, so nothing was saved. Configure Supabase and try again.";

/** The database is unreachable or unconfigured; fail closed. */
export function actionNotConfigured(): ActionResult<never> {
  return actionError(NOT_CONFIGURED_MESSAGE);
}

/** True when the action completed successfully. */
export function isSuccess<T>(result: ActionResult<T>): boolean {
  return result.status === "success";
}
