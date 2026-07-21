import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveWelcomeBonusLifecycle } from "@/lib/welcome-bonus/lifecycle";
import type { WelcomeBonusProgrammeStatus } from "@/lib/welcome-bonus/programme-status";
import type { WelcomeBonusMemberView } from "@/services/welcome-bonus/welcome-bonus.service";

const programme: WelcomeBonusProgrammeStatus = {
  enabled: true,
  amount: 10_000,
  maxAllocations: 200,
  allocated: 54,
  remaining: 146,
  qualificationDays: 35,
  fullyAllocated: false
};

const baseView: WelcomeBonusMemberView = {
  allocated: false,
  amount: 0,
  status: "none",
  allocationNumber: null,
  daysRemaining: 0,
  qualificationEndsAt: null,
  expectedUnlockAt: null,
  unlockedAt: null,
  withdrawableBalance: 0,
  settlementReference: null,
  unlockHint: "Monday unlock"
};

describe("welcome bonus lifecycle", () => {
  it("maps email pending before allocation", () => {
    const lifecycle = resolveWelcomeBonusLifecycle({
      memberView: baseView,
      programme,
      emailVerified: false
    });
    assert.equal(lifecycle.stage, "email_pending");
    assert.ok(lifecycle.nextAction?.href);
  });

  it("maps qualification in progress", () => {
    const registeredAt = new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString();
    const lifecycle = resolveWelcomeBonusLifecycle({
      memberView: {
        ...baseView,
        allocated: true,
        amount: 10_000,
        status: "locked",
        daysRemaining: 17,
        qualificationEndsAt: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
        expectedUnlockAt: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString()
      },
      programme,
      emailVerified: true,
      registeredAt
    });
    assert.equal(lifecycle.stage, "qualification_in_progress");
    assert.ok(lifecycle.progressPercent > 0);
  });

  it("maps fully allocated programme", () => {
    const lifecycle = resolveWelcomeBonusLifecycle({
      memberView: baseView,
      programme: { ...programme, remaining: 0, fullyAllocated: true, allocated: 200 },
      emailVerified: true
    });
    assert.equal(lifecycle.stage, "promotion_full");
  });
});
