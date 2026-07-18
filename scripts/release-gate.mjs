#!/usr/bin/env node
/**
 * Release Candidate gate — fails deploy if critical routes error or throw.
 *
 * Checks:
 * - Health + BUILD_ID
 * - Marketing/auth pages return 200 and do not render error-boundary copy
 * - Protected member/admin routes redirect to auth (not 500)
 * - Key APIs respond with expected auth/status codes
 *
 * Usage:
 *   node scripts/release-gate.mjs
 *   RELEASE_GATE_BASE_URL=https://altorich.com node scripts/release-gate.mjs
 */

const BASE = (process.env.RELEASE_GATE_BASE_URL ?? process.env.SMOKE_BASE_URL ?? "https://altorich.com").replace(
  /\/$/,
  ""
);

const ERROR_MARKERS = [
  "Couldn't load this page",
  "Unexpected error",
  "Connection problem",
  "Something went wrong",
  "Application error: a client-side exception"
];

const results = [];

async function check(label, fn) {
  try {
    const result = await fn();
    results.push({ label, ok: Boolean(result.ok), note: result.note ?? "" });
  } catch (err) {
    results.push({ label, ok: false, note: err instanceof Error ? err.message : String(err) });
  }
}

async function fetchText(path, init) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: {
      "Cache-Control": "no-cache",
      "User-Agent": "AltoRich-ReleaseGate/1.0"
    },
    ...init
  });
  const text = res.status >= 200 && res.status < 400 ? await res.text().catch(() => "") : "";
  return { res, text, status: res.status, location: res.headers.get("location") ?? "" };
}

function htmlLooksHealthy(html) {
  if (!html || html.length < 40) return false;
  const lower = html.toLowerCase();
  for (const marker of ERROR_MARKERS) {
    if (html.includes(marker)) return false;
  }
  // Next.js fatal document
  if (lower.includes("application error:") && lower.includes("client-side exception")) return false;
  return true;
}

async function main() {
  console.log(`AltoRich — Release Gate (${BASE})\n`);

  await check("Health OK", async () => {
    const res = await fetch(`${BASE}/api/health`, {
      headers: { "User-Agent": "AltoRich-ReleaseGate/1.0" }
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.status === 200 && body.status === "ok", note: `HTTP ${res.status}` };
  });

  await check("BUILD_ID present", async () => {
    const res = await fetch(`${BASE}/api/build-id`, {
      headers: { "User-Agent": "AltoRich-ReleaseGate/1.0", "Cache-Control": "no-cache" }
    });
    const body = await res.json().catch(() => ({}));
    const id = typeof body.buildId === "string" ? body.buildId : "";
    return { ok: res.status === 200 && id.length > 4, note: id || `HTTP ${res.status}` };
  });

  const publicPages = [
    ["/", "Homepage"],
    ["/auth/login", "Login"],
    ["/auth/register", "Register"],
    ["/packages", "Packages"],
    ["/download", "Download"],
    ["/admin/auth", "Admin auth"],
    ["/admin-app/install", "Admin install"]
  ];

  for (const [path, label] of publicPages) {
    await check(`${label} healthy (${path})`, async () => {
      const { status, text } = await fetchText(path, { redirect: "follow" });
      const ok = status === 200 && htmlLooksHealthy(text);
      const marker = ERROR_MARKERS.find((m) => text.includes(m));
      return {
        ok,
        note: ok ? `HTTP ${status}` : `HTTP ${status}${marker ? ` · marker: ${marker}` : " · empty/invalid HTML"}`
      };
    });
  }

  const protectedRedirects = [
    ["/dashboard", "/auth/login"],
    ["/deposits", "/auth/login"],
    ["/withdrawals", "/auth/login"],
    ["/wallet", "/auth/login"],
    ["/admin-app", "/admin"],
    ["/hard", "/auth/login"]
  ];

  for (const [path, expected] of protectedRedirects) {
    await check(`${path} requires auth`, async () => {
      const { status, location } = await fetchText(path);
      // Accept auth login, admin auth, or admin install (TWA onboarding) — never 5xx/HTML crash.
      const redirected =
        status >= 300 &&
        status < 400 &&
        (location.includes(expected) ||
          location.includes("/admin/auth") ||
          location.includes("/admin-app/install") ||
          location.includes("/auth/login"));
      const notServerError = status !== 500 && status !== 502 && status !== 503;
      return {
        ok: redirected && notServerError,
        note: `${status} → ${location || "(none)"}`
      };
    });
  }

  await check("Protected API rejects anonymous", async () => {
    const res = await fetch(`${BASE}/api/investments`, {
      headers: { "User-Agent": "AltoRich-ReleaseGate/1.0" }
    });
    return { ok: res.status === 401 || res.status === 403, note: `HTTP ${res.status}` };
  });

  await check("Admin API rejects anonymous", async () => {
    const res = await fetch(`${BASE}/api/admin/metrics`, {
      headers: { "User-Agent": "AltoRich-ReleaseGate/1.0" }
    });
    return { ok: res.status === 401 || res.status === 403, note: `HTTP ${res.status}` };
  });

  await check("Login chunk resolves", async () => {
    const { status, text } = await fetchText("/auth/login", { redirect: "follow" });
    if (status !== 200) return { ok: false, note: `login HTTP ${status}` };
    const match = text.match(/app\/auth\/login\/page-[a-f0-9]+\.js/);
    if (!match) return { ok: false, note: "chunk ref missing" };
    const chunk = await fetch(`${BASE}/_next/static/chunks/${match[0]}`, {
      headers: { "User-Agent": "AltoRich-ReleaseGate/1.0" }
    });
    return { ok: chunk.status === 200, note: `${match[0]} → HTTP ${chunk.status}` };
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log("");
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.note ? ` — ${r.note}` : ""}`);
  }
  console.log(`\nRelease gate: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error("\nRELEASE GATE FAILED — do not mark this build ready.");
    process.exit(1);
  }

  console.log("\nRELEASE GATE PASSED");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
