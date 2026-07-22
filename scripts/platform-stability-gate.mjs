#!/usr/bin/env node
/**
 * Platform stability gate — extends release-gate with admin route sweep + static API scan.
 * Usage: node scripts/platform-stability-gate.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const BASE = (process.env.RELEASE_GATE_BASE_URL ?? "https://altorich.com").replace(/\/$/, "");

const ADMIN_ROUTES = [
  "",
  "deposits",
  "withdrawals",
  "members",
  "announcements",
  "support",
  "reports",
  "settings",
  "fraud",
  "audit",
  "reconciliation",
  "payouts",
  "settlements",
  "liquidations",
  "investments",
  "plans",
  "funding-accounts",
  "payment-rails",
  "welcome-bonus",
  "referrals",
  "financial-health",
  "system-health",
  "errors",
  "operations",
  "exports",
  "notifications",
  "security",
  "activity"
];

const ADMIN_APIS = [
  "/api/admin/deposits",
  "/api/admin/members",
  "/api/admin/live-metrics",
  "/api/admin/operations-feed",
  "/api/admin/financial-health",
  "/api/admin/welcome-bonus",
  "/api/admin/withdrawals/list",
  "/api/admin/errors"
];

function walkApiRoutes(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkApiRoutes(full, files);
    else if (entry === "route.ts") files.push(full);
  }
  return files;
}

function scanUnprotectedRoutes() {
  const routes = walkApiRoutes(join(ROOT, "src/app/api"));
  const unprotected = [];
  for (const file of routes) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    const src = readFileSync(file, "utf8");
    if (!/export async function (GET|POST|PUT|PATCH|DELETE)/.test(src)) continue;
    if (/withApiHandler|apiErrorResponse|catch \(error\)|catch \(err\)/.test(src)) continue;
    unprotected.push(rel);
  }
  return unprotected;
}

async function fetchStatus(path) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { "User-Agent": "AltoRich-PlatformStability/1.0", "Cache-Control": "no-cache" }
  });
  return res.status;
}

async function main() {
  console.log(`AltoRich — Platform Stability Gate (${BASE})\n`);

  const release = spawnSync("node", ["scripts/release-gate.mjs"], {
    cwd: ROOT,
    env: { ...process.env, RELEASE_GATE_BASE_URL: BASE },
    stdio: "inherit"
  });
  if (release.status !== 0) {
    console.error("\nAborting: release gate failed.");
    process.exit(release.status ?? 1);
  }

  console.log("\n--- Admin route sweep (unauthenticated must not 5xx) ---\n");
  let adminFailed = 0;
  for (const segment of ADMIN_ROUTES) {
    const path = segment ? `/admin-app/${segment}` : "/admin-app";
    const status = await fetchStatus(path);
    const ok = status !== 500 && status !== 502 && status !== 503;
    console.log(`${ok ? "PASS" : "FAIL"}  ${path} — HTTP ${status}`);
    if (!ok) adminFailed += 1;
  }

  console.log("\n--- Admin API auth envelope (anonymous must 401/403, never 5xx) ---\n");
  let apiFailed = 0;
  for (const path of ADMIN_APIS) {
    const status = await fetchStatus(path);
    const ok = (status === 401 || status === 403) && status !== 500;
    console.log(`${ok ? "PASS" : "FAIL"}  ${path} — HTTP ${status}`);
    if (!ok) apiFailed += 1;
  }

  console.log("\n--- Static scan: API routes without error handling ---\n");
  const unprotected = scanUnprotectedRoutes();
  if (unprotected.length === 0) {
    console.log("PASS  All API route handlers appear guarded.");
  } else {
    console.log(`WARN  ${unprotected.length} route file(s) lack explicit error handling:`);
    for (const file of unprotected) console.log(`  • ${file}`);
  }

  const failed = adminFailed + apiFailed;
  console.log(`\nPlatform stability gate extensions: ${failed} failed, ${unprotected.length} unprotected route(s) noted.`);

  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
