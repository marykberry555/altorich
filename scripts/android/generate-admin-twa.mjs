#!/usr/bin/env node
/**
 * Non-interactive Admin TWA project generation via @bubblewrap/core.
 * Avoids flaky Bubblewrap CLI init prompts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const adminDir = path.join(root, "android/admin");
const curatedPath = path.join(adminDir, "twa-manifest.curated.json");
const manifestPath = path.join(adminDir, "twa-manifest.json");
const fallbackManifest = path.join(adminDir, "twa-manifest.pre-init.json");

async function loadBubblewrapCore() {
  try {
    return require("@bubblewrap/core");
  } catch {
    // Install into a local cache under android/admin (gitignored via app/)
    const { execSync } = await import("node:child_process");
    const cache = path.join(adminDir, ".bw-deps");
    fs.mkdirSync(cache, { recursive: true });
    if (!fs.existsSync(path.join(cache, "node_modules/@bubblewrap/core"))) {
      console.log("Installing @bubblewrap/core locally…");
      execSync("npm install --no-save --prefix . @bubblewrap/core@1.24.1", {
        cwd: cache,
        stdio: "inherit"
      });
    }
    return createRequire(path.join(cache, "package.json"))("@bubblewrap/core");
  }
}

function normalizeManifest(raw) {
  const m = { ...raw };
  // Bubblewrap JSON historically uses appVersion; keep both in sync.
  m.appVersion = m.appVersionName || m.appVersion || "1.0.0";
  m.appVersionName = m.appVersion;
  m.appVersionCode = Number(m.appVersionCode || 1);
  m.launcherName = m.launcherName || m.name || "Alto Rich Admin";
  m.packageId = "com.altorich.admin";
  m.host = "altorich.com";
  m.startUrl = "/admin/auth";
  m.enableNotifications = true;
  m.signingKey = {
    path: path.resolve(root, "android/signing-key.jks"),
    alias: "altorich-admin"
  };
  // Shortcuts need relative urls for some bubblewrap versions
  m.shortcuts = (m.shortcuts || []).map((s) => ({
    ...s,
    url: typeof s.url === "string" && s.url.startsWith("http")
      ? new URL(s.url).pathname
      : s.url
  }));
  return m;
}

async function main() {
  const source = fs.existsSync(curatedPath)
    ? curatedPath
    : fs.existsSync(fallbackManifest)
      ? fallbackManifest
      : null;
  if (!source) {
    throw new Error("Missing curated twa-manifest.json");
  }

  const raw = JSON.parse(fs.readFileSync(source, "utf8"));
  const normalized = normalizeManifest(raw);
  fs.mkdirSync(adminDir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(normalized, null, 2) + "\n");
  // Keep curated copy for future releases
  fs.writeFileSync(curatedPath, JSON.stringify(normalized, null, 2) + "\n");

  const { TwaManifest, TwaGenerator, ConsoleLog } = await loadBubblewrapCore();
  const twaManifest = await TwaManifest.fromFile(manifestPath);
  const validationError = twaManifest.validate();
  if (validationError) {
    throw new Error(`Invalid twa-manifest: ${validationError}`);
  }

  // Clean previous generated project (keep manifests)
  for (const entry of fs.readdirSync(adminDir)) {
    if (entry.startsWith("twa-manifest") || entry === ".bw-deps") continue;
    fs.rmSync(path.join(adminDir, entry), { recursive: true, force: true });
  }

  const generator = new TwaGenerator();
  const log = typeof ConsoleLog === "function" ? new ConsoleLog("twa-generator") : console;
  console.log("Generating Android TWA project…");
  await generator.createTwaProject(adminDir, twaManifest, log, (done, total) => {
    if (done === total) console.log(`Generated ${done}/${total} assets`);
  });

  // Write checksum so `bubblewrap build` skips regenerate prompt
  const crypto = await import("node:crypto");
  const digest = crypto.createHash("sha256").update(fs.readFileSync(manifestPath)).digest("hex");
  fs.writeFileSync(path.join(adminDir, "manifest-checksum.txt"), digest + "\n");

  // Ensure relative signing path for bubblewrap build cwd
  const saved = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  saved.signingKey = { path: "../signing-key.jks", alias: "altorich-admin" };
  saved.appVersionName = saved.appVersion || saved.appVersionName || "1.0.0";
  fs.writeFileSync(manifestPath, JSON.stringify(saved, null, 2) + "\n");
  // Refresh checksum after final write
  const digest2 = crypto.createHash("sha256").update(fs.readFileSync(manifestPath)).digest("hex");
  fs.writeFileSync(path.join(adminDir, "manifest-checksum.txt"), digest2 + "\n");

  console.log("Admin TWA project ready at android/admin/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
