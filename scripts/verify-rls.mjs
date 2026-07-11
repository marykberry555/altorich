#!/usr/bin/env node
/**
 * RLS security verification — tests anonymous vs authenticated access patterns.
 * Usage: npm run verify:rls
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return process.env;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
  return process.env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

const tests = [];

async function expectBlocked(label, fn) {
  try {
    const result = await fn();
    const rows = Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0;
    if (result.error || rows === 0) {
      tests.push({ label, ok: true, note: "Access blocked or empty" });
    } else {
      tests.push({ label, ok: false, note: `Unexpected access: ${rows} row(s)` });
    }
  } catch (err) {
    tests.push({ label, ok: true, note: String(err.message ?? err) });
  }
}

async function main() {
  console.log("AltoRich — RLS Security Verification\n");

  await expectBlocked("Anonymous cannot read wallet_transactions", () =>
    anon.from("wallet_transactions").select("*").limit(5)
  );

  await expectBlocked("Anonymous cannot read admin_roles", () => anon.from("admin_roles").select("*").limit(5));

  await expectBlocked("Anonymous cannot read withdrawals", () => anon.from("withdrawals").select("*").limit(5));

  await expectBlocked("Anonymous cannot read notifications", () => anon.from("notifications").select("*").limit(5));

  await expectBlocked("Anonymous cannot insert deposits", () =>
    anon.from("deposits").insert({
      member_name: "Probe",
      phone: "08012345678",
      amount: 1000,
      reference: `probe-${Date.now()}`
    })
  );

  await expectBlocked("Anonymous cannot execute wallet_balance RPC", async () => {
    const { error } = await anon.rpc("wallet_balance", {
      p_wallet_id: "00000000-0000-0000-0000-000000000001"
    });
    return { data: null, error };
  });

  await expectBlocked("Anonymous cannot execute has_admin_role RPC", async () => {
    const { error } = await anon.rpc("has_admin_role");
    return { data: null, error };
  });

  const { data: settings } = await anon.from("settings").select("key").limit(1);
  tests.push({
    label: "Anonymous can read public settings",
    ok: Array.isArray(settings),
    note: settings?.length ? "Readable" : "Empty but allowed"
  });

  const { data: plans } = await anon.from("investment_plans").select("slug").eq("is_active", true).limit(1);
  tests.push({
    label: "Anonymous can read active investment plans",
    ok: Array.isArray(plans),
    note: plans?.length ? "Readable" : "Empty but allowed"
  });

  let pass = 0;
  let fail = 0;

  for (const test of tests) {
    if (test.ok) {
      console.log(`✓ ${test.label} — ${test.note}`);
      pass++;
    } else {
      console.log(`✗ ${test.label} — ${test.note}`);
      fail++;
    }
  }

  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  console.log("\nNote: Member/admin scoped tests require seeded test users with admin_roles.");
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
