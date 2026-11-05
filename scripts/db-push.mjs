#!/usr/bin/env node
/**
 * Push pending migrations to the hosted Supabase project.
 *
 * Mirrors `scripts/db-types.mjs`: the project's db host is IPv6-only, so we go
 * through the AWS session pooler, and every CLI call is routed through
 * `scripts/supabase.mjs` so the documented Windows workaround applies.
 *
 * Inputs (from `.env.local`, git-ignored):
 *
 *   NEXT_PUBLIC_SUPABASE_URL            project ref is read from this URL
 *   SUPABASE_DB_PASSWORD                database password
 *   SUPABASE_POOLER_REGION (optional)   default: aws-0-eu-west-1
 *   SUPABASE_DB_URL (optional)          full override of the connection string
 *
 * Extra CLI flags are forwarded, e.g.:
 *
 *   npm run db:push                  # apply pending migrations
 *   npm run db:push -- --dry-run     # print what would be applied, change nothing
 *   npm run db:push -- --include-seed
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(content) {
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const overrideUrl = process.env.SUPABASE_DB_URL;
let url = overrideUrl;
if (!url) {
  const localEnv = parseEnvFile(await readFile(path.join(repoRoot, ".env.local"), "utf8"));
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD || localEnv.SUPABASE_DB_PASSWORD;
  const region = process.env.SUPABASE_POOLER_REGION || localEnv.SUPABASE_POOLER_REGION || "aws-0-eu-west-1";
  if (!projectUrl || !password) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_DB_PASSWORD in .env.local. " +
        "See .env.example and supabase/README.md.",
    );
    process.exit(1);
  }
  const ref = new URL(projectUrl).hostname.split(".")[0];
  const encoded = encodeURIComponent(password);
  url = `postgresql://postgres.${ref}:${encoded}@${region}.pooler.supabase.com:5432/postgres`;
}

const child = spawn(
  process.execPath,
  [
    path.join(repoRoot, "scripts", "supabase.mjs"),
    "db",
    "push",
    `--remote=${url}`,
    "--yes",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
