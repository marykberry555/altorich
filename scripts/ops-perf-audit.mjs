#!/usr/bin/env node
/**
 * Operational performance audit — measures key route/API latencies.
 * Usage: node scripts/ops-perf-audit.mjs
 */
import { chromium } from "@playwright/test";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = (process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = resolve(process.cwd(), "test-results/ops-perf");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const LIMITS = {
  page: 3000,
  api: 1500,
  workflow: 8000
};

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq);
    if (!process.env[k]) process.env[k] = t.slice(eq + 1);
  }
}

loadEnv();

async function login(request, username, pin, intent) {
  const payload = { username, pin, deviceFingerprint: "td_opsperf00000000000000000001", userAgent: "AltoRich-Ops-Audit/1.0" };
  if (intent) payload.intent = intent;
  const t0 = performance.now();
  const res = await request.post(`${BASE}/api/auth/login`, { data: payload });
  const ms = Math.round(performance.now() - t0);
  return { ok: res.ok(), ms, status: res.status() };
}

async function measureApi(request, method, path, data) {
  const t0 = performance.now();
  const res =
    method === "GET"
      ? await request.get(`${BASE}${path}`)
      : await request.post(`${BASE}${path}`, { data, headers: data ? { "Idempotency-Key": `ops-perf-${Date.now()}` } : undefined });
  const ms = Math.round(performance.now() - t0);
  const size = Number(res.headers()["content-length"] ?? 0);
  let bodyLen = 0;
  try {
    const text = await res.text();
    bodyLen = text.length;
  } catch {
    bodyLen = size;
  }
  return { ms, status: res.status(), bytes: bodyLen || size };
}

async function measurePage(page, path) {
  const t0 = performance.now();
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const ms = Math.round(performance.now() - t0);
  return { ms, url: page.url() };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const results = [];

  const browser = await chromium.launch({ headless: true });
  const memberCtx = await browser.newContext({ userAgent: UA });
  const adminCtx = await browser.newContext({ userAgent: UA });
  const memberReq = memberCtx.request;
  const adminReq = adminCtx.request;

  // Member login
  const memberLogin = await login(memberReq, "demouser", "123456");
  results.push({ label: "Member login API", type: "api", ...memberLogin, limit: LIMITS.api, pass: memberLogin.ok && memberLogin.ms <= LIMITS.api });

  // Admin login
  const adminLogin = await login(adminReq, "altorich_ops", "123456", "admin-app");
  results.push({ label: "Admin login API", type: "api", ...adminLogin, limit: LIMITS.api, pass: adminLogin.ok && adminLogin.ms <= LIMITS.api });

  const memberApis = [
    ["GET /api/investments", "GET", "/api/investments"],
    ["GET /api/deposits", "GET", "/api/deposits"],
    ["GET /api/withdrawals", "GET", "/api/withdrawals"],
    ["GET /api/welcome-bonus", "GET", "/api/welcome-bonus"]
  ];

  for (const [label, method, path] of memberApis) {
    const r = await measureApi(memberReq, method, path);
    results.push({ label, type: "api", ms: r.ms, status: r.status, bytes: r.bytes, limit: LIMITS.api, pass: r.status < 500 && r.ms <= LIMITS.api });
  }

  const adminApis = [
    ["GET /api/admin/deposits?status=pending", "GET", "/api/admin/deposits?status=pending"],
    ["GET /api/admin/financial-health", "GET", "/api/admin/financial-health"]
  ];

  for (const [label, method, path] of adminApis) {
    const r = await measureApi(adminReq, method, path);
    results.push({ label, type: "api", ms: r.ms, status: r.status, bytes: r.bytes, limit: LIMITS.api, pass: r.status < 500 && r.ms <= LIMITS.api });
  }

  // Deposit workflow latency (submit only — no DB mutation beyond pending)
  {
    const t0 = performance.now();
    const res = await memberReq.post(`${BASE}/api/deposits`, {
      data: { amount: 30000, paymentReference: `OPS-PERF-${Date.now()}` },
      headers: { "Idempotency-Key": `ops-perf-dep-${Date.now()}` }
    });
    const ms = Math.round(performance.now() - t0);
    results.push({
      label: "POST /api/deposits (submit)",
      type: "workflow",
      ms,
      status: res.status(),
      limit: LIMITS.workflow,
      pass: res.status() < 500 && ms <= LIMITS.workflow
    });
  }

  const memberPage = await memberCtx.newPage();
  const adminPage = await adminCtx.newPage();

  for (const [label, path] of [
    ["Member dashboard page", "/dashboard"],
    ["Member wallet page", "/wallet"],
    ["Admin deposits page", "/admin-app/deposits"]
  ]) {
    const ctx = label.startsWith("Admin") ? adminPage : memberPage;
    const r = await measurePage(ctx, path);
    results.push({ label, type: "page", ms: r.ms, url: r.url, limit: LIMITS.page, pass: r.ms <= LIMITS.page });
  }

  const largest = [...results].filter((r) => r.bytes).sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0)).slice(0, 3);

  await browser.close();

  const report = { base: BASE, measuredAt: new Date().toISOString(), limits: LIMITS, results, largestResponses: largest };
  writeFileSync(resolve(OUT, "perf-report.json"), JSON.stringify(report, null, 2));

  console.log(`Ops Performance Audit (${BASE})\n`);
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} ${r.label} — ${r.ms}ms (limit ${r.limit}ms)${r.bytes ? ` ${r.bytes} bytes` : ""}`);
  }
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} within limits`);
  console.log(`Report: test-results/ops-perf/perf-report.json`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
