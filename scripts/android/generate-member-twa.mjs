#!/usr/bin/env node
/**
 * Non-interactive Member TWA project generation via @bubblewrap/core.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const memberDir = path.join(root, "android/member");
const curatedPath = path.join(memberDir, "twa-manifest.curated.json");
const manifestPath = path.join(memberDir, "twa-manifest.json");

async function loadBubblewrapCore() {
  try {
    return require("@bubblewrap/core");
  } catch {
    const { execSync } = await import("node:child_process");
    const cache = path.join(memberDir, ".bw-deps");
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
  m.appVersion = m.appVersionName || m.appVersion || "1.1.0";
  m.appVersionName = m.appVersion;
  m.appVersionCode = Number(m.appVersionCode || 2);
  m.launcherName = m.launcherName || m.name || "Alto Rich";
  m.packageId = "com.altorich.app";
  m.host = "altorich.com";
  m.startUrl = "/app";
  m.enableNotifications = true;
  m.signingKey = {
    path: path.resolve(root, "android/signing-key.jks"),
    alias: "altorich-admin"
  };
  m.shortcuts = (m.shortcuts || []).map((s) => ({
    ...s,
    url: typeof s.url === "string" && s.url.startsWith("http") ? new URL(s.url).pathname : s.url
  }));
  return m;
}

async function main() {
  if (!fs.existsSync(curatedPath)) {
    throw new Error("Missing android/member/twa-manifest.curated.json");
  }

  const raw = JSON.parse(fs.readFileSync(curatedPath, "utf8"));
  const normalized = normalizeManifest(raw);
  fs.mkdirSync(memberDir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(normalized, null, 2) + "\n");
  fs.writeFileSync(curatedPath, JSON.stringify(normalized, null, 2) + "\n");

  const { TwaManifest, TwaGenerator, ConsoleLog } = await loadBubblewrapCore();
  const twaManifest = await TwaManifest.fromFile(manifestPath);
  const validationError = twaManifest.validate();
  if (validationError) {
    throw new Error(`Invalid twa-manifest: ${validationError}`);
  }

  for (const entry of fs.readdirSync(memberDir)) {
    if (entry.startsWith("twa-manifest") || entry === ".bw-deps") continue;
    fs.rmSync(path.join(memberDir, entry), { recursive: true, force: true });
  }

  const generator = new TwaGenerator();
  const log = typeof ConsoleLog === "function" ? new ConsoleLog("twa-generator") : console;
  console.log("Generating Member Android TWA project…");
  await generator.createTwaProject(memberDir, twaManifest, log, (done, total) => {
    if (done === total) console.log(`Generated ${done}/${total} assets`);
  });

  const crypto = await import("node:crypto");
  const digest = crypto.createHash("sha256").update(fs.readFileSync(manifestPath)).digest("hex");
  fs.writeFileSync(path.join(memberDir, "manifest-checksum.txt"), digest + "\n");

  const saved = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  saved.signingKey = { path: "../signing-key.jks", alias: "altorich-admin" };
  saved.appVersionName = saved.appVersion || saved.appVersionName || "1.1.0";
  fs.writeFileSync(manifestPath, JSON.stringify(saved, null, 2) + "\n");
  const digest2 = crypto.createHash("sha256").update(fs.readFileSync(manifestPath)).digest("hex");
  fs.writeFileSync(path.join(memberDir, "manifest-checksum.txt"), digest2 + "\n");

  console.log("Member TWA project ready at android/member/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
