#!/usr/bin/env node
/**
 * Database verification script — run after applying Supabase migrations.
 * Usage: npm run verify:db
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
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const EXPECTED_TABLES = [
  "profiles",
  "admin_roles",
  "settings",
  "vip_levels",
  "wallets",
  "wallet_transactions",
  "investment_plans",
  "investments",
  "investment_settlements",
  "deposits",
  "bank_accounts",
  "withdrawals",
  "referrals",
  "referral_rewards",
  "referral_payouts",
  "notifications",
  "audit_logs",
  "activity_logs",
  "kyc_documents"
];

const report = {
  timestamp: new Date().toISOString(),
  tables: {},
  functions: {},
  rls: {},
  storage: {},
  errors: []
};

async function checkTable(name) {
  const { count, error } = await supabase.from(name).select("*", { count: "exact", head: true });
  report.tables[name] = error ? { ok: false, error: error.message } : { ok: true, rowCount: count ?? 0 };
}

async function checkFunction(name) {
  const { data, error } = await supabase.rpc(name, name === "wallet_balance" ? { p_wallet_id: "00000000-0000-0000-0000-000000000000" } : {});
  report.functions[name] = error ? { ok: false, error: error.message } : { ok: true, sample: data };
}

async function checkStorage() {
  const buckets = ["avatars", "deposit-proofs", "kyc-documents"];
  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.from(bucket).list("", { limit: 1 });
    report.storage[bucket] = error ? { ok: false, error: error.message } : { ok: true, accessible: true, sample: data?.length ?? 0 };
  }
}

async function main() {
  console.log("AltoRich — Database Verification\n");

  for (const table of EXPECTED_TABLES) {
    await checkTable(table);
  }

  await checkFunction("wallet_balance");
  await checkFunction("has_admin_role");
  await checkStorage();

  let pass = 0;
  let fail = 0;

  for (const [table, result] of Object.entries(report.tables)) {
    if (result.ok) {
      console.log(`✓ Table ${table} (${result.rowCount} rows)`);
      pass++;
    } else {
      console.log(`✗ Table ${table}: ${result.error}`);
      fail++;
    }
  }

  for (const [fn, result] of Object.entries(report.functions)) {
    if (result.ok) {
      console.log(`✓ Function ${fn}`);
      pass++;
    } else {
      console.log(`✗ Function ${fn}: ${result.error}`);
      fail++;
    }
  }

  for (const [bucket, result] of Object.entries(report.storage)) {
    if (result.ok) {
      console.log(`✓ Storage bucket ${bucket}`);
      pass++;
    } else {
      console.log(`✗ Storage bucket ${bucket}: ${result.error}`);
      fail++;
    }
  }

  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
