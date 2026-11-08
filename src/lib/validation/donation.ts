import { z } from "zod";

/**
 * Public donation creation schema.
 *
 * A public donation is created with status `created` (not yet paid). Payment
 * is confirmed only after the provider webhook verifies the transaction —
 * never by a browser redirect. Card numbers, CVV values and MoMo PINs are
 * never collected or stored.
 */

export const PAYMENT_METHODS = ["mobile_money"] as const;
export const PAYMENT_CURRENCIES = ["XAF"] as const;

export const createDonationSchema = z.object({
  amountMinor: z
    .coerce.number()
    .int("Amount must be a whole number.")
    .positive("Amount must be greater than zero.")
    .max(10_000_000_000, "Amount is too large."),
  currency: z
    .string()
    .trim()
    .min(1, "Currency is required.")
    .max(3)
    .refine((value) => PAYMENT_CURRENCIES.includes(value as (typeof PAYMENT_CURRENCIES)[number]), "Unsupported currency."),
  payerPhone: z
    .string()
    .trim()
    .min(6, "Please enter a valid phone number.")
    .max(20, "Phone number is too long.")
    .regex(/^[0-9+()\-\s]+$/, "Digits, spaces and +() only."),
  donorName: z.string().trim().max(200).optional().or(z.literal("")),
  donorEmail: z.string().trim().email("Enter a valid email address.").max(200).optional().or(z.literal("")),
  campaignId: z.string().uuid().optional(),
  isAnonymous: z.boolean().optional(),
});
