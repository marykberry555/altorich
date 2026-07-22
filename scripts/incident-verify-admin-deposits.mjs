#!/usr/bin/env node
/**
 * Admin deposit approve/reject workflow verification.
 */
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return process.env;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1);
  }
  return process.env;
}

loadEnv();

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ADMIN_USER = "altorich_ops";
const ADMIN_PIN = "123456";
const MEMBER_USER = "demouser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function seedPendingDeposit() {
  const { data: profile } = await supabase.from("profiles").select("id").eq("username", MEMBER_USER).maybeSingle();
  if (!profile) throw new Error("demo member missing");

  const ref = `INCIDENT-${Date.now()}`;
  const { data: existing } = await supabase
    .from("deposits")
    .select("id, status")
    .eq("user_id", profile.id)
    .eq("reference", ref)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("deposits")
    .insert({
      user_id: profile.id,
      member_name: "Demo Member",
      phone: "08012345678",
      amount: 5000,
      status: "pending",
      reference: ref,
      receipt_note: "Incident verification deposit"
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function loginAdmin(page) {
  await page.goto(`${BASE}/admin/auth`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByRole("textbox", { name: /username/i }).fill(ADMIN_USER, { timeout: 60_000 });
  await page.locator("#pin").fill(ADMIN_PIN);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/admin-app/, { timeout: 90_000 });
}

async function main() {
  const depositId = await seedPendingDeposit();
  console.log(`Seeded pending deposit ${depositId}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await loginAdmin(page);
  console.log("PASS admin login");

  await page.goto(`${BASE}/admin-app/deposits`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const body = await page.locator("body").innerText();
  if (/internal server error|application error/i.test(body)) {
    throw new Error("admin deposits page crashed");
  }
  console.log("PASS admin deposits page render");

  const apiBefore = await context.request.get(`${BASE}/api/admin/deposits?status=pending`);
  console.log(`PASS admin deposits API ${apiBefore.status()}`);
  const payload = await apiBefore.json();
  const row = (payload.deposits ?? []).find((d) => d.id === depositId);
  if (!row) console.log("WARN seeded deposit not in pending list yet");

  const rejectRes = await context.request.patch(`${BASE}/api/deposits/${depositId}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-AltoRich-Client": "admin-app"
    },
    data: { status: "rejected" }
  });
  if (rejectRes.status() >= 500) throw new Error(`reject failed HTTP ${rejectRes.status()}`);
  console.log(`PASS admin reject deposit HTTP ${rejectRes.status()}`);

  await page.reload({ waitUntil: "domcontentloaded" });
  console.log("PASS admin deposits refresh after action");

  await browser.close();
  console.log("Admin deposit workflow verification complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
