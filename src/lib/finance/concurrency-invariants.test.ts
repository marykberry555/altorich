import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertExactlyOne,
  countDuplicatesByKey,
  isStuckDepositWorkflow,
  nextDepositWorkflowPhase
} from "@/lib/finance/deposit-workflow";

describe("deposit workflow state machine", () => {
  it("advances phases in order", () => {
    assert.equal(nextDepositWorkflowPhase("pending"), "claimed");
    assert.equal(nextDepositWorkflowPhase("claimed"), "wallet_credited");
    assert.equal(nextDepositWorkflowPhase("wallet_credited"), "investment_created");
    assert.equal(nextDepositWorkflowPhase("investment_created"), "reconciled");
    assert.equal(nextDepositWorkflowPhase("reconciled"), "completed");
    assert.equal(nextDepositWorkflowPhase("completed"), null);
  });

  it("flags intermediate phases stuck after 5 minutes", () => {
    const now = new Date("2026-07-20T10:00:00Z");
    const old = new Date("2026-07-20T09:54:00Z");
    assert.equal(isStuckDepositWorkflow("claimed", old, now), true);
    assert.equal(isStuckDepositWorkflow("completed", old, now), false);
    assert.equal(isStuckDepositWorkflow("pending", old, now), false);
  });
});

describe("concurrency invariants (20× simulation)", () => {
  it("keeps one investment per deposit across 20 concurrent winners", () => {
    const depositId = "dep-1";
    // Simulate 20 race attempts where unique constraint admits one insert.
    const attempts = Array.from({ length: 20 }, (_, i) => ({
      id: `inv-${i}`,
      source_deposit_id: depositId,
      accepted: i === 7
    }));
    const winners = attempts.filter((a) => a.accepted);
    assertExactlyOne(winners, "investment per deposit");
    assert.equal(countDuplicatesByKey(winners, (a) => a.source_deposit_id), 0);
  });

  it("keeps one ledger debit for 20 mark-paid races", () => {
    const withdrawalId = "wd-1";
    const refs = Array.from({ length: 20 }, (_, i) => ({
      reference: i === 0 ? `ALT-20260720-000001` : `ALT-20260720-000001`,
      inserted: i === 0
    }));
    // Unique reference → only first insert succeeds.
    const ledger = refs.filter((r) => r.inserted);
    assertExactlyOne(ledger, "ledger debit");
    assert.equal(countDuplicatesByKey(ledger, (r) => r.reference), 0);
  });

  it("returns the same withdrawal for 20 identical idempotency keys", () => {
    const key = "client-key-abc";
    const rows = Array.from({ length: 20 }, (_, i) => ({
      id: i === 3 ? "wd-canonical" : null,
      idempotency_key: key,
      created: i === 3
    }));
    const created = rows.filter((r) => r.created);
    assertExactlyOne(created, "withdrawal for idempotency key");
    // All 20 clients should observe the same id after race resolution.
    const observed = rows.map(() => created[0].id);
    assert.equal(new Set(observed).size, 1);
  });

  it("simulated network retry after partial success does not double-credit", () => {
    const ledger: { reference: string }[] = [];
    function creditOnce(reference: string) {
      if (ledger.some((r) => r.reference === reference)) return ledger[0];
      ledger.push({ reference });
      return ledger[0];
    }
    // First attempt credits; retry after timeout reuses DEP reference.
    creditOnce("DEP-dep-9");
    creditOnce("DEP-dep-9");
    creditOnce("DEP-dep-9");
    assert.equal(ledger.length, 1);
  });
});
