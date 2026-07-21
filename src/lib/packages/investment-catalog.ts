import type { PackageSlug } from "@/lib/packages/package-config";
import { packageList } from "@/content/packages";
import type { InvestmentPlan } from "@/types/database";
import type { SettlementFrequency } from "@/lib/investment";
import { settlementFrequencyLabel } from "@/lib/investment-accrual-live";
import { formatNaira } from "@/lib/domain";
import {
  getPackageConfig,
  PACKAGE_SLUGS,
  projectedDailyForPrincipal,
  calculateWeeklyProjection
} from "@/lib/packages/package-config";
import { getPortfolioBySlug } from "@/config/investment-portfolios";
import { formatPlatformDailyLabel } from "@/lib/earning/platform-earning";
import { formatInvestmentRange } from "@/lib/copy/portfolio-terminology";

export type PortfolioPlanCard = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
  strategy: string;
  description: string;
  planId: string | null;
  minInvestment: number;
  maxInvestment: number;
  weeklyRoiPercent: number;
  dailyReturnPercent: number;
  cycleDays: number;
  settlementFrequency: SettlementFrequency;
  projectedDaily: number;
  payoutTiming: string;
  planStatus: string;
  riskDisclosure: string;
  available: boolean;
  accentGradient: string;
  keyBenefits: string[];
};

/** @deprecated Use PortfolioPlanCard */
export type PackagePlanCard = PortfolioPlanCard;

const ILLUSTRATIVE_DISCLOSURE =
  "Illustrative returns based on published portfolio parameters — not a guarantee of future results.";

export function buildPortfolioPlanCards(plans: InvestmentPlan[]): PortfolioPlanCard[] {
  const byTier = new Map<string, InvestmentPlan[]>();
  for (const plan of plans) {
    const tier = plan.tier as PackageSlug;
    if (!byTier.has(tier)) byTier.set(tier, []);
    byTier.get(tier)!.push(plan);
  }

  return PACKAGE_SLUGS.map((slug) => {
    const content = packageList.find((p) => p.slug === slug)!;
    const tierDefaults = getPackageConfig(slug)!;
    const portfolio = getPortfolioBySlug(slug)!;
    const tierPlans = (byTier.get(slug) ?? []).sort((a, b) => a.sort_order - b.sort_order);
    const primary = tierPlans[0] ?? null;

    const base = {
      slug,
      title: portfolio.name,
      subtitle: portfolio.subtitle,
      strategy: portfolio.strategy,
      weeklyRoiPercent: portfolio.weeklyProjectionRate,
      dailyReturnPercent: portfolio.dailyReturnRate,
      minInvestment: portfolio.minimumInvestment,
      maxInvestment: portfolio.maximumInvestment,
      payoutTiming: portfolio.payoutTiming,
      accentGradient: tierDefaults.accentGradient,
      keyBenefits: portfolio.highlights
    };

    if (!primary) {
      return {
        ...base,
        description: tierDefaults.cardDescription,
        planId: null,
        cycleDays: 365,
        settlementFrequency: "weekly" as SettlementFrequency,
        projectedDaily: 0,
        planStatus: "unavailable",
        riskDisclosure: ILLUSTRATIVE_DISCLOSURE,
        available: false
      };
    }

    return {
      ...base,
      description: primary.description || content.heroHeadline,
      planId: primary.id,
      cycleDays: primary.cycle_days,
      settlementFrequency: (primary.settlement_frequency ?? "weekly") as SettlementFrequency,
      projectedDaily: projectedDailyForPrincipal(portfolio.minimumInvestment, slug),
      planStatus: primary.plan_status,
      riskDisclosure: primary.risk_disclosure || ILLUSTRATIVE_DISCLOSURE,
      available: primary.is_active && primary.plan_status === "active"
    };
  });
}

/** @deprecated Use buildPortfolioPlanCards */
export const buildPackagePlanCards = buildPortfolioPlanCards;

export function formatSettlementLabel(frequency: SettlementFrequency) {
  return settlementFrequencyLabel(frequency);
}

export function formatPortfolioRange(slug: PackageSlug) {
  const portfolio = getPortfolioBySlug(slug);
  if (!portfolio) return "";
  return formatInvestmentRange(portfolio.minimumInvestment, portfolio.maximumInvestment, formatNaira);
}

/** One-line expected return summary for portfolio cards. */
export function formatExpectedReturnSummary(card: {
  slug?: PackageSlug;
  weeklyRoiPercent?: number;
  minInvestment: number;
  payoutTiming: string;
}) {
  const weeklyAtMin = card.slug
    ? calculateWeeklyProjection(card.slug, card.minInvestment)
    : Math.round((card.minInvestment * (card.weeklyRoiPercent ?? 0)) / 100);
  const dailyLabel = card.slug ? formatPlatformDailyLabel(card.slug) : formatPlatformDailyLabel();
  return `${dailyLabel} · ${formatNaira(weeklyAtMin)}/wk at min · ${card.payoutTiming}`;
}
