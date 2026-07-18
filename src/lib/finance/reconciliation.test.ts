import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertDepositInvestReconciliation,
  isLegacyCapHealing,
  moneyEqual,
  roundNaira
} from "@/lib/finance/reconciliation";
import { AppError } from "@/lib/errors";

describe("financial reconciliation", () => {
  it("passes when wallet after equals before + deposit - invested", () => {
    assert.doesNotThrow(() =>
      assertDepositInvestReconciliation({
        walletBefore: 50_000,
        depositAmount: 100_000,
        investedAmount: 150_000,
        walletAfter: 0
      })
    );
  });

  it("passes for deposit-only (no invest) when wallet holds the deposit", () => {
    assert.doesNotThrow(() =>
      assertDepositInvestReconciliation({
        walletBefore: 0,
        depositAmount: 20_000,
        investedAmount: 0,
        walletAfter: 20_000
      })
    );
  });

  it("fails when off by ₦0.01", () => {
    assert.throws(
      () =>
        assertDepositInvestReconciliation({
          walletBefore: 0,
          depositAmount: 100_000,
          investedAmount: 100_000,
          walletAfter: 0.01
        }),
      (err: unknown) => err instanceof AppError && err.code === "LEDGER_RECONCILIATION_FAILED"
    );
  });

  it("detects legacy cap healing when leftover + deposit are invested", () => {
    assert.equal(isLegacyCapHealing(80_000, 100_000, 180_000), true);
    assert.equal(isLegacyCapHealing(0, 100_000, 100_000), false);
  });

  it("rounds naira consistently", () => {
    assert.equal(roundNaira(10.004), 10);
    assert.equal(roundNaira(10.005), 10.01);
    assert.equal(moneyEqual(10, 10), true);
    assert.equal(moneyEqual(10, 10.01), false);
  });
});
