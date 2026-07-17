import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  easeInOutCubic,
  formatNairaCounter,
  formatPercentDisplay,
  getLagosDailyWindow,
  interpolateDailyNaira,
  mergeHomepageStats,
  projectEarnings,
  wealthGrowthValueAt
} from "@/lib/homepage/homepage-stats";

describe("homepage stats config", () => {
  it("merges defaults with admin overrides", () => {
    const merged = mergeHomepageStats({ verifiedMembers: 60_000, memberSatisfactionPercent: 99.1 });
    assert.equal(merged.verifiedMembers, 60_000);
    assert.equal(merged.memberSatisfactionPercent, 99.1);
    assert.equal(merged.wealthGrowthTarget, 50_000_000);
    assert.equal(merged.calculatorMinInvestment, 20_000);
    assert.equal(merged.wealthGrowthHeadline, "Growing with Discipline");
  });

  it("formats naira and percents for display", () => {
    assert.equal(formatNairaCounter(1), "₦1");
    assert.equal(formatNairaCounter(50_000_000), "₦50,000,000");
    assert.equal(formatPercentDisplay(98.7), "98.7%");
    assert.equal(formatPercentDisplay(99.99), "99.99%");
  });

  it("interpolates daily values without exceeding max", () => {
    assert.equal(interpolateDailyNaira(100, 200, 150, 1, false), 150);
    assert.ok(easeInOutCubic(0.5) > 0.4 && easeInOutCubic(0.5) < 0.6);
  });

  it("computes a valid Lagos daily window progress", () => {
    const window = getLagosDailyWindow(9, 0, new Date("2026-07-17T10:00:00+01:00"));
    assert.ok(window.progress >= 0 && window.progress <= 1);
    assert.equal(window.durationMs, 24 * 60 * 60 * 1000);
  });

  it("projects Platform Earning Model estimates", () => {
    const p = projectEarnings(500_000, 5, 35);
    assert.equal(p.today, 25_000);
    assert.equal(p.weekly, 175_000);
    assert.equal(p.monthly, 750_000);
    assert.equal(p.annual, 9_125_000);
  });

  it("resets wealth growth near the Lagos start of day", () => {
    const config = mergeHomepageStats(null);
    const justAfterReset = wealthGrowthValueAt(config, new Date("2026-07-17T09:00:05+01:00"));
    assert.ok(justAfterReset < 50_000);
    const midDay = wealthGrowthValueAt(config, new Date("2026-07-17T21:00:00+01:00"));
    assert.ok(midDay > 20_000_000);
  });
});
