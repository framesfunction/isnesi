import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().max(254).email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  next: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Only allow same-origin, non-protocol-relative paths as post-login redirects.
 * This prevents an open-redirect via `?next=`.
 */
export function safeRedirectPath(value: unknown, fallback = "/admin"): string {
  if (typeof value !== "string") return fallback;
  const candidate = value.trim();
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\")) return fallback;
  return candidate;
}