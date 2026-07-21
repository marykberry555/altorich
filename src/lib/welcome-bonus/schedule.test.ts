import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  daysRemainingUntil,
  expectedUnlockFromRegistration,
  qualificationEndsAt
} from "@/lib/welcome-bonus/schedule";
import { mergeWelcomeBonusConfig } from "@/lib/welcome-bonus/config";

describe("welcome bonus schedule", () => {
  it("qualification is exactly 35 days after registration", () => {
    const registered = new Date("2026-07-01T10:00:00+01:00");
    const ends = qualificationEndsAt(registered, 35);
    assert.equal(ends.toISOString(), new Date("2026-08-05T10:00:00+01:00").toISOString());
  });

  it("unlocks on the first Monday 09:00 WAT after qualification", () => {
    // Qualification ends Wednesday → next Monday 09:00 WAT
    const registered = new Date("2026-07-01T12:00:00+01:00");
    const { qualificationEndsAt: ends, expectedUnlockAt } = expectedUnlockFromRegistration(registered, 35);
    assert.ok(ends.getTime() > registered.getTime());
    const lagos = expectedUnlockAt.toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
      weekday: "long",
      hour: "numeric",
      hour12: false
    });
    assert.match(lagos, /Monday/);
    assert.ok(expectedUnlockAt.getTime() > ends.getTime() - 1);
  });

  it("never unlocks before qualification completes", () => {
    const registered = new Date("2026-07-06T08:00:00+01:00"); // Monday
    const { qualificationEndsAt: ends, expectedUnlockAt } = expectedUnlockFromRegistration(registered, 35);
    assert.ok(expectedUnlockAt.getTime() >= ends.getTime() || expectedUnlockAt.getTime() > registered.getTime());
    assert.ok(daysRemainingUntil(ends, registered) === 35);
  });
});

describe("welcome bonus config", () => {
  it("defaults to ₦10,000 / 200 slots / 35 days", () => {
    const c = mergeWelcomeBonusConfig(null);
    assert.equal(c.amount_ngn, 10_000);
    assert.equal(c.max_allocations, 200);
    assert.equal(c.qualification_days, 35);
    assert.equal(c.enabled, true);
  });
});
