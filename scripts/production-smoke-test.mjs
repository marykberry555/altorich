#!/usr/bin/env node
/**
 * Production smoke test — validates public routes, redirects, health, and security headers.
 * Usage: npm run smoke:production
 */

const BASE = process.env.SMOKE_BASE_URL ?? "https://altorich.com";

const tests = [];

async function check(label, fn) {
  try {
    const result = await fn();
    tests.push({ label, ok: result.ok, note: result.note ?? "" });
  } catch (err) {
    tests.push({ label, ok: false, note: err instanceof Error ? err.message : String(err) });
  }
}

async function fetchStatus(url, init) {
  const res = await fetch(url, { redirect: "manual", ...init });
  return { status: res.status, location: res.headers.get("location") ?? "" };
}

async function main() {
  console.log(`AltoRich — Production Smoke Test (${BASE})\n`);

  await check("Homepage headline shows 10–25% weekly", async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    const ok = html.includes("10% to 25% weekly") || html.includes("10% to 25%");
    return { ok, note: ok ? "headline present" : "headline missing" };
  });

  await check("Homepage mentions guaranteed returns", async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    const ok = /Returns are guaranteed/i.test(html) || /guaranteed weekly returns/i.test(html);
    return { ok, note: ok ? "guarantee copy present" : "guarantee copy missing" };
  });

  await check("Homepage returns 200", async () => {
    const { status } = await fetchStatus(`${BASE}/`);
    return { ok: status === 200, note: `HTTP ${status}` };
  });

  await check("Health API returns 200", async () => {
    const res = await fetch(`${BASE}/api/health`);
    const body = await res.json();
    return { ok: res.status === 200 && body.status === "ok", note: `HTTP ${res.status}` };
  });

  await check("Health env reports ready", async () => {
    const res = await fetch(`${BASE}/api/health/env`);
    const body = await res.json();
    return {
      ok: res.status === 200 && body.ready === true,
      note: body.ready ? "ready" : JSON.stringify(body.env)
    };
  });

  await check("Health ready reports database", async () => {
    const res = await fetch(`${BASE}/api/health/ready`);
    const body = await res.json();
    return {
      ok: res.status === 200 && body.checks?.database === true,
      note: body.status
    };
  });

  await check("/investments redirects to login (not portfolio)", async () => {
    const { status, location } = await fetchStatus(`${BASE}/investments`);
    const ok = status === 307 && location.includes("/auth/login") && !location.includes("/portfolio");
    return { ok, note: `${status} → ${location}` };
  });

  await check("/invest aliases to /investments", async () => {
    const { status, location } = await fetchStatus(`${BASE}/invest`);
    return { ok: status === 308 && location.endsWith("/investments"), note: `${status} → ${location}` };
  });

  await check("/referrals aliases to /team", async () => {
    const { status, location } = await fetchStatus(`${BASE}/referrals`);
    return { ok: status === 308 && location.endsWith("/team"), note: `${status} → ${location}` };
  });

  await check("/funding aliases to /deposits", async () => {
    const { status, location } = await fetchStatus(`${BASE}/funding`);
    return { ok: status === 308 && location.endsWith("/deposits"), note: `${status} → ${location}` };
  });

  await check("Login page returns 200", async () => {
    const { status } = await fetchStatus(`${BASE}/auth/login`);
    return { ok: status === 200, note: `HTTP ${status}` };
  });

  await check("Download page returns 200", async () => {
    const { status } = await fetchStatus(`${BASE}/download`);
    return { ok: status === 200, note: `HTTP ${status}` };
  });

  await check("Login page chunk serves 200", async () => {
    const res = await fetch(`${BASE}/auth/login`, { headers: { "Cache-Control": "no-cache" } });
    const html = await res.text();
    const match = html.match(/app\/auth\/login\/page-[a-f0-9]+\.js/);
    if (!match) return { ok: false, note: "chunk ref missing" };
    const chunkStatus = (await fetchStatus(`${BASE}/_next/static/chunks/${match[0]}`)).status;
    return { ok: chunkStatus === 200, note: `${match[0]} → HTTP ${chunkStatus}` };
  });

  await check("Packages page returns 200", async () => {
    const { status } = await fetchStatus(`${BASE}/packages`);
    return { ok: status === 200, note: `HTTP ${status}` };
  });

  await check("Hard ops requires auth (redirect)", async () => {
    const { status, location } = await fetchStatus(`${BASE}/hard`);
    return {
      ok: status >= 300 && status < 400 && location.includes("/auth/login"),
      note: `${status} → ${location}`
    };
  });

  await check("Legacy /admin redirects to /hard", async () => {
    const { status, location } = await fetchStatus(`${BASE}/admin`);
    return {
      ok: status >= 300 && status < 400 && location.includes("/hard"),
      note: `${status} → ${location}`
    };
  });

  await check("Dashboard requires auth", async () => {
    const { status, location } = await fetchStatus(`${BASE}/dashboard`);
    return { ok: status === 307 && location.includes("/auth/login"), note: `${status} → ${location}` };
  });

  await check("Service role key not in public HTML", async () => {
    const res = await fetch(`${BASE}/auth/login`);
    const html = await res.text();
    const ok = !html.includes("SUPABASE_SERVICE_ROLE_KEY") && !html.includes("service_role");
    return { ok, note: ok ? "not exposed" : "possible leak" };
  });

  await check("Smartsupp configured in env probe", async () => {
    const res = await fetch(`${BASE}/api/health/env`);
    const body = await res.json();
    return {
      ok: body.env?.NEXT_PUBLIC_SMARTSUPP_KEY === true,
      note: body.env?.NEXT_PUBLIC_SMARTSUPP_KEY ? "enabled" : "missing"
    };
  });

  await check("Security headers present", async () => {
    const res = await fetch(`${BASE}/`, { redirect: "follow" });
    const hsts = res.headers.get("strict-transport-security");
    const xcto = res.headers.get("x-content-type-options");
    return {
      ok: Boolean(hsts && xcto),
      note: `HSTS=${Boolean(hsts)} XCTO=${Boolean(xcto)}`
    };
  });

  await check("Protected API returns 401 without session", async () => {
    const res = await fetch(`${BASE}/api/investments`);
    return { ok: res.status === 401, note: `HTTP ${res.status}` };
  });

  await check("Admin metrics API returns 401/403 without session", async () => {
    const res = await fetch(`${BASE}/api/admin/metrics`);
    return { ok: res.status === 401 || res.status === 403, note: `HTTP ${res.status}` };
  });

  const passed = tests.filter((t) => t.ok).length;
  const failed = tests.filter((t) => !t.ok).length;

  console.log("");
  for (const t of tests) {
    console.log(`${t.ok ? "✓" : "✗"} ${t.label}${t.note ? ` — ${t.note}` : ""}`);
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
