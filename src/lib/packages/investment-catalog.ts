import type { PackageSlug } from "@/lib/packages/package-config";
import { packageList } from "@/content/packages";
import type { InvestmentPlan } from "@/types/database";
import type { SettlementFrequency } from "@/lib/investment";
import { settlementFrequencyLabel } from "@/lib/investment-accrual-live";
import { formatNaira } from "@/lib/domain";
import { getPackageConfig, PACKAGE_SLUGS, projectedDailyForPrincipal } from "@/lib/packages/package-config";

export type PackagePlanCard = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
  description: string;
  planId: string | null;
  minInvestment: number;
  maxInvestment: number;
  weeklyRoiPercent: number;
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

    if (!primary) {
      return {
        slug,
        title: tierDefaults.title,
        subtitle: tierDefaults.subtitle,
        description: tierDefaults.cardDescription,
        planId: null,
        minInvestment: tierDefaults.minNgn,
        maxInvestment: tierDefaults.maxNgn,
        weeklyRoiPercent: tierDefaults.weeklyRoiPercent,
        cycleDays: 365,
        settlementFrequency: "weekly",
        projectedDaily: 0,
        payoutTiming: tierDefaults.payoutTiming,
        planStatus: "unavailable",
        riskDisclosure: "Returns are guaranteed.",
        available: false,
        accentGradient: tierDefaults.accentGradient,
        keyBenefits: tierDefaults.keyBenefits
      };
    }

    const minInvestment = Math.min(...tierPlans.map((p) => Number(p.min_investment ?? p.price)));
    const maxInvestment = Math.max(...tierPlans.map((p) => Number(p.max_investment ?? p.price)));
    const weeklyRoiBps = tierDefaults.weeklyRoiBps;
    const weeklyRoiPercent = tierDefaults.weeklyRoiPercent;

    return {
      slug,
      title: tierDefaults.title,
      subtitle: tierDefaults.subtitle,
      description: primary.description || content.heroHeadline,
      planId: primary.id,
      minInvestment,
      maxInvestment,
      weeklyRoiPercent,
      cycleDays: primary.cycle_days,
      settlementFrequency: (primary.settlement_frequency ?? "weekly") as SettlementFrequency,
      projectedDaily: projectedDailyForPrincipal(minInvestment, weeklyRoiBps),
      payoutTiming: tierDefaults.payoutTiming,
      planStatus: primary.plan_status,
      riskDisclosure: primary.risk_disclosure || "Returns are guaranteed.",
      available: primary.is_active && primary.plan_status === "active",
      accentGradient: tierDefaults.accentGradient,
      keyBenefits: tierDefaults.keyBenefits
    };
  });
}

export function formatSettlementLabel(frequency: SettlementFrequency) {
  return settlementFrequencyLabel(frequency);
}

/** One-line expected return for package cards and review step. */
export function formatExpectedReturnSummary(card: {
  weeklyRoiPercent: number;
  minInvestment: number;
  payoutTiming: string;
}) {
  const weeklyAtMin = Math.round((card.minInvestment * card.weeklyRoiPercent) / 100);
  return `${card.weeklyRoiPercent}% weekly · ${formatNaira(weeklyAtMin)}/wk at min · ${card.payoutTiming}`;
}
