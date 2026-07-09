import test from "node:test";
import assert from "node:assert/strict";
import { nextMondayAt9amLagos, currentTickerWindowLagos, SECONDS_IN_WEEK } from "@/lib/roi/time";
import { computeWeeklyTicker } from "@/lib/roi/math";

test("nextMondayAt9amLagos returns a Monday 09:00 target", () => {
  const now = new Date("2026-07-09T12:00:00.000Z"); // Thu
  const target = nextMondayAt9amLagos(now);
  assert.equal(target.getUTCDay(), 1);
  assert.equal(target.getUTCHours(), 9);
  assert.equal(target.getUTCMinutes(), 0);
});

test("currentTickerWindowLagos is 7 days long and aligned", () => {
  const now = new Date("2026-07-09T12:00:00.000Z");
  const { start, end } = currentTickerWindowLagos(now);
  const diffSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
  assert.equal(diffSeconds, SECONDS_IN_WEEK - 60); // 10:01 -> 10:00 is 7d - 60s
  assert.equal(end.getUTCDay(), 1);
  assert.equal(end.getUTCHours(), 10);
  assert.equal(end.getUTCMinutes(), 0);
});

test("computeWeeklyTicker reaches exact weekly interest at end", () => {
  const principal = 100_000;
  const weeklyBps = 2500; // 25%
  const start = new Date("2026-07-06T09:01:00.000Z"); // Monday 10:01 Lagos ~ 09:01 UTC in DST-free offset assumptions
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

