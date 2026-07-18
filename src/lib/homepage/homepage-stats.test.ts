import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  easeInOutCubic,
  formatNairaCounter,
  formatNairaWithKobo,
  formatPercentDisplay,
  getLagosDailyWindow,
  interpolateDailyNaira,
  mergeHomepageStats,
  projectEarnings,
  transactedTodayValueAt,
  verifiedMembersValueAt,
  wealthGrowthValueAt
} from "@/lib/homepage/homepage-stats";

describe("homepage stats config", () => {
  it("merges defaults with admin overrides", () => {
    const merged = mergeHomepageStats({ verifiedMembers: 60_000, memberSatisfactionPercent: 99.1 });
    assert.equal(merged.verifiedMembers, 60_000);
    assert.equal(merged.memberSatisfactionPercent, 99.1);
    assert.equal(merged.wealthGrowthTarget, 50_000_000);
    assert.equal(merged.calculatorMinInvestment, 30_000);
    assert.equal(merged.wealthGrowthHeadline, "How Your Money Grows");
  });

  it("formats naira and percents for display", () => {
    assert.equal(formatNairaCounter(1), "₦1");
    assert.equal(formatNairaCounter(50_000_000), "₦50,000,000");
    assert.equal(formatPercentDisplay(98.7), "98.7%");
    assert.equal(formatPercentDisplay(99.99), "99.99%");
    assert.match(formatNairaWithKobo(29263311.98), /₦29,263,311\.98/);
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

  it("advances wealth growth within the same second (ms precision)", () => {
    const config = mergeHomepageStats(null);
    const a = wealthGrowthValueAt(config, new Date("2026-07-17T15:00:00.000+01:00"));
    const b = wealthGrowthValueAt(config, new Date("2026-07-17T15:00:00.500+01:00"));
    assert.ok(b > a);
  });

  it("projects Platform Earning Model estimates", () => {
    const p = projectEarnings(500_000, 5, 35);
    assert.equal(p.today, 25_000);
    assert.equal(p.weekly, 175_000);
    assert.equal(p.monthly, 700_000);
    assert.equal(p.threeMonth, 2_275_000);
    assert.equal(p.sixMonth, 4_550_000);
    assert.equal(p.annual, 9_100_000);
  });

  it("resets wealth growth near the Lagos start of day", () => {
    const config = mergeHomepageStats(null);
    const justAfterReset = wealthGrowthValueAt(config, new Date("2026-07-17T09:00:05+01:00"));
    assert.ok(justAfterReset < 50_000);
    const midDay = wealthGrowthValueAt(config, new Date("2026-07-17T21:00:00+01:00"));
    assert.ok(midDay > 20_000_000);
  });

  it("climbs ₦1 → ₦50M across the Lagos day and never exceeds the cap", () => {
    const config = mergeHomepageStats({ wealthGrowthTarget: 50_000_000, wealthGrowthSpeed: 4 });
    const justAfter = wealthGrowthValueAt(config, new Date("2026-07-17T09:00:05+01:00"));
    const mid = wealthGrowthValueAt(config, new Date("2026-07-17T21:00:00+01:00"));
    const nearEnd = wealthGrowthValueAt(config, new Date("2026-07-18T08:59:00+01:00"));
    const atReset = wealthGrowthValueAt(config, new Date("2026-07-18T09:00:00+01:00"));
    const evening = wealthGrowthValueAt(config, new Date("2026-07-18T03:00:00+01:00"));

    assert.ok(justAfter < 50_000);
    assert.ok(mid > 20_000_000 && mid < 50_000_000);
    assert.ok(nearEnd > 49_000_000 && nearEnd <= 50_000_000);
    assert.ok(atReset < 50_000);
    assert.ok(evening <= 50_000_000);
    assert.ok(evening > mid);
  });

  it("grows verified members and transacted totals across Lagos days", () => {
    const config = mergeHomepageStats({
      verifiedMembers: 55_000,
      verifiedMembersDailyGrowth: 100,
      membersGrowthEpoch: "2026-07-15",
      transactedTodayStart: 39_000_000,
      transactedTodayTarget: 52_000_000,
      transactedDailyFloorGrowth: 100_000
    });
    const day0 = verifiedMembersValueAt(config, new Date("2026-07-15T12:00:00+01:00"));
    const day2 = verifiedMembersValueAt(config, new Date("2026-07-17T12:00:00+01:00"));
    assert.ok(day2 > day0);

    const tx0 = transactedTodayValueAt(config, new Date("2026-07-15T20:00:00+01:00"));
    const tx2 = transactedTodayValueAt(config, new Date("2026-07-17T20:00:00+01:00"));
    assert.ok(tx2 > tx0);
  });
});
