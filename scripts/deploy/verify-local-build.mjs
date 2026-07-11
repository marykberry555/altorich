#!/usr/bin/env node
/**
 * Verify a fresh Next.js build has consistent manifests and on-disk chunks.
 * Exit 1 if any referenced static asset is missing.
 */
import fs from "fs";
import path from "path";

const appRoot = process.env.APP_ROOT || process.cwd();
const nextDir = path.join(appRoot, ".next");

function readJson(relPath) {
  const full = path.join(nextDir, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing manifest: ${relPath}`);
  }
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function collectStaticFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectStaticFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function main() {
  const buildIdPath = path.join(nextDir, "BUILD_ID");
  if (!fs.existsSync(buildIdPath)) {
    console.error("FAIL: .next/BUILD_ID missing");
    process.exit(1);
  }
  const buildId = fs.readFileSync(buildIdPath, "utf8").trim();
  console.log(`BUILD_ID=${buildId}`);

  const requiredManifests = [
    "build-manifest.json",
    "prerender-manifest.json",
    "routes-manifest.json"
  ];

  for (const manifest of requiredManifests) {
    readJson(manifest);
    console.log(`OK manifest: ${manifest}`);
  }

  const staticRoot = path.join(nextDir, "static");
  const staticFiles = collectStaticFiles(staticRoot);
  if (staticFiles.length === 0) {
    console.error("FAIL: .next/static is empty");
    process.exit(1);
  }

  const jsChunks = staticFiles.filter((f) => f.endsWith(".js"));
  console.log(`OK static files: ${staticFiles.length} (${jsChunks.length} js)`);

  const stalePublicNext = path.join(appRoot, "public", "_next");
  if (fs.existsSync(stalePublicNext)) {
    console.error("FAIL: public/_next must not exist (stale asset leak)");
    process.exit(1);
  }

  const buildManifest = readJson("build-manifest.json");
  const pages = buildManifest.pages || {};
  let missing = 0;

  for (const assets of Object.values(pages)) {
    if (!Array.isArray(assets)) continue;
    for (const asset of assets) {
      if (!asset.startsWith("/_next/static/")) continue;
      const rel = asset.replace("/_next/static/", "");
      const disk = path.join(staticRoot, rel);
      if (!fs.existsSync(disk)) {
        console.error(`FAIL missing chunk from build-manifest: ${asset}`);
        missing += 1;
      }
    }
  }

  if (missing > 0) {
    console.error(`FAIL: ${missing} build-manifest assets missing on disk`);
    process.exit(1);
  }

  console.log("PASS: local build integrity verified");
}

main();
