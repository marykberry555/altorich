import type { PackageSlug } from "@/lib/packages/package-config";
import { packageList } from "@/content/packages";
import type { InvestmentPlan } from "@/types/database";
import type { SettlementFrequency } from "@/lib/investment";
import { settlementFrequencyLabel } from "@/lib/investment-accrual-live";
import { formatNaira } from "@/lib/domain";
import { getPackageConfig, PACKAGE_SLUGS, projectedDailyForPrincipal } from "@/lib/packages/package-config";
import { PLATFORM_EARNING, formatPlatformDailyLabel } from "@/lib/earning/platform-earning";

export type PackagePlanCard = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
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

export function buildPackagePlanCards(plans: InvestmentPlan[]): PackagePlanCard[] {
  const byTier = new Map<string, InvestmentPlan[]>();
  for (const plan of plans) {
    const tier = plan.tier as PackageSlug;
    if (!byTier.has(tier)) byTier.set(tier, []);
    byTier.get(tier)!.push(plan);
  }

  return PACKAGE_SLUGS.map((slug) => {
    const content = packageList.find((p) => p.slug === slug)!;
    const tierDefaults = getPackageConfig(slug)!;
    const tierPlans = (byTier.get(slug) ?? []).sort((a, b) => a.sort_order - b.sort_order);
    const primary = tierPlans[0] ?? null;
    const weeklyRoiPercent = PLATFORM_EARNING.weeklyReturnPercent;
    const dailyReturnPercent = PLATFORM_EARNING.dailyReturnPercent;

    if (!primary) {
      return {
        slug,
        title: tierDefaults.title,
        subtitle: tierDefaults.subtitle,
        description: tierDefaults.cardDescription,
        planId: null,
        minInvestment: tierDefaults.minNgn,
        maxInvestment: tierDefaults.maxNgn,
        weeklyRoiPercent,
        dailyReturnPercent,
        cycleDays: 365,
        settlementFrequency: "weekly",
        projectedDaily: 0,
        payoutTiming: tierDefaults.payoutTiming,
        planStatus: "unavailable",
        riskDisclosure: PLATFORM_EARNING.guarantee,
        available: false,
        accentGradient: tierDefaults.accentGradient,
        keyBenefits: tierDefaults.keyBenefits
      };
    }

    const minInvestment = Math.min(...tierPlans.map((p) => Number(p.min_investment ?? p.price)));
    const maxInvestment = Math.max(...tierPlans.map((p) => Number(p.max_investment ?? p.price)));

    return {
      slug,
      title: tierDefaults.title,
      subtitle: tierDefaults.subtitle,
      description: primary.description || content.heroHeadline,
      planId: primary.id,
      minInvestment,
      maxInvestment,
      weeklyRoiPercent,
      dailyReturnPercent,
      cycleDays: primary.cycle_days,
      settlementFrequency: (primary.settlement_frequency ?? "weekly") as SettlementFrequency,
      projectedDaily: projectedDailyForPrincipal(minInvestment),
      payoutTiming: tierDefaults.payoutTiming,
      planStatus: primary.plan_status,
      riskDisclosure: primary.risk_disclosure || PLATFORM_EARNING.guarantee,
      available: primary.is_active && primary.plan_status === "active",
      accentGradient: tierDefaults.accentGradient,
      keyBenefits: tierDefaults.keyBenefits
    };
  });
}

export function formatSettlementLabel(frequency: SettlementFrequency) {
  return settlementFrequencyLabel(frequency);
}

/** One-line expected return for sector cards — always the platform engine. */
export function formatExpectedReturnSummary(card: {
  weeklyRoiPercent?: number;
  minInvestment: number;
  payoutTiming: string;
}) {
  const weeklyAtMin = Math.round((card.minInvestment * PLATFORM_EARNING.weeklyReturnPercent) / 100);
  return `${formatPlatformDailyLabel()} · ${formatNaira(weeklyAtMin)}/wk at min · ${card.payoutTiming}`;
}
