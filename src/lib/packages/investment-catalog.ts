import type { PackageSlug } from "@/content/packages";
import { packageList } from "@/content/packages";
import type { InvestmentPlan } from "@/types/database";
import type { SettlementFrequency } from "@/lib/investment";
import { settlementFrequencyLabel } from "@/lib/investment-accrual-live";
import { formatNaira } from "@/lib/domain";

export type PackagePlanCard = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
  description: string;
  planId: string | null;
  minInvestment: number;
  maxInvestment: number;
  cycleDays: number;
  settlementFrequency: SettlementFrequency;
  projectedDaily: number;
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
      return {
        slug,
        title: content.title,
        subtitle: content.subtitle,
        description: content.heroDescription,
        planId: null,
        minInvestment: 0,
        maxInvestment: 0,
        cycleDays: 0,
        settlementFrequency: "daily",
        projectedDaily: 0,
        planStatus: "unavailable",
        riskDisclosure: "Returns are projections, not guarantees. Capital is subject to investment risk.",
        available: false
      };
    }

    const minInvestment = Math.min(...tierPlans.map((p) => Number(p.min_investment ?? p.price)));
    const maxInvestment = Math.max(...tierPlans.map((p) => Number(p.max_investment ?? p.price)));

    return {
      slug,
      title: content.title,
      subtitle: content.subtitle,
      description: primary.description || content.heroHeadline,
      planId: primary.id,
      minInvestment,
      maxInvestment,
      cycleDays: primary.cycle_days,
      settlementFrequency: (primary.settlement_frequency ?? "daily") as SettlementFrequency,
      projectedDaily: Number(primary.projected_daily),
      planStatus: primary.plan_status,
      riskDisclosure:
        primary.risk_disclosure ||
        "Returns are projections based on published cycles — not guaranteed. Review terms before investing.",
      available: primary.is_active && primary.plan_status === "active"
    };
  });
}

export function formatSettlementLabel(frequency: SettlementFrequency) {
  return settlementFrequencyLabel(frequency);
}

/** One-line expected return for package cards and review step. */
export function formatExpectedReturnSummary(card: {
  projectedDaily: number;
  cycleDays: number;
  settlementFrequency: SettlementFrequency;
}) {
  const total = card.projectedDaily * card.cycleDays;
  const settlement = formatSettlementLabel(card.settlementFrequency);
  return `${formatNaira(total)} est. · ${settlement} · ${card.cycleDays} days`;
}
