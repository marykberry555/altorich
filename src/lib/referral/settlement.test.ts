import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateReferralPayoutEligibility } from "@/lib/referral/settlement";

/** WAT = UTC+1 — construct UTC instants that map to known Lagos wall times. */
function wat(y: number, m: number, d: number, h: number, min = 0) {
  return new Date(Date.UTC(y, m - 1, d, h - 1, min, 0));
}

describe("referral settlement eligibility", () => {
  it("disables withdrawal on Saturday even when threshold is met", () => {
    const saturday = wat(2026, 7, 18, 12, 0); // Sat 18 Jul 2026 12:00 WAT
    const result = evaluateReferralPayoutEligibility({
      availableBalance: 20_000,
      minPayoutThreshold: 5_000,
      programEnabled: true,
      now: saturday
    });
    assert.equal(result.meetsThreshold, true);
    assert.equal(result.settlementWindowOpen, false);
    assert.equal(result.canRequestPayout, false);
    assert.equal(result.eligibilityStatus, "awaiting_settlement");
  });

  it("enables withdrawal on Monday 9:00 AM when threshold is met", () => {
    const mondayOpen = wat(2026, 7, 20, 9, 0);
    const result = evaluateReferralPayoutEligibility({
      availableBalance: 20_000,
      minPayoutThreshold: 5_000,
      programEnabled: true,
      now: mondayOpen
    });
    assert.equal(result.settlementWindowOpen, true);
    assert.equal(result.canRequestPayout, true);
    assert.equal(result.eligibilityStatus, "eligible");
  });

  it("keeps withdrawal disabled below minimum with gap message", () => {
    const mondayOpen = wat(2026, 7, 20, 10, 0);
    const result = evaluateReferralPayoutEligibility({
      availableBalance: 2_000,
      minPayoutThreshold: 5_000,
      programEnabled: true,
      now: mondayOpen
    });
    assert.equal(result.canRequestPayout, false);
    assert.equal(result.payoutGap, 3_000);
    assert.equal(result.eligibilityStatus, "below_minimum");
    assert.match(result.eligibilityMessage, /₦3,000 more/);
  });

  it("disables before Monday 9:00 AM", () => {
    const mondayMorning = wat(2026, 7, 20, 8, 59);
    const result = evaluateReferralPayoutEligibility({
      availableBalance: 20_000,
      minPayoutThreshold: 5_000,
      programEnabled: true,
      now: mondayMorning
    });
    assert.equal(result.settlementWindowOpen, false);
    assert.equal(result.canRequestPayout, false);
  });
});
