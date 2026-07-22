import test from "node:test";
import assert from "node:assert/strict";
import { nextMondayAt9amLagos, currentTickerWindowLagos, weeklyCountdownTarget, SECONDS_IN_WEEK } from "@/lib/roi/time";
import { computeWeeklyTicker } from "@/lib/roi/math";
import { getWatParts } from "@/lib/investment/accrual-math";

test("nextMondayAt9amLagos returns Monday 9:00 AM as a real UTC Instant", () => {
  const now = new Date("2026-07-09T12:00:00.000Z"); // Thu afternoon UTC
  const target = nextMondayAt9amLagos(now);
  const parts = getWatParts(target);
  assert.equal(parts.dayOfWeek, 1);
  assert.equal(parts.hour, 9);
  assert.equal(parts.minute, 0);
});

test("weeklyCountdownTarget has positive remaining mid-week", () => {
  const now = new Date("2026-07-17T22:00:00.000Z"); // Fri evening UTC
  const { secondsRemaining, target } = weeklyCountdownTarget(now);
  assert.ok(secondsRemaining > 0);
  assert.ok(target.getTime() > now.getTime());
  assert.ok(secondsRemaining < SECONDS_IN_WEEK);
});

test("weeklyCountdownTarget counts down to Monday morning WAT", () => {
  // Monday 07:00 UTC = Monday 08:00 WAT → about 1 hour to 9:00 AM
  const now = new Date("2026-07-20T07:00:00.000Z");
  const { secondsRemaining } = weeklyCountdownTarget(now);
  assert.ok(secondsRemaining > 3500 && secondsRemaining < 3700);
});

test("currentTickerWindowLagos is ~7 days long and aligned to Monday WAT", () => {
  const now = new Date("2026-07-09T12:00:00.000Z");
  const { start, end } = currentTickerWindowLagos(now);
  const diffSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
  assert.equal(diffSeconds, SECONDS_IN_WEEK - 60); // 10:01 -> 10:00 is 7d - 60s
  const endParts = getWatParts(end);
  assert.equal(endParts.dayOfWeek, 1);
  assert.equal(endParts.hour, 10);
  assert.equal(endParts.minute, 0);
});

test("computeWeeklyTicker reaches exact weekly interest at end", () => {
  const principal = 100_000;
  const weeklyBps = 2500; // 25%
  const start = new Date("2026-07-06T09:01:00.000Z"); // Monday 10:01 Lagos
  const end = new Date(start.getTime() + SECONDS_IN_WEEK * 1000);

  const atEnd = computeWeeklyTicker({
    principalNgn: principal,
    weeklyRoiBps: weeklyBps,
    cycleStartedAt: start.toISOString(),
    cycleEndsAt: end.toISOString(),
    now: end
  });
  assert.equal(Math.round(atEnd.accrued), Math.round(principal * 0.25));
});
