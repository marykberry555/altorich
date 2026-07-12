import { expect, test } from "@playwright/test";

const chunkFailurePattern = /Loading chunk .* failed|ChunkLoadError|This page couldn't load|Something went wrong/i;

async function assertNoChunkFailure(page: import("@playwright/test").Page) {
  await expect(page.locator("body")).not.toContainText(chunkFailurePattern, { timeout: 5000 });
}

async function collectConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

function assertNoChunkErrors(errors: string[]) {
  expect(errors.join("\n")).not.toMatch(/Loading chunk .* failed|ChunkLoadError/i);
}

const PUBLIC_ROUTES = ["/", "/auth/login", "/download", "/packages", "/contact", "/admin/auth", "/admin/download"];

test.describe("Production smoke — public routes", () => {
  test("homepage loads without chunk failures", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await assertNoChunkFailure(page);
    await expect(page.locator("h1").first()).toBeVisible();
    assertNoChunkErrors(errors);
  });

  test("login page loads and serves referenced chunks", async ({ page, request }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/auth/login", { waitUntil: "networkidle" });
    await assertNoChunkFailure(page);
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome/i })).toBeVisible();

    const html = await page.content();
    const chunk = html.match(/app\/auth\/login\/page-[a-f0-9]+\.js/)?.[0];
    expect(chunk, "login page chunk reference").toBeTruthy();
    const response = await request.get(`/_next/static/chunks/${chunk}`);
    expect(response.status()).toBe(200);
    assertNoChunkErrors(errors);
  });

  test("admin auth is the canonical admin login", async ({ page, request }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/admin/auth", { waitUntil: "networkidle" });
    await assertNoChunkFailure(page);
    await expect(page.getByRole("heading", { name: /alto rich admin/i })).toBeVisible();

    const legacy = await request.get("/admin-app/login", { maxRedirects: 0 });
    expect([307, 308, 302]).toContain(legacy.status());

    assertNoChunkErrors(errors);
  });

  test("admin APK download page shows release metadata", async ({ page, request }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/admin/download", { waitUntil: "networkidle" });
    await assertNoChunkFailure(page);
    await expect(page.getByRole("heading", { name: /alto rich admin/i })).toBeVisible();
    await expect(page.getByText(/latest version/i)).toBeVisible();
    await expect(page.getByText(/build number/i)).toBeVisible();
    await expect(page.getByText(/release date/i)).toBeVisible();

    const meta = await request.get("/downloads/admin-release.json");
    expect(meta.ok()).toBeTruthy();
    const body = (await meta.json()) as { apkBytes: number; packageId: string; versionName: string };
    expect(body.packageId).toBe("com.altorich.admin");
    expect(body.versionName.length).toBeGreaterThan(0);

    if (body.apkBytes > 0) {
      const apk = await request.get("/downloads/altorich-admin-release.apk");
      expect(apk.status()).toBe(200);
      const len = Number(apk.headers()["content-length"] ?? 0);
      expect(len).toBeGreaterThan(100_000);
    }

    assertNoChunkErrors(errors);
  });

  test("digital asset links include admin package fingerprint", async ({ request }) => {
    const res = await request.get("/.well-known/assetlinks.json");
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()) as Array<{
      target?: { package_name?: string; sha256_cert_fingerprints?: string[] };
    }>;
    const admin = data.find((entry) => entry.target?.package_name === "com.altorich.admin");
    expect(admin).toBeTruthy();
    const fp = admin?.target?.sha256_cert_fingerprints?.[0] ?? "";
    expect(fp).toMatch(/^[0-9A-F:]+$/i);
    expect(fp).not.toContain("REPLACE");
  });

  test("build id endpoint matches page meta", async ({ page, request }) => {
    const api = await request.get("/api/build-id", { headers: { "Cache-Control": "no-cache" } });
    expect(api.ok()).toBeTruthy();
    const { buildId } = (await api.json()) as { buildId: string };
    expect(buildId.length).toBeGreaterThan(3);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const meta = await page.locator('meta[name="altorich-build-id"]').getAttribute("content");
    expect(meta).toBe(buildId);
  });

  test("homepage cache headers are not long-lived", async ({ request }) => {
    const response = await request.get("/", { headers: { "Cache-Control": "no-cache" } });
    const cacheControl = response.headers()["cache-control"] ?? "";
    const cdnCacheControl = response.headers()["cdn-cache-control"] ?? "";
    expect(cacheControl).not.toMatch(/s-maxage=31536000/i);
    expect(`${cacheControl} ${cdnCacheControl}`).toMatch(/no-store|no-cache|max-age=0/i);
  });
});

test.describe("Production stress — hard reload", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`five consecutive hard reloads on ${route}`, async ({ page }) => {
      const errors = await collectConsoleErrors(page);

      for (let i = 0; i < 5; i += 1) {
        await page.goto(route, { waitUntil: "networkidle" });
        await page.reload({ waitUntil: "networkidle" });
        await assertNoChunkFailure(page);
      }

      assertNoChunkErrors(errors);
    });
  }
});

test.describe("Production smoke — authenticated member journey", () => {
  const username = process.env.PLAYWRIGHT_MEMBER_USERNAME ?? process.env.PLAYWRIGHT_MEMBER_EMAIL;
  const pin = process.env.PLAYWRIGHT_MEMBER_PIN;

  test.skip(!username || !pin, "Set PLAYWRIGHT_MEMBER_USERNAME and PLAYWRIGHT_MEMBER_PIN for auth flows");

  test("member can login, browse core pages, and logout", async ({ page }) => {
    test.skip(!username || !pin);

    const errors = await collectConsoleErrors(page);
    await page.goto("/auth/login", { waitUntil: "networkidle" });

    await page.getByLabel(/^username$/i).fill(username!);
    await page.getByLabel(/pin/i).fill(pin!);
    await page.getByRole("button", { name: /sign in|log in|continue/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
    await assertNoChunkFailure(page);

    for (const path of ["/wallet", "/investments", "/portfolio", "/deposits", "/vip", "/team", "/notifications", "/settings"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await assertNoChunkFailure(page);
      await expect(page.locator("body")).not.toContainText(/something went wrong/i);
    }

    const logout = page.getByRole("button", { name: /sign out|log out/i });
    if (await logout.count()) {
      await logout.first().click();
      await page.waitForURL(/\/auth\/login|\//, { timeout: 20_000 });
    }

    assertNoChunkErrors(errors);
  });
});

test.describe("Production smoke — admin auth gate", () => {
  test("admin-app redirects anonymous users to install or auth", async ({ request }) => {
    const res = await request.get("/admin-app", { maxRedirects: 0 });
    expect([307, 308, 302]).toContain(res.status());
    const location = res.headers()["location"] ?? "";
    expect(location).toMatch(/admin-app\/install|admin\/auth|auth\/login/);
  });
});
