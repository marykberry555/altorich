#!/usr/bin/env node
/**
 * Ledger integrity verification — reconciles wallet balances against transactions.
 * Usage: npm run verify:ledger
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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const tests = [];

function pass(label, note = "") {
  tests.push({ label, ok: true, note });
}

function fail(label, note) {
  tests.push({ label, ok: false, note });
}

function sumLedger(transactions) {
  return transactions.reduce((total, tx) => {
    if (tx.status !== "completed") return total;
    const amount = Number(tx.amount);
    return tx.type === "credit" ? total + amount : total - amount;
  }, 0);
}

async function main() {
  console.log("AltoRich — Ledger Integrity Verification\n");

  const { data: wallets, error: walletError } = await supabase.from("wallets").select("id, user_id, currency");
  if (walletError) {
    console.error(walletError.message);
    process.exit(1);
  }

  let walletMismatches = 0;
  for (const wallet of wallets ?? []) {
    const { data: rpcBalance, error: rpcError } = await supabase.rpc("wallet_balance", {
      p_wallet_id: wallet.id
    });
    if (rpcError) {
      fail(`wallet_balance RPC (${wallet.currency})`, rpcError.message);
      continue;
    }

    const { data: txs } = await supabase
      .from("wallet_transactions")
      .select("type, amount, status")
      .eq("wallet_id", wallet.id);

    const computed = sumLedger(txs ?? []);
    const rpc = Number(rpcBalance ?? 0);

    if (Math.abs(computed - rpc) > 0.001) {
      walletMismatches += 1;
      fail(
        `Wallet ${wallet.currency} ledger (${wallet.id.slice(0, 8)})`,
        `RPC=${rpc} computed=${computed}`
      );
    }
  }

  if (walletMismatches === 0) {
    pass("All wallet balances reconcile with ledger entries", `${wallets?.length ?? 0} wallets checked`);
  }

  const { data: investments } = await supabase
    .from("investments")
    .select("id, amount, status, wallet_transaction_id, reference")
    .in("status", ["active", "completed", "matured"]);

  let orphanInvestments = 0;
  for (const inv of investments ?? []) {
    if (!inv.wallet_transaction_id) {
      orphanInvestments += 1;
      fail(`Investment ${inv.reference ?? inv.id.slice(0, 8)}`, "Missing wallet_transaction_id");
      continue;
    }

    const { data: tx } = await supabase
      .from("wallet_transactions")
      .select("amount, type, reason, status")
      .eq("id", inv.wallet_transaction_id)
      .maybeSingle();

    if (!tx) {
      orphanInvestments += 1;
      fail(`Investment ${inv.reference ?? inv.id.slice(0, 8)}`, "Linked wallet transaction not found");
    } else if (tx.type !== "debit" || Number(tx.amount) !== Number(inv.amount)) {
      orphanInvestments += 1;
      fail(
        `Investment ${inv.reference ?? inv.id.slice(0, 8)}`,
        `Debit mismatch tx=${tx.amount} inv=${inv.amount}`
      );
    }
  }

  if (orphanInvestments === 0) {
    pass("Active investments link to matching wallet debits", `${investments?.length ?? 0} investments checked`);
  }

  const { data: approvedDeposits } = await supabase
    .from("deposits")
    .select("id, amount, status, wallet_transaction_id")
    .in("status", ["approved", "completed"]);

  let depositIssues = 0;
  for (const dep of approvedDeposits ?? []) {
    if (!dep.wallet_transaction_id) {
      depositIssues += 1;
      fail(`Deposit ${dep.id.slice(0, 8)}`, "Approved without wallet credit");
    }
  }
  if (depositIssues === 0) {
    pass("Approved deposits credited to wallet ledger", `${approvedDeposits?.length ?? 0} deposits checked`);
  }

  const { data: paidWithdrawals } = await supabase
    .from("withdrawals")
    .select("id, amount, status, wallet_transaction_id")
    .in("status", ["paid", "approved"]);

  let withdrawalIssues = 0;
  for (const wd of paidWithdrawals ?? []) {
    if (!wd.wallet_transaction_id) {
      withdrawalIssues += 1;
      fail(`Withdrawal ${wd.id.slice(0, 8)}`, "Paid without wallet debit");
    }
  }
  if (withdrawalIssues === 0) {
    pass("Paid withdrawals debited from wallet ledger", `${paidWithdrawals?.length ?? 0} payouts checked`);
  }

  const { data: referralRewards } = await supabase.from("referral_rewards").select("id, amount, wallet_transaction_id, status");

  let rewardIssues = 0;
  for (const reward of referralRewards ?? []) {
    if (reward.status === "available" && !reward.wallet_transaction_id) {
      rewardIssues += 1;
      fail(`Referral reward ${reward.id.slice(0, 8)}`, "Available reward missing wallet transaction");
    }
  }
  if (rewardIssues === 0) {
    pass("Referral rewards linked to wallet credits", `${referralRewards?.length ?? 0} rewards checked`);
  }

  const { data: duplicateRefs } = await supabase
    .from("wallet_transactions")
    .select("reference")
    .eq("status", "completed");

  const refCounts = new Map();
  for (const row of duplicateRefs ?? []) {
    refCounts.set(row.reference, (refCounts.get(row.reference) ?? 0) + 1);
  }
  const dupes = [...refCounts.entries()].filter(([, count]) => count > 1);
  if (dupes.length === 0) {
    pass("No duplicate wallet transaction references");
  } else {
    fail("Duplicate wallet references", dupes.map(([ref]) => ref).join(", "));
  }

  const passed = tests.filter((t) => t.ok).length;
  const failed = tests.filter((t) => !t.ok).length;

  console.log("");
  for (const t of tests) {
    console.log(`${t.ok ? "✓" : "✗"} ${t.label}${t.note ? ` — ${t.note}` : ""}`);
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
