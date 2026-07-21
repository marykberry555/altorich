import type { PackageSlug } from "@/lib/packages/package-config";
import { AppError } from "@/lib/errors";
import { getPackageConfig, projectedDailyForPrincipal } from "@/lib/packages/package-config";
import { getPortfolioBySlug, getPortfolioWeeklyRoiBps } from "@/config/investment-portfolios";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";

export const PLAN_RISK_DISCLOSURE =
  `Returns follow the Alto Rich platform earning model (up to ${PLATFORM_EARNING.dailyReturnPercent}% daily). Earnings auto-reinvest weekly until you stop and withdraw on Monday.`;

export const PLAN_CYCLE_DAYS = 365;

export type CreatePlanInput = {
  name?: string;
  tier: PackageSlug;
  min_investment: number;
  /** @deprecated Ignored — portfolio limits come from centralized config. */
  max_investment?: number | null;
};

export function slugifyPlanName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function buildPlanDefaults(input: CreatePlanInput) {
  const tier = getPackageConfig(input.tier);
  const portfolio = getPortfolioBySlug(input.tier);
  if (!tier || !portfolio) {
    throw new AppError("Invalid package tier.", 400, "INVALID_TIER");
  }

  const minInvestment = input.min_investment;
  if (!(minInvestment > 0)) {
    throw new AppError("Minimum entry must be greater than zero.", 400, "INVALID_MINIMUM");
  }

  const name = (input.name?.trim() || tier.title).slice(0, 120);
  const slugBase = slugifyPlanName(name) || `alto-${input.tier}`;
  const description = `${tier.subtitle} — ${portfolio.dailyReturnRate}% daily (${portfolio.weeklyProjectionRate}% weekly). Auto-reinvest until you stop.`;

  return {
    slugBase,
    name,
    tier: input.tier,
    category: input.tier,
    price: minInvestment,
    min_investment: minInvestment,
    max_investment: portfolio.maximumInvestment,
    currency: portfolio.currency,
    cycle_days: PLAN_CYCLE_DAYS,
    projected_daily: projectedDailyForPrincipal(minInvestment, input.tier),
    first_bonus: 0,
    description,
    settlement_frequency: "weekly" as const,
    plan_status: "active" as const,
    visibility: "public" as const,
    is_active: true,
    weekly_roi_bps: getPortfolioWeeklyRoiBps(input.tier),
    risk_disclosure: PLAN_RISK_DISCLOSURE,
    sort_order: tier.displayOrder
  };
}
