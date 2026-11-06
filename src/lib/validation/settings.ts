import { z } from "zod";

/**
 * Settings module validation schemas: site settings updates.
 * Secrets and API keys are never stored in site_settings; only public
 * configuration values are editable here.
 */

export const saveSiteSettingSchema = z.object({
  key: z.string().trim().min(1, "Required.").max(120),
  value: z.string().trim(),
  isPublic: z.boolean(),
});

export const deleteSiteSettingSchema = z.object({ key: z.string().trim().min(1, "Required.") });
