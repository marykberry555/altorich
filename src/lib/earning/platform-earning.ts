import {
  calculateDailyReturn,
  getMaxDailyReturnRate,
  getMaxWeeklyProjectionRate,
  getPortfolioBySlug,
  INVESTMENT_PORTFOLIOS,
  projectedDailyForPortfolio,
  weeklyInterestForPortfolio,
  type PortfolioSlug
} from "@/config/investment-portfolios";

/**
 * Alto Rich Platform Earning Model — headline constants derived from portfolio config.
 * Per-portfolio rates live in `@/config/investment-portfolios`.
 */
const maxDaily = getMaxDailyReturnRate();
const maxWeekly = getMaxWeeklyProjectionRate();

export const PLATFORM_EARNING = {
  modelName: "Platform Earning Model",
  dailyReturnPercent: maxDaily,
  weeklyReturnPercent: maxWeekly,
  weeklyRoiBps: maxWeekly * 100,
  payoutTiming: INVESTMENT_PORTFOLIOS[0]?.payoutTiming ?? ("Every Monday, 09:00 WAT" as const),
  settlementScheduleLabel: "Settlement Schedule",
  nextSettlementLabel: "Next Monday Settlement",
  currentDailyRateLabel: "Current Daily Rate",
  currentWeeklyEquivalentLabel: "Current Weekly Equivalent",
  poweredByLabel: "Powered by Alto Rich's Platform Earning Model.",
  headlineDaily: `Earn Up To ${maxDaily}% Daily`,
  headlineWeekly: `${maxWeekly}% weekly equivalent`,
  badgeLabel: "Platform Earning Model",
  guarantee: "Returns are guaranteed.",
  /** @deprecated Prefer poweredByLabel / modelName */
  productReturnLabel: "Powered by Alto Rich's Platform Earning Model."
} as const;

export type PlatformEarning = typeof PLATFORM_EARNING;

/** Weekly interest using portfolio-specific rates when slug is provided. */
export function platformWeeklyInterest(principalNgn: number, slug?: PortfolioSlug): number {
  if (slug) return weeklyInterestForPortfolio(slug, principalNgn);
  return Math.round((Math.abs(principalNgn) * PLATFORM_EARNING.weeklyReturnPercent) / 100);
}

/** Daily interest using portfolio-specific rates when slug is provided. */
export function platformDailyInterest(principalNgn: number, slug?: PortfolioSlug): number {
  if (slug) return calculateDailyReturn(slug, principalNgn);
  return Math.round((Math.abs(principalNgn) * PLATFORM_EARNING.dailyReturnPercent) / 100);
}

/** projected_daily column helper for settlement schedules. */
export function platformProjectedDaily(principalNgn: number, slug?: PortfolioSlug): number {
  if (slug) return projectedDailyForPortfolio(slug, principalNgn);
  return platformDailyInterest(principalNgn);
}

export function formatPlatformDailyLabel(slug?: PortfolioSlug): string {
  const portfolio = slug ? getPortfolioBySlug(slug) : undefined;
  if (portfolio) return `${portfolio.dailyReturnRate}% daily`;
  return `${PLATFORM_EARNING.dailyReturnPercent}% daily`;
}

export function formatPlatformWeeklyLabel(slug?: PortfolioSlug): string {
  const portfolio = slug ? getPortfolioBySlug(slug) : undefined;
  if (portfolio) return `${portfolio.weeklyProjectionRate}% weekly`;
  return `${PLATFORM_EARNING.weeklyReturnPercent}% weekly`;
}

export function formatCurrentDailyRate(): string {
  return `Up to ${PLATFORM_EARNING.dailyReturnPercent}%`;
}

export function formatCurrentWeeklyEquivalent(): string {
  return `${PLATFORM_EARNING.weeklyReturnPercent}% weekly`;
}

// Re-export for tests
export { getMaxDailyReturnRate, getMaxWeeklyProjectionRate };
