import type { PackageSlug } from "@/content/packages";
import { packageList } from "@/content/packages";
import type { InvestmentPlan } from "@/types/database";
import type { SettlementFrequency } from "@/lib/investment";
import { settlementFrequencyLabel } from "@/lib/investment-accrual-live";
import { formatNaira } from "@/lib/domain";
import { getTierConfig, projectedDailyForPrincipal } from "@/lib/packages/tier-config";

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
};

const PACKAGE_SLUGS: PackageSlug[] = ["starter", "growth", "premium", "elite"];

export function buildPackagePlanCards(plans: InvestmentPlan[]): PackagePlanCard[] {
  const byTier = new Map<string, InvestmentPlan[]>();
  for (const plan of plans) {
    const tier = plan.tier as PackageSlug;
    if (!byTier.has(tier)) byTier.set(tier, []);
    byTier.get(tier)!.push(plan);
  }

  return PACKAGE_SLUGS.map((slug) => {
    const content = packageList.find((p) => p.slug === slug)!;
    const tierPlans = (byTier.get(slug) ?? []).sort((a, b) => a.sort_order - b.sort_order);
    const primary = tierPlans[0] ?? null;

    if (!primary) {
      const tierDefaults = getTierConfig(slug);
      return {
        slug,
        title: content.title,
        subtitle: content.subtitle,
        description: content.heroDescription,
        planId: null,
        minInvestment: tierDefaults?.minNgn ?? 0,
        maxInvestment: tierDefaults?.maxNgn ?? 0,
        weeklyRoiPercent: tierDefaults?.weeklyRoiPercent ?? 0,
        cycleDays: 365,
        settlementFrequency: "weekly",
        projectedDaily: 0,
        payoutTiming: tierDefaults?.payoutTiming ?? "Every Monday, 09:00 WAT",
        planStatus: "unavailable",
        riskDisclosure: "Returns are guaranteed.",
        available: false
      };
    }

    const minInvestment = Math.min(...tierPlans.map((p) => Number(p.min_investment ?? p.price)));
    const maxInvestment = Math.max(...tierPlans.map((p) => Number(p.max_investment ?? p.price)));
    const tierDefaults = getTierConfig(slug);
    const weeklyRoiBps = Number(
      (primary as InvestmentPlan & { weekly_roi_bps?: number }).weekly_roi_bps ??
        tierDefaults?.weeklyRoiBps ??
        1000
    );
    const weeklyRoiPercent = weeklyRoiBps / 100;

    return {
      slug,
      title: content.title,
      subtitle: content.subtitle,
      description: primary.description || content.heroHeadline,
      planId: primary.id,
      minInvestment,
      maxInvestment,
      weeklyRoiPercent,
      cycleDays: primary.cycle_days,
      settlementFrequency: (primary.settlement_frequency ?? "weekly") as SettlementFrequency,
      projectedDaily: projectedDailyForPrincipal(minInvestment, weeklyRoiBps),
      payoutTiming: tierDefaults?.payoutTiming ?? "Every Monday, 09:00 WAT",
      planStatus: primary.plan_status,
      riskDisclosure: primary.risk_disclosure || "Returns are guaranteed.",
      available: primary.is_active && primary.plan_status === "active"
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
