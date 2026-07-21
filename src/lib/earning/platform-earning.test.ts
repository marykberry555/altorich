import test from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORM_EARNING,
  platformDailyInterest,
  platformWeeklyInterest
} from "@/lib/earning/platform-earning";
import { PACKAGE_CONFIG, projectedDailyForPrincipal, weeklyInterestForAmount } from "@/lib/packages/package-config";

test("platform earning headline derives from portfolio config (up to 8% daily)", () => {
  assert.equal(PLATFORM_EARNING.dailyReturnPercent, 8);
  assert.equal(PLATFORM_EARNING.weeklyReturnPercent, 56);
  assert.equal(PLATFORM_EARNING.weeklyRoiBps, 5600);
});

test("each sector has portfolio-specific ROI in package config", () => {
  const rates = PACKAGE_CONFIG.map((p) => p.dailyReturnPercent);
  assert.deepEqual(rates, [5, 6, 7, 8]);
  assert.equal(PACKAGE_CONFIG[0]!.weeklyRoiBps, 3500);
  assert.equal(PACKAGE_CONFIG[3]!.weeklyRoiBps, 5600);
});

test("interest helpers use portfolio slug when provided", () => {
  assert.equal(weeklyInterestForAmount(100_000, "starter"), 35_000);
  assert.equal(weeklyInterestForAmount(100_000, "growth"), 42_000);
  assert.equal(projectedDailyForPrincipal(100_000, "starter"), platformDailyInterest(100_000, "starter"));
  assert.equal(platformWeeklyInterest(100_000, "starter"), 35_000);
});

test("weeklyInterestForAmount honors explicit weekly ROI basis points", () => {
  assert.equal(weeklyInterestForAmount(100_000, 3500), 35_000);
  assert.equal(weeklyInterestForAmount(100_000, 4200), 42_000);
  assert.equal(weeklyInterestForAmount(1_000_000, 4900), 490_000);
  assert.equal(weeklyInterestForAmount(3_000_000, 5600), 1_680_000);
});

test("weeklyInterestForAmount infers portfolio from amount when slug omitted", () => {
  assert.equal(weeklyInterestForAmount(50_000), 17_500); // starter 5% / 35%
  assert.equal(weeklyInterestForAmount(500_000), 210_000); // growth 6% / 42% (shared boundary)
  assert.equal(weeklyInterestForAmount(2_000_000), 840_000); // growth 6% / 42%
  assert.equal(weeklyInterestForAmount(5_000_000), 2_450_000); // premium 7% / 49%
  assert.equal(weeklyInterestForAmount(15_000_000), 8_400_000); // elite 8% / 56%
});
