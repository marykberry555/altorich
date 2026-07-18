/**
 * Financial concurrency CI harness.
 *
 * Default: runs pure invariant suite (always in `npm test`).
 * Optional live mode (requires service role + CRON-like privileges):
 *   FINANCIAL_CONCURRENCY_LIVE=1 npm run test:concurrency
 *
 * Live mode documents the 20× scenarios against claim RPCs when env is present.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const unit = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", "src/lib/finance/concurrency-invariants.test.ts"],
  { cwd: root, encoding: "utf8", env: process.env }
);

process.stdout.write(unit.stdout || "");
process.stderr.write(unit.stderr || "");
assert.equal(unit.status, 0, "concurrency invariant suite must pass");

if (process.env.FINANCIAL_CONCURRENCY_LIVE === "1") {
  console.log(
    "\nFINANCIAL_CONCURRENCY_LIVE=1 set — wire live 20× RPC probes here when a dedicated test project is available."
  );
  console.log("Scenarios to probe live:");
  console.log("  1) 20× claim_deposit_for_approval → exactly one claimed=true");
  console.log("  2) 20× claim_withdrawal_for_paid → one processing claim / one ledger debit");
  console.log("  3) 20× withdrawal create with same idempotency_key → one row");
  console.log("  4) Retry after partial wallet credit → reuse DEP-{id}");
}

console.log("\nConcurrency CI: invariant suite passed (20× simulation).");
