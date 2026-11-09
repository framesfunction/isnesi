import { z } from "zod";

/**
 * Environment access for ISNESI.
 *
 * Design rules:
 * 1. Nothing is parsed at module scope. A missing variable must never crash
 *    `next build`, it must fail loudly at the moment a feature is used.
 * 2. Secrets live only in `getServerEnv()` and must never be imported from a
 *    Client Component. Only `NEXT_PUBLIC_*` values reach the browser bundle.
 */

const nonEmpty = z.string().trim().min(1);

/** Only these two values determine whether Supabase can be reached at all. */
const supabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: nonEmpty,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmpty,
});

const publicEnvSchema = supabaseSchema.extend({
  NEXT_PUBLIC_SITE_URL: nonEmpty.default("http://localhost:3000"),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: nonEmpty,
});

export type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  siteUrl: string;
};

export type ServerEnv = {
  serviceRoleKey: string;
};

export class EnvironmentError extends Error {
  readonly missing: string[];

  constructor(scope: string, missing: string[]) {
    super(
      `Missing or invalid environment configuration for ${scope}: ${missing.join(", ")}. ` +
        "Copy `.env.example` to `.env.local` and provide real values.",
    );
    this.name = "EnvironmentError";
    this.missing = missing;
  }
}

function readRaw(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  };
}

function missingKeys(error: z.ZodError, raw: Record<string, string | undefined>): string[] {
  const keys = new Set<string>();
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "environment");
    keys.add(issue.code === "invalid_type" ? `${key} (unset)` : key);
  }
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) keys.add(`${key} (unset)`);
  }
  return [...keys].sort();
}

/** True when the public Supabase configuration is present and usable. */
export function isSupabaseConfigured(): boolean {
  return supabaseSchema.safeParse(readRaw()).success;
}

/**
 * Public Supabase/site configuration. Safe in both server and client code
 * because every value is prefixed with `NEXT_PUBLIC_`.
 */
export function getPublicEnv(): PublicEnv {
  const raw = readRaw();
  const parsed = publicEnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new EnvironmentError("public application", missingKeys(parsed.error, raw));
  }
  return {
    supabaseUrl: parsed.data.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, ""),
    supabaseAnonKey: parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    siteUrl: parsed.data.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, ""),
  };
}

/**
 * Server-only configuration. The service role key bypasses Row Level Security,
 * so this must only ever be called from server code and never be serialised
 * into a response.
 */
export function getServerEnv(): ServerEnv {
  const raw = readRaw();
  const parsed = serverEnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new EnvironmentError("server-side administration", missingKeys(parsed.error, raw));
  }
  return { serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY };
}

/** Whether privileged server-side operations can run in this environment. */
export function isServiceRoleConfigured(): boolean {
  return serverEnvSchema.safeParse(readRaw()).success;
}
