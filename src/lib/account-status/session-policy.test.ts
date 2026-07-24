import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canDeposit,
  canLogin,
  canTransact,
  isEligibleForAutomatedFinance,
  mustRevokeSessions,
  normalizeAccountStatus
} from "./policy";

/**
 * Regression checklist for the three-status model.
 * Resume after pause: funds become available under normal ACTIVE rules;
 * engines never back-pay (cron eligibility is ACTIVE-only at processing time).
 */
describe("account status regression matrix", () => {
  it("ACTIVE — full platform access", () => {
    assert.equal(canLogin("active"), true);
    assert.equal(canDeposit("active"), true);
    assert.equal(canTransact("active"), true);
    assert.equal(isEligibleForAutomatedFinance("active"), true);
  });

  it("PAUSED — login, dashboard, deposit; no invest/withdraw/earn/cron", () => {
    assert.equal(canLogin("paused"), true);
    assert.equal(canDeposit("paused"), true);
    assert.equal(canTransact("paused"), false);
    assert.equal(isEligibleForAutomatedFinance("paused"), false);
    assert.equal(mustRevokeSessions("paused"), false);
  });

  it("ACTIVE after resume — normal rules; no retroactive earnings concept in policy", () => {
    // Earnings engines only credit when status is ACTIVE at run time.
    assert.equal(isEligibleForAutomatedFinance("active"), true);
    assert.equal(isEligibleForAutomatedFinance("paused"), false);
  });

  it("BLOCKED — login denied, sessions revoked, no finance, ignored by cron", () => {
    assert.equal(canLogin("blocked"), false);
    assert.equal(canDeposit("blocked"), false);
    assert.equal(canTransact("blocked"), false);
    assert.equal(isEligibleForAutomatedFinance("blocked"), false);
    assert.equal(mustRevokeSessions("blocked"), true);
  });

  it("legacy statuses collapse to blocked", () => {
    for (const legacy of ["suspended", "disabled", "deactivated"]) {
      assert.equal(normalizeAccountStatus(legacy), "blocked");
    }
  });
});
