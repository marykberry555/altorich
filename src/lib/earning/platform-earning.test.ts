import test from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORM_EARNING,
  platformDailyInterest,
  platformWeeklyInterest
} from "@/lib/earning/platform-earning";
import { PACKAGE_CONFIG, projectedDailyForPrincipal, weeklyInterestForAmount } from "@/lib/packages/package-config";

test("platform earning engine is 5% daily / 35% weekly", () => {
  assert.equal(PLATFORM_EARNING.dailyReturnPercent, 5);
  assert.equal(PLATFORM_EARNING.weeklyReturnPercent, 35);
  assert.equal(PLATFORM_EARNING.weeklyRoiBps, 3500);
});

test("all sectors share the platform ROI", () => {
  for (const pkg of PACKAGE_CONFIG) {
    assert.equal(pkg.weeklyRoiBps, PLATFORM_EARNING.weeklyRoiBps);
    assert.equal(pkg.weeklyRoiPercent, PLATFORM_EARNING.weeklyReturnPercent);
  }
});

test("interest helpers ignore per-product bps overrides", () => {
  assert.equal(weeklyInterestForAmount(100_000, 1500), platformWeeklyInterest(100_000));
  assert.equal(projectedDailyForPrincipal(100_000, 2000), Math.round(platformDailyInterest(100_000) * 100) / 100);
  assert.equal(platformWeeklyInterest(100_000), 35_000);
});
