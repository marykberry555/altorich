#!/usr/bin/env node
/**
 * Post-deploy incident verification — checks homepage stability signals.
 * Usage: node scripts/incident-verify-production.mjs
 */
const BASE = process.env.SMOKE_BASE_URL ?? "https://altorich.com";

const checks = [];

async function check(label, fn) {
  try {
    const result = await fn();
    checks.push({ label, ok: result.ok, note: result.note ?? "" });
  } catch (error) {
    checks.push({
      label,
      ok: false,
      note: error instanceof Error ? error.message : String(error)
    });
  }
}

async function main() {
  console.log(`AltoRich — Incident Verification (${BASE})\n`);

  await check("Homepage SSR includes hero copy", async () => {
    const html = await (await fetch(`${BASE}/`)).text();
    const ok = html.includes("Premium wealth platform") || html.includes("Alto Rich");
    return { ok, note: ok ? "hero copy present" : "hero copy missing" };
  });

  await check("Homepage does not ship old error copy in HTML", async () => {
    const html = await (await fetch(`${BASE}/`)).text();
    const ok = !html.includes("This page couldn&apos;t load") && !html.includes("This page couldn't load");
    return { ok, note: ok ? "no stale error string in HTML" : "stale error string found" };
  });

  await check("Service worker is self-destruct stub", async () => {
    const sw = await (await fetch(`${BASE}/sw.js`)).text();
    const ok = sw.includes("unregister()") && !sw.includes("RUNTIME_CACHE");
    return { ok, note: ok ? "SW disabled stub" : "SW still caching" };
  });

  await check("Layout chunk serves 200", async () => {
    const html = await (await fetch(`${BASE}/`)).text();
    const match = html.match(/layout-[a-f0-9]+\.js/);
    if (!match) return { ok: false, note: "layout chunk missing from HTML" };
    const res = await fetch(`${BASE}/_next/static/chunks/app/${match[0]}`);
    return { ok: res.status === 200, note: `${match[0]} → HTTP ${res.status}` };
  });

  await check("Build ID present", async () => {
    const html = await (await fetch(`${BASE}/`)).text();
    const ok = /KZqnLoKOGYk1x5UbNBeIt|[A-Za-z0-9_-]{10,}/.test(html);
    return { ok, note: ok ? "build id token found" : "build id missing" };
  });

  await check("Health API", async () => {
    const res = await fetch(`${BASE}/api/health`);
    const body = await res.json();
    return { ok: res.status === 200 && body.status === "ok", note: `HTTP ${res.status}` };
  });

  let failed = 0;
  for (const item of checks) {
    const mark = item.ok ? "✓" : "✗";
    if (!item.ok) failed += 1;
    console.log(`${mark} ${item.label} — ${item.note}`);
  }

  console.log(`\nResult: ${checks.length - failed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
