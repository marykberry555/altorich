import test from "node:test";
import assert from "node:assert/strict";
import {
  proRataInterest,
  settlementInterestForInvestment,
  weeklySettlementWindow,
  nextMondayNineAmWat,
  watToUtc
} from "@/lib/investment/accrual-math";

test("mid-week start pays pro-rata of 35%, not a full week", () => {
  // Thu 16 Jul 2026 12:00 WAT → Mon 20 Jul 09:00 WAT
  const start = watToUtc(2026, 7, 16, 12, 0);
  const end = nextMondayNineAmWat(start);
  const { accrued, periodTarget } = proRataInterest({
    principal: 100_000,
    weeklyRoiBps: 3500,
    frequency: "weekly",
    periodStart: start,
    periodEnd: end,
    asOf: end
  });
  assert.ok(periodTarget < 35_000);
  assert.ok(accrued > 15_000 && accrued < 25_000);
});

test("settlement after Monday 09:00 still pays the closed week", () => {
  const lastSettlement = watToUtc(2026, 7, 13, 9, 0); // Mon 09:00 WAT
  const periodEnd = nextMondayNineAmWat(lastSettlement);
  const justAfter = new Date(periodEnd.getTime() + 1000);
  const interest = settlementInterestForInvestment({
    principal: 100_000,
    weeklyRoiBps: 3500,
    startedAt: watToUtc(2026, 7, 6, 9, 0),
    lastWeeklySettlementAt: lastSettlement,
    asOf: justAfter
  });
  assert.equal(interest, 35_000);
});

test("settlement before period end returns 0", () => {
  const startedAt = watToUtc(2026, 7, 13, 10, 0);
  const midWeek = watToUtc(2026, 7, 16, 12, 0);
  const interest = settlementInterestForInvestment({
    principal: 100_000,
    weeklyRoiBps: 3500,
    startedAt,
    asOf: midWeek
  });
  assert.equal(interest, 0);
});

test("weeklySettlementWindow ends on Monday 09:00 WAT", () => {
  const startedAt = watToUtc(2026, 7, 11, 14, 0);
  const window = weeklySettlementWindow({ startedAt });
  assert.ok(window);
  assert.equal(window!.periodEnd.toISOString(), watToUtc(2026, 7, 13, 9, 0).toISOString());
});
