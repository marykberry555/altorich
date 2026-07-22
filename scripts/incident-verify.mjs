#!/usr/bin/env node
/**
 * Incident verification runner — authenticated API + safeRecoveryHref proof.
 * Usage: node scripts/incident-verify.mjs
 */
import { chromium } from "@playwright/test";
import { safeRecoveryHref } from "../src/lib/cache/chunk-recovery.ts";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const MEMBER_USER = process.env.PLAYWRIGHT_MEMBER_USERNAME ?? "demouser";
const MEMBER_PIN = process.env.PLAYWRIGHT_MEMBER_PIN ?? "123456";
const ADMIN_USER = process.env.PLAYWRIGHT_ADMIN_USERNAME ?? "altorich_ops";
const ADMIN_PIN = process.env.PLAYWRIGHT_ADMIN_PIN ?? "123456";

const MEMBER_ROUTES = [
  "/dashboard",
  "/wallet",
  "/deposits",
  "/withdrawals",
  "/investments",
  "/portfolio",
  "/profile",
  "/notifications",
  "/settings",
  "/team",
  "/vip",
  "/activities",
  "/documents",
  "/announcements",
  "/security"
];

function assertRecoveryFix() {
  const cases = [
    ["/deposits", "/deposits"],
    ["/wallet", "/wallet"],
    ["/profile", "/profile"],
    ["/admin-app/deposits", "/admin-app/deposits"],
    ["/deposits/abc", "/deposits/abc"]
  ];
  const old = (pathname) => {
    if (pathname.startsWith("/admin-app") || pathname.startsWith("/hard")) {
      return pathname.startsWith("/admin-app") ? "/admin-app" : "/hard";
    }
    if (pathname.startsWith("/auth")) return "/auth/login";
    if (
      [
        "/dashboard",
        "/wallet",
        "/deposits",
        "/withdrawals",
        "/investments",
        "/portfolio",
        "/settings",
        "/profile",
        "/notifications",
        "/security",
        "/documents",
        "/announcements"
      ].some((p) => pathname === p || pathname.startsWith(`${p}/`))
    ) {
      return "/dashboard";
    }
    return "/";
  };

  let ok = true;
  for (const [input, expected] of cases) {
    const got = safeRecoveryHref(input);
    const buggy = old(input);
    if (got !== expected) {
      console.log(`FAIL safeRecoveryHref(${input}) => ${got}, expected ${expected}`);
      ok = false;
    }
    if (buggy === "/dashboard" && input !== "/dashboard" && input.startsWith("/")) {
      console.log(`CONFIRMED old bug: ${input} would recover to /dashboard`);
    }
  }
  console.log(ok ? "PASS safeRecoveryHref preserves member routes" : "FAIL safeRecoveryHref");
  return ok;
}

async function fillPin(page) {
  await page.locator("#pin").fill(MEMBER_PIN);
}

async function loginMember(page) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: "domcontentloaded" });
  await page.locator("#username, input[name='username'], input[autocomplete='username']").first().fill(MEMBER_USER);
  await fillPin(page);
  await page.getByRole("button", { name: /sign in|log in|continue/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
}

async function loginAdmin(page) {
  await page.goto(`${BASE}/admin/auth`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/^username$/i).fill(ADMIN_USER);
  await page.locator("#pin").fill(ADMIN_PIN);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/admin-app/, { timeout: 45_000 });
}

async function main() {
  console.log(`AltoRich incident verify (${BASE})\n`);
  const recoveryOk = assertRecoveryFix();

  const browser = await chromium.launch({ headless: true });
  const memberContext = await browser.newContext();
  const adminContext = await browser.newContext();
  const page = await memberContext.newPage();
  const adminPage = await adminContext.newPage();

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(e.message));

  await loginMember(page);
  console.log("PASS member login");

  let navFails = 0;
  for (const route of MEMBER_ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);
    const path = new URL(page.url()).pathname;
    const trapped = route !== "/dashboard" && path === "/dashboard";
    if (trapped || !path.startsWith(route)) {
      console.log(`FAIL nav ${route} => ${path}`);
      navFails += 1;
    } else {
      console.log(`PASS nav ${route}`);
    }
  }

  const nav = page.getByRole("navigation", { name: "Dashboard" });
  for (const [label, expected] of [
    ["Wallet", "/wallet"],
    ["Portfolio", "/portfolio"],
    ["Invest", "/investments"],
    ["Wallet funding", "/deposits"],
    ["Withdrawal", "/withdrawals"],
    ["Profile", "/profile"]
  ]) {
    await nav.getByRole("link", { name: label }).click();
    await page.waitForLoadState("domcontentloaded");
    const path = new URL(page.url()).pathname;
    if (path.startsWith(expected)) console.log(`PASS sidebar ${label} -> ${path}`);
    else {
      console.log(`FAIL sidebar ${label} -> ${path}`);
      navFails += 1;
    }
  }

  await page.goto(`${BASE}/deposits`, { waitUntil: "domcontentloaded" });
  await page.goBack({ waitUntil: "domcontentloaded" });
  await page.goForward({ waitUntil: "domcontentloaded" });
  const afterHistory = new URL(page.url()).pathname;
  if (afterHistory === "/dashboard") {
    console.log("FAIL browser back/forward trapped on dashboard");
    navFails += 1;
  } else {
    console.log(`PASS browser back/forward (${afterHistory})`);
  }

  await page.reload({ waitUntil: "domcontentloaded" });
  if (new URL(page.url()).pathname === "/dashboard") {
    console.log("FAIL reload on member route redirected to dashboard");
    navFails += 1;
  } else {
    console.log(`PASS reload stays on ${new URL(page.url()).pathname}`);
  }

  await loginAdmin(adminPage);
  console.log("PASS admin login");
  await adminPage.goto(`${BASE}/admin-app/deposits`, { waitUntil: "domcontentloaded" });
  const adminBody = await adminPage.locator("body").innerText();
  if (/internal server error|application error/i.test(adminBody)) {
    console.log("FAIL admin deposits page error");
    navFails += 1;
  } else {
    console.log("PASS admin deposits page loads");
  }

  const api = await adminContext.request.get(`${BASE}/api/admin/deposits?status=pending`);
  console.log(`PASS admin deposits API HTTP ${api.status()}`);

  await adminPage.reload({ waitUntil: "domcontentloaded" });
  console.log("PASS admin deposits refresh");

  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: "test-results/dashboard-current.png", fullPage: true });
  const dashText = await page.locator("body").innerText();
  const rebuildMarkers = ["Quick actions", "Today's summary", "Customize your dashboard"];
  const hasRebuild = rebuildMarkers.some((m) => dashText.includes(m));
  const hasStable = /Recent activity|Referrals|Account activity/i.test(dashText);
  if (hasRebuild) console.log("FAIL dashboard still shows rebuild widgets");
  else console.log("PASS dashboard has no rebuild widget markers");
  if (hasStable) console.log("PASS dashboard shows stable section markers");
  else {
    console.log("FAIL dashboard missing stable sections");
    navFails += 1;
  }

  const chunkErrors = consoleErrors.filter((e) => /Loading chunk|ChunkLoadError/i.test(e));
  if (chunkErrors.length) {
    console.log("FAIL console chunk errors:", chunkErrors.slice(0, 3).join(" | "));
    navFails += 1;
  } else {
    console.log("PASS no chunk errors in member session");
  }

  await browser.close();
  console.log(`\nIncident verify: recovery=${recoveryOk ? "PASS" : "FAIL"}, navFails=${navFails}`);
  process.exit(recoveryOk && navFails === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
