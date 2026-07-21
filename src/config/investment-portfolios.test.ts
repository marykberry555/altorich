import test from "node:test";
import assert from "node:assert/strict";
import {
  INVESTMENT_PORTFOLIOS,
  calculateDailyReturn,
  calculateWeeklyProjection,
  getMaxDailyReturnRate,
  getPortfolioByInvestmentAmount,
  getPortfolioBySlug,
  validateInvestmentAmount
} from "@/config/investment-portfolios";

test("four portfolios are configured with expected limits and rates", () => {
  assert.equal(INVESTMENT_PORTFOLIOS.length, 4);

  const order = INVESTMENT_PORTFOLIOS.map((p) => [p.strategy, p.name, p.dailyReturnRate] as const);
  assert.deepEqual(order, [
    ["High-Yield Savings & Fintech Lock Plans", "Alto Starter", 5],
    ["Agricultural Crowdfunding & Processing", "Alto Growth", 6],
    ["Land Banking & Rental Property Cooperatives", "Alto Premium", 7],
    ["Foreign Exchange & Hard Currency Assets", "Alto Elite", 8]
  ]);

  const starter = getPortfolioBySlug("starter")!;
  assert.equal(starter.dailyReturnRate, 5);
  assert.equal(starter.minimumInvestment, 30_000);
  assert.equal(starter.maximumInvestment, 500_000);

  const growth = getPortfolioBySlug("growth")!;
  assert.equal(growth.dailyReturnRate, 6);
  assert.equal(growth.minimumInvestment, 500_000);
  assert.equal(growth.maximumInvestment, 3_000_000);

  const premium = getPortfolioBySlug("premium")!;
  assert.equal(premium.dailyReturnRate, 7);
  assert.equal(premium.minimumInvestment, 3_000_000);
  assert.equal(premium.maximumInvestment, 10_000_000);

  const elite = getPortfolioBySlug("elite")!;
  assert.equal(elite.dailyReturnRate, 8);
  assert.equal(elite.minimumInvestment, 10_000_000);
  assert.equal(elite.maximumInvestment, 50_000_000);
});

test("calculation engine uses portfolio-specific rates", () => {
  assert.equal(calculateDailyReturn("starter", 100_000), 5_000);
  assert.equal(calculateWeeklyProjection("starter", 100_000), 35_000);
  assert.equal(calculateDailyReturn("elite", 15_000_000), 1_200_000);
  assert.equal(getMaxDailyReturnRate(), 8);
});

test("validateInvestmentAmount enforces configured min and max", () => {
  assert.equal(validateInvestmentAmount("starter", 29_999).ok, false);
  assert.equal(validateInvestmentAmount("starter", 30_000).ok, true);
  assert.equal(validateInvestmentAmount("starter", 500_000).ok, true);
  assert.equal(validateInvestmentAmount("starter", 500_001).ok, false);
  assert.equal(getPortfolioByInvestmentAmount(100_000)?.slug, "starter");
  assert.equal(getPortfolioByInvestmentAmount(500_000)?.slug, "growth");
  assert.equal(getPortfolioByInvestmentAmount(5_000_000)?.slug, "premium");
  assert.equal(getPortfolioByInvestmentAmount(15_000_000)?.slug, "elite");
});
