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

test.describe("Production smoke — public routes", () => {
  test("homepage loads without chunk failures", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await assertNoChunkFailure(page);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(errors.join("\n")).not.toMatch(/Loading chunk .* failed|ChunkLoadError/i);
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
    expect(errors.join("\n")).not.toMatch(/Loading chunk .* failed|ChunkLoadError/i);
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

test.describe("Production smoke — authenticated routes", () => {
  const email = process.env.PLAYWRIGHT_MEMBER_EMAIL;
  const pin = process.env.PLAYWRIGHT_MEMBER_PIN;

  test.skip(!email || !pin, "Set PLAYWRIGHT_MEMBER_EMAIL and PLAYWRIGHT_MEMBER_PIN for auth flows");

  test("member can login, browse core pages, and logout", async ({ page }) => {
    test.skip(!email || !pin);

    const errors = await collectConsoleErrors(page);
    await page.goto("/auth/login", { waitUntil: "networkidle" });

    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/pin|password/i).fill(pin!);
    await page.getByRole("button", { name: /sign in|log in|continue/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await assertNoChunkFailure(page);

    for (const path of ["/wallet", "/investments", "/portfolio"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await assertNoChunkFailure(page);
    }

    await page.getByRole("button", { name: /sign out|log out/i }).click();
    await page.waitForURL(/\/auth\/login|\//, { timeout: 20_000 });

    expect(errors.join("\n")).not.toMatch(/Loading chunk .* failed|ChunkLoadError/i);
  });
});
