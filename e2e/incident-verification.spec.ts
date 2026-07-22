import { expect, test, type Page, type BrowserContext } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const MEMBER_USER = process.env.PLAYWRIGHT_MEMBER_USERNAME ?? "demouser";
const MEMBER_PIN = process.env.PLAYWRIGHT_MEMBER_PIN ?? "123456";
const ADMIN_USER = process.env.PLAYWRIGHT_ADMIN_USERNAME ?? "altorich_ops";
const ADMIN_PIN = process.env.PLAYWRIGHT_ADMIN_PIN ?? "123456";

const CHUNK_PATTERN = /Loading chunk .* failed|ChunkLoadError/i;
const CRASH_PATTERN =
  /Something went wrong|Application error|Couldn't load this page|Unexpected error|Internal Server Error/i;

type NavResult = {
  path: string;
  finalUrl: string;
  ok: boolean;
  note: string;
};

async function collectRuntimeIssues(page: Page) {
  const issues: string[] = [];
  page.on("pageerror", (e) => issues.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") issues.push(`console.error: ${msg.text()}`);
  });
  return issues;
}

function filterLegitimateIssues(issues: string[]) {
  return issues.filter((line) => {
    if (/favicon\.ico/i.test(line)) return false;
    if (/Failed to load resource.*404/i.test(line) && /favicon/i.test(line)) return false;
    return true;
  });
}

async function fillPin(page: Page, pin: string) {
  await page.locator("#pin").fill(pin);
}

async function memberLogin(page: Page) {
  await page.goto("/auth/login", { waitUntil: "networkidle" });
  await page.getByLabel(/^username$/i).fill(MEMBER_USER);
  await fillPin(page, MEMBER_PIN);
  await page.getByRole("button", { name: /sign in|log in|continue/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
  await expect(page.locator("body")).not.toContainText(CRASH_PATTERN);
}

async function adminLogin(page: Page) {
  await page.goto("/admin/auth", { waitUntil: "networkidle" });
  await page.getByLabel(/^username$/i).fill(ADMIN_USER);
  await fillPin(page, ADMIN_PIN);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/admin-app/, { timeout: 45_000 });
  await expect(page.locator("body")).not.toContainText(CRASH_PATTERN);
}

async function assertRouteStable(page: Page, path: string): Promise<NavResult> {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const finalUrl = new URL(page.url()).pathname;
  const body = await page.locator("body").innerText();
  const redirectedToDashboard = path !== "/dashboard" && finalUrl === "/dashboard";
  const crashed = CRASH_PATTERN.test(body) || CHUNK_PATTERN.test(body);
  const ok = !redirectedToDashboard && !crashed && finalUrl.startsWith(path.split("?")[0]);
  return {
    path,
    finalUrl,
    ok,
    note: redirectedToDashboard ? "unexpected redirect to /dashboard" : crashed ? "crash copy detected" : "ok"
  };
}

async function clickSidebarIfPresent(page: Page, label: string, expectedPath: string) {
  const nav = page.getByRole("navigation", { name: "Dashboard" });
  const link = nav.getByRole("link", { name: label, exact: true });
  if (!(await link.count())) return { ok: false, note: "link not found" };
  await link.click();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);
  const finalPath = new URL(page.url()).pathname;
  const ok = finalPath.startsWith(expectedPath);
  return { ok, finalPath, note: ok ? "ok" : `landed on ${finalPath}` };
}

test.describe("Incident verification — safeRecoveryHref navigation proof", () => {
  test("member sidebar navigation never traps on dashboard", async ({ page }) => {
    const issues = await collectRuntimeIssues(page);
    await memberLogin(page);

    const sidebarRoutes: Array<[string, string]> = [
      ["Wallet", "/wallet"],
      ["Portfolio", "/portfolio"],
      ["Invest", "/investments"],
      ["Wallet funding", "/deposits"],
      ["Withdrawal", "/withdrawals"],
      ["Profile", "/profile"],
      ["Referrals", "/team"],
      ["VIP", "/vip"],
      ["Activities", "/activities"],
      ["Alerts", "/notifications"],
      ["Settings", "/settings"]
    ];

    for (const [label, expected] of sidebarRoutes) {
      const result = await clickSidebarIfPresent(page, label, expected);
      expect(result.ok, `${expected}: ${result.note}`).toBeTruthy();
    }

    const hardNav = await assertRouteStable(page, "/deposits");
    expect(hardNav.ok, hardNav.note).toBeTruthy();

    await page.goBack({ waitUntil: "networkidle" });
    await page.goForward({ waitUntil: "networkidle" });
    const afterNav = new URL(page.url()).pathname;
    expect(afterNav).not.toBe("/dashboard");

    await page.reload({ waitUntil: "networkidle" });
    expect(new URL(page.url()).pathname).toMatch(/\/deposits|\/withdrawals|\/wallet|\/profile/);

    const filtered = filterLegitimateIssues(issues);
    expect(filtered.join("\n")).not.toMatch(CHUNK_PATTERN);
  });

  test("member direct routes + dashboard CTAs stay on target", async ({ page }) => {
    const issues = await collectRuntimeIssues(page);
    await memberLogin(page);

    const routes = [
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
      "/security",
      "/learn",
      "/contact"
    ];

    const results: NavResult[] = [];
    for (const path of routes) {
      results.push(await assertRouteStable(page, path));
    }

    const failures = results.filter((r) => !r.ok);
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const fundLink = page.getByRole("link", { name: /fund wallet|deposit|wallet funding/i }).first();
    if (await fundLink.count()) {
      await fundLink.click();
      await page.waitForLoadState("networkidle");
      expect(new URL(page.url()).pathname).toMatch(/^\/deposits/);
    }

    const filtered = filterLegitimateIssues(issues);
    expect(filtered.join("\n")).not.toMatch(CHUNK_PATTERN);
  });

  test("multiple tabs do not hijack navigation to dashboard", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await memberLogin(pageA);
    await pageA.goto("/deposits", { waitUntil: "domcontentloaded" });

    await memberLogin(pageB);
    await pageB.goto("/wallet", { waitUntil: "domcontentloaded" });

    expect(new URL(pageA.url()).pathname).toMatch(/^\/deposits/);
    expect(new URL(pageB.url()).pathname).toMatch(/^\/wallet/);

    await pageA.goto("/withdrawals", { waitUntil: "domcontentloaded" });
    expect(new URL(pageA.url()).pathname).toMatch(/^\/withdrawals/);
    expect(new URL(pageB.url()).pathname).toMatch(/^\/wallet/);

    await contextA.close();
    await contextB.close();
  });

  test("new tab opens member route correctly", async ({ context }) => {
    const page = await context.newPage();
    await memberLogin(page);
    const newPage = await context.newPage();
    await newPage.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
    expect(new URL(newPage.url()).pathname).toBe("/profile");
    await expect(newPage.locator("body")).not.toContainText(CRASH_PATTERN);
  });
});

test.describe("Incident verification — admin deposits workflow", () => {
  test("admin can load deposits workspace and API", async ({ page, request }) => {
    const issues = await collectRuntimeIssues(page);
    await adminLogin(page);

    await page.goto("/admin-app/deposits", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /deposit review/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(CRASH_PATTERN);

    const apiRes = await request.get("/api/admin/deposits?status=pending");
    expect(apiRes.status()).toBeLessThan(500);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /deposit review/i })).toBeVisible();

    const filtered = filterLegitimateIssues(issues);
    expect(filtered.join("\n")).not.toMatch(/Internal Server Error/i);
  });
});

test.describe("Incident verification — dashboard stable UI markers", () => {
  test("dashboard renders pre-rebuild sections, not personalized rebuild widgets", async ({ page }) => {
    await memberLogin(page);
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    await expect(page.getByText(/recent activity|account activity/i).first()).toBeVisible();
    await expect(page.getByText(/referrals/i).first()).toBeVisible();

    await expect(page.locator("body")).not.toContainText(/Today.?s summary/i);
    await expect(page.locator("body")).not.toContainText(/Customize your dashboard/i);
    await expect(page.getByText("Quick actions").first()).toHaveCount(0);
  });
});

test.describe("Incident verification — mobile navigation", () => {
  test("mobile bottom nav routes work", async ({ page }) => {
    await memberLogin(page);

    const bottomNav = page.getByRole("navigation", { name: "Mobile dashboard" });
    const mobileTabs: Array<[string, string]> = [
      ["Wallet", "/wallet"],
      ["Invest", "/investments"],
      ["Portfolio", "/portfolio"],
      ["Profile", "/profile"],
      ["Dashboard", "/dashboard"]
    ];

    for (const [label, expected] of mobileTabs) {
      const tab = bottomNav.getByRole("link", { name: label, exact: true });
      await tab.click();
      await page.waitForLoadState("domcontentloaded");
      const path = new URL(page.url()).pathname;
      expect(path.startsWith(expected), `mobile ${expected} got ${path}`).toBeTruthy();
    }
  });
});
