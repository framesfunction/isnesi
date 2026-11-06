import { z } from "zod";

/**
 * Users module validation schemas: role assignment, role revocation,
 * account activation/deactivation. The contract between admin forms and
 * the database; RLS stays the backstop.
 */

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null))
  .refine((value) => value === null || z.uuid().safeParse(value).success, "Invalid id.");

export const assignUserRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  expiresAt: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === undefined || value.length === 0 ? null : value))
    .refine(
      (value) => value === null || !Number.isNaN(Date.parse(value)),
      "Use a valid date.",
    ),
});

export const revokeUserRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const setUserActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

export const updateUserProfileSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().trim().email("Enter a valid work email address."),
  roleId: z.string().uuid(),
  expiresAt: optionalId,
});

export const deleteProfileSchema = z.object({ userId: z.string().uuid() });
