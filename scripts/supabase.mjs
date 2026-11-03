#!/usr/bin/env node
/**
 * Supabase CLI launcher.
 *
 * The `supabase` npm wrapper ships the actual CLI as platform-specific
 * optional dependencies. On some machines (constrained networks, npm proxies)
 * that optional download fails or arrives corrupted, and every `supabase`
 * command dies with `No matching Supabase CLI binary package found`.
 *
 * This shim fixes that: if an official CLI binary is available locally under
 * `.tools/` it is used via the CLI's documented `SUPABASE_CLI_BINARY_OVERRIDE`
 * escape hatch; otherwise the regular resolution path runs unchanged.
 *
 * `.tools/` is git-ignored. To bootstrap it (see README):
 *
 *   node scripts/supabase.js install
 */
import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { get } from "node:https";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const toolsDir = path.join(repoRoot, ".tools");
const isWindows = process.platform === "win32";
const binaryName = isWindows ? "supabase.exe" : "supabase";
const toolsBinary = path.join(toolsDir, binaryName);

const RELEASE_VERSION = "3.0.0";
const RELEASE_ASSETS = {
  win32: {
    x64: `https://github.com/supabase/cli/releases/download/v${RELEASE_VERSION}/supabase_${RELEASE_VERSION}_windows_amd64.zip`,
    arm64: `https://github.com/supabase/cli/releases/download/v${RELEASE_VERSION}/supabase_${RELEASE_VERSION}_windows_arm64.zip`,
  },
  darwin: {
    x64: `https://github.com/supabase/cli/releases/download/v${RELEASE_VERSION}/supabase_${RELEASE_VERSION}_macos_x86_64.tar.gz`,
    arm64: `https://github.com/supabase/cli/releases/download/v${RELEASE_VERSION}/supabase_${RELEASE_VERSION}_macos_all.tar.gz`,
  },
  linux: {
    x64: `https://github.com/supabase/cli/releases/download/v${RELEASE_VERSION}/supabase_${RELEASE_VERSION}_linux_amd64.tar.gz`,
    arm64: `https://github.com/supabase/cli/releases/download/v${RELEASE_VERSION}/supabase_${RELEASE_VERSION}_linux_arm64.tar.gz`,
  },
};

/** Download a URL to a file, following one redirect level. */
function download(url, outFile) {
  return new Promise((resolve, reject) => {
    const request = (target) =>
      get(target, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume();
          request(new URL(response.headers.location, target).toString());
          return;
        }
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Download failed with HTTP ${response.statusCode}: ${url}`));
          return;
        }
        const stream = createWriteStream(outFile);
        response.pipe(stream);
        stream.on("finish", () => stream.close(resolve));
        stream.on("error", reject);
      });
    request.on("error", reject);
    request(url);
  });
}

async function install() {
  const platformAssets = RELEASE_ASSETS[process.platform];
  if (!platformAssets || !platformAssets[process.arch]) {
    console.error(
      `No binary mapping for ${process.platform}-${process.arch}. Install the Supabase CLI manually.`,
    );
    process.exit(1);
  }
  mkdirSync(toolsDir, { recursive: true });
  const archivePath = path.join(toolsDir, path.basename(new URL(platformAssets[process.arch]).pathname));
  console.log(`Downloading ${platformAssets[process.arch]} ...`);
  await download(platformAssets[process.arch], archivePath);
  if (archivePath.endsWith(".zip")) {
    const { execFileSync } = await import("node:child_process");
    execFileSync(isWindows ? "powershell" : "tar", [
      ...(isWindows ? ["-NoProfile", "-Command", `Expand-Archive -Force -LiteralPath "${archivePath}" -DestinationPath "${toolsDir}"`] : ["-xzf", archivePath, "-C", toolsDir]),
    ], { stdio: "inherit" });
  } else {
    const { execSync } = await import("node:child_process");
    execSync(`tar -xzf "${archivePath}" -C "${toolsDir}"`, { stdio: "inherit" });
  }
  if (!existsSync(toolsBinary)) {
    console.error(`Archive extracted but ${toolsBinary} is missing.`);
    process.exit(1);
  }
  console.log(`Supabase CLI ${RELEASE_VERSION} installed at ${toolsBinary}`);
}

if (process.argv[2] === "install") {
  await install();
  process.exit(0);
}

if (existsSync(toolsBinary)) {
  process.env.SUPABASE_CLI_BINARY_OVERRIDE = toolsBinary;
}

const child = spawn(process.execPath, [path.join(repoRoot, "node_modules", "supabase", "dist", "supabase.js"), ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
