import type { PackageSlug } from "@/lib/packages/package-config";
import { AppError } from "@/lib/errors";
import { getPackageConfig, projectedDailyForPrincipal } from "@/lib/packages/package-config";

export const PLAN_RISK_DISCLOSURE =
  "Returns are guaranteed. Earnings auto-reinvest weekly until you stop and withdraw on Monday.";

export const PLAN_CYCLE_DAYS = 365;

export type CreatePlanInput = {
  name?: string;
  tier: PackageSlug;
  min_investment: number;
  max_investment?: number;
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
  if (!tier) {
    throw new AppError("Invalid package tier.", 400, "INVALID_TIER");
  }

  const minInvestment = input.min_investment;
  const maxInvestment = input.max_investment ?? tier.maxNgn;
  if (maxInvestment < minInvestment) {
    throw new AppError("Maximum investment must be at least the minimum.", 400, "INVALID_RANGE");
  }

  const name = (input.name?.trim() || tier.title).slice(0, 120);
  const slugBase = slugifyPlanName(name) || `alto-${input.tier}`;
  const description = `${tier.subtitle} — ${tier.weeklyRoiPercent}% weekly, guaranteed returns, auto-reinvest until you stop.`;

  return {
    slugBase,
    name,
    tier: input.tier,
    category: input.tier,
    price: minInvestment,
    min_investment: minInvestment,
    max_investment: maxInvestment,
    currency: "NGN" as const,
    cycle_days: PLAN_CYCLE_DAYS,
    projected_daily: projectedDailyForPrincipal(minInvestment, tier.weeklyRoiBps),
    first_bonus: 0,
    description,
    settlement_frequency: "weekly" as const,
    plan_status: "active" as const,
    visibility: "public" as const,
    is_active: true,
    weekly_roi_bps: tier.weeklyRoiBps,
    risk_disclosure: PLAN_RISK_DISCLOSURE,
    sort_order: tier.displayOrder
  };
}
