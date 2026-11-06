#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(content) {
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
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

const localEnv = parseEnvFile(await readFile(path.join(repoRoot, ".env.local"), "utf8"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl =
  process.env.SUPABASE_DB_URL || localEnv.SUPABASE_DB_URL;

let connectionString = databaseUrl;
if (!connectionString && url) {
  const password =
    process.env.SUPABASE_DB_PASSWORD || localEnv.SUPABASE_DB_PASSWORD;
  if (password) {
    const projectRef = new URL(url).hostname.split(".")[0];
    const region =
      process.env.SUPABASE_POOLER_REGION ||
      localEnv.SUPABASE_POOLER_REGION ||
      "aws-0-eu-west-1";
    connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${region}.pooler.supabase.com:5432/postgres`;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) reject(new Error(`Process terminated by signal ${signal}`));
      else resolve(code ?? 0);
    });
  });
}

const dbPushCode = await run(process.execPath, [
  path.join(repoRoot, "scripts", "db-push.mjs"),
]);
if (dbPushCode !== 0) process.exit(dbPushCode);

if (!connectionString) {
  console.error(
    "Seeded media could not be deployed because SUPABASE_DB_PASSWORD (or SUPABASE_DB_URL) is missing.",
  );
  process.exit(1);
}

const seedSql = await readFile(path.join(repoRoot, "supabase", "seed.sql"), "utf8");
const database = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
await database.connect();
try {
  const { rows } = await database.query(
    "select (select count(*)::int from public.pages) as page_count",
  );
  if ((rows[0]?.page_count ?? 0) === 0) {
    await database.query(seedSql);
    console.log("Hosted seed data applied.");
  } else {
    console.log("Hosted seed data already present; skipped seed SQL.");
  }
  await database.query(`
    update public.media_assets
    set credit = 'Unsplash',
        rights_status = 'licensed',
        rights_reference = 'Unsplash License - https://unsplash.com/license',
        mime_type = 'image/jpeg',
        width = 1600
    where object_path in (
      'uploads/2026/hero-classroom.jpg',
      'uploads/2026/teacher-workshop.jpg',
      'uploads/2026/assistive-device.jpg'
    );
  `);
} catch (error) {
  console.error(`Could not apply supabase/seed.sql: ${error.message}`);
  await database.end();
  process.exit(1);
}
await database.end();

if (!url || !serviceRoleKey) {
  console.error(
    "Seeded database rows were applied, but media files could not be uploaded because NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const favicon = await readFile(
  path.join(repoRoot, "public", "icons", "favicon-48.png"),
);
const classroomPhoto = await readFile(
  path.join(repoRoot, "public", "seed-media", "classroom.jpg"),
);
const workshopPhoto = await readFile(
  path.join(repoRoot, "public", "seed-media", "teacher-workshop.jpg"),
);
const learningPhoto = await readFile(
  path.join(repoRoot, "public", "seed-media", "assistive-learning.jpg"),
);
const communityPhoto = await readFile(
  path.join(repoRoot, "public", "seed-media", "community-learning.jpg"),
);

const minimalPdf = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /Helvetica 24 Tf 72 720 Td (ISNESI Kids Storybook) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \ntrailer\n<< /Root 1 0 R /Size 5 >>\n%%EOF\n",
);

const uploads = [
  ["uploads/2026/hero-classroom.jpg", classroomPhoto, "image/jpeg"],
  ["uploads/2026/teacher-workshop.jpg", workshopPhoto, "image/jpeg"],
  ["uploads/2026/assistive-device.jpg", learningPhoto, "image/jpeg"],
  ["uploads/2026/partner-logo-unicef.png", favicon, "image/png"],
  ["uploads/2026/pending-asset.jpg", communityPhoto, "image/jpeg"],
  ["uploads/2026/expired-asset.jpg", communityPhoto, "image/jpeg"],
  ["uploads/2026/kids-storybook.pdf", minimalPdf, "application/pdf"],
];

for (const [objectPath, body, contentType] of uploads) {
  const { error } = await supabase.storage
    .from("public-media")
    .upload(objectPath, body, { contentType, upsert: true });
  if (error) {
    console.error(`Could not upload ${objectPath}: ${error.message}`);
    process.exit(1);
  }
}

console.log(`Seed applied and ${uploads.length} sample media files uploaded.`);
