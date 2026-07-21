import type { ImageAsset } from "@/lib/images";
import { PACKAGE_IMAGES } from "@/lib/images";

/** Canonical portfolio identifiers — the only slug union in the application. */
export type PortfolioSlug = "starter" | "growth" | "premium" | "elite";

export type PortfolioIcon = "piggy" | "leaf" | "home" | "briefcase";

export type PortfolioStatus = "active" | "coming_soon" | "hidden";

export type PortfolioVisibility = "public" | "members_only" | "admin_only";

export type InvestmentPortfolio = {
  id: PortfolioSlug;
  slug: PortfolioSlug;
  displayOrder: number;
  sortOrder: number;
  name: string;
  shortName: string;
  subtitle: string;
  strategy: string;
  strategyDescription: string;
  description: string;
  /** Daily return as a whole percent (e.g. 5 = 5%). */
  dailyReturnRate: number;
  /** Weekly equivalent (daily × 7). */
  weeklyProjectionRate: number;
  /** Basis points for settlement math (weekly percent × 100). */
  weeklyRoiBps: number;
  minimumInvestment: number;
  maximumInvestment: number;
  currency: "NGN";
  status: PortfolioStatus;
  available: boolean;
  recommended: boolean;
  featured: boolean;
  badge: string | null;
  badgeColour: string;
  theme: string;
  themeColor: string;
  accentGradient: string;
  icon: PortfolioIcon;
  heroImage: ImageAsset;
  image: ImageAsset;
  displayPriority: number;
  visibility: PortfolioVisibility;
  futureLaunchDate?: string;
  riskCategory: string;
  targetAudience: string;
  highlights: string[];
  benefits: string[];
  keyBenefits: string[];
  bestFor: string;
  whyChoose: string;
  ctaLabel: string;
  cardDescription: string;
  referralPercent: number;
  payoutTiming: string;
  faqReference?: string;
  knowledgeArticles?: string[];
  supportReference?: string;
  metadata: Record<string, string | number | boolean>;
};

const PAYOUT_TIMING = "Every Monday, 09:00 WAT";

/** The single source of truth for all investment portfolio definitions. */
export const INVESTMENT_PORTFOLIOS: readonly InvestmentPortfolio[] = [
  {
    id: "starter",
    slug: "starter",
    displayOrder: 1,
    sortOrder: 1,
    name: "Alto Starter",
    shortName: "Starter",
    subtitle: "High-Yield Savings & Fintech Lock Plans",
    strategy: "High-Yield Savings & Fintech Lock Plans",
    strategyDescription:
      "Designed for members seeking disciplined wealth accumulation through structured savings pools and fintech-backed capital preservation strategies.",
    description:
      "Designed for members seeking disciplined wealth accumulation through structured savings pools and fintech-backed capital preservation strategies.",
    dailyReturnRate: 5,
    weeklyProjectionRate: 35,
    weeklyRoiBps: 3500,
    minimumInvestment: 30_000,
    maximumInvestment: 500_000,
    currency: "NGN",
    status: "active",
    recommended: true,
    featured: false,
    badge: null,
    badgeColour: "slate",
    theme: "slate",
    themeColor: "slate",
    accentGradient: "from-slate-500 to-slate-700",
    icon: "piggy",
    heroImage: PACKAGE_IMAGES.starter,
    image: PACKAGE_IMAGES.starter,
    displayPriority: 1,
    visibility: "public",
    available: true,
    riskCategory: "Conservative",
    targetAudience: "Disciplined savers building their first cooperative allocation.",
    highlights: ["Inflation protection", "Stable savings discipline", "Transparent investment ledger"],
    benefits: ["Inflation protection", "Stable savings discipline", "Transparent investment ledger"],
    keyBenefits: ["5% daily return", "₦30,000 to ₦500,000", "Inflation protection"],
    bestFor: "Best for disciplined savers.",
    whyChoose: "Ideal for members seeking disciplined savings and structured capital growth.",
    ctaLabel: "Get Started",
    cardDescription:
      "Designed for members seeking disciplined wealth accumulation through structured savings pools and fintech-backed capital preservation strategies.",
    referralPercent: 3,
    payoutTiming: PAYOUT_TIMING,
    faqReference: "packages/starter",
    knowledgeArticles: ["getting-started", "platform-earning-model"],
    supportReference: "/contact",
    metadata: { tier: 1, riskScore: 1 }
  },
  {
    id: "growth",
    slug: "growth",
    displayOrder: 2,
    sortOrder: 2,
    name: "Alto Growth",
    shortName: "Growth",
    subtitle: "Agricultural Crowdfunding & Processing",
    strategy: "Agricultural Crowdfunding & Processing",
    strategyDescription:
      "Participate in Nigerian agricultural production, processing, and seasonal value chains supporting real economic growth.",
    description:
      "Participate in Nigerian agricultural production, processing, and seasonal value chains supporting real economic growth.",
    dailyReturnRate: 6,
    weeklyProjectionRate: 42,
    weeklyRoiBps: 4200,
    minimumInvestment: 500_000,
    maximumInvestment: 3_000_000,
    currency: "NGN",
    status: "active",
    recommended: false,
    featured: true,
    badge: "Popular",
    badgeColour: "emerald",
    theme: "emerald",
    themeColor: "emerald",
    accentGradient: "from-[var(--emerald)] to-[var(--emerald-mid)]",
    icon: "leaf",
    heroImage: PACKAGE_IMAGES.growth,
    image: PACKAGE_IMAGES.growth,
    displayPriority: 2,
    visibility: "public",
    available: true,
    riskCategory: "Moderate",
    targetAudience: "Members who want agriculture-backed production cycles.",
    highlights: ["Agriculture-backed investments", "Seasonal production cycles", "Community economic impact"],
    benefits: ["Agriculture-backed investments", "Seasonal production cycles", "Community economic impact"],
    keyBenefits: ["6% daily return", "₦500,000 to ₦3,000,000", "Agriculture-backed investments"],
    bestFor: "Best for agriculture-focused investors.",
    whyChoose: "Ideal for members who believe in agriculture and food production.",
    ctaLabel: "Get Started",
    cardDescription:
      "Participate in Nigerian agricultural production, processing, and seasonal value chains supporting real economic growth.",
    referralPercent: 4,
    payoutTiming: PAYOUT_TIMING,
    faqReference: "packages/growth",
    knowledgeArticles: ["agriculture-investing"],
    supportReference: "/contact",
    metadata: { tier: 2, riskScore: 2 }
  },
  {
    id: "premium",
    slug: "premium",
    displayOrder: 3,
    sortOrder: 3,
    name: "Alto Premium",
    shortName: "Premium",
    subtitle: "Land Banking & Rental Property Cooperatives",
    strategy: "Land Banking & Rental Property Cooperatives",
    strategyDescription:
      "Invest alongside premium land banking opportunities and income-generating real estate projects built for long-term wealth preservation.",
    description:
      "Invest alongside premium land banking opportunities and income-generating real estate projects built for long-term wealth preservation.",
    dailyReturnRate: 7,
    weeklyProjectionRate: 49,
    weeklyRoiBps: 4900,
    minimumInvestment: 3_000_000,
    maximumInvestment: 10_000_000,
    currency: "NGN",
    status: "active",
    recommended: false,
    featured: false,
    badge: null,
    badgeColour: "navy",
    theme: "navy",
    themeColor: "navy",
    accentGradient: "from-[var(--navy-mid)] to-[var(--navy)]",
    icon: "home",
    heroImage: PACKAGE_IMAGES.premium,
    image: PACKAGE_IMAGES.premium,
    displayPriority: 3,
    visibility: "public",
    available: true,
    riskCategory: "Balanced",
    targetAudience: "Long-term investors focused on property and land-backed assets.",
    highlights: ["Asset-backed investments", "Property growth exposure", "Long-term wealth strategy"],
    benefits: ["Asset-backed investments", "Property growth exposure", "Long-term wealth strategy"],
    keyBenefits: ["7% daily return", "₦3,000,000 to ₦10,000,000", "Asset-backed investments"],
    bestFor: "Best for real estate investors.",
    whyChoose: "Ideal for members focused on long-term property and land-backed opportunities.",
    ctaLabel: "Get Started",
    cardDescription:
      "Invest alongside premium land banking opportunities and income-generating real estate projects built for long-term wealth preservation.",
    referralPercent: 6,
    payoutTiming: PAYOUT_TIMING,
    faqReference: "packages/premium",
    knowledgeArticles: ["property-cooperatives"],
    supportReference: "/contact",
    metadata: { tier: 3, riskScore: 3 }
  },
  {
    id: "elite",
    slug: "elite",
    displayOrder: 4,
    sortOrder: 4,
    name: "Alto Elite",
    shortName: "Elite",
    subtitle: "Foreign Exchange & Hard Currency Assets",
    strategy: "Foreign Exchange & Hard Currency Assets",
    strategyDescription:
      "Access diversified hard-currency investment opportunities designed to reduce local currency risk while preserving long-term purchasing power.",
    description:
      "Access diversified hard-currency investment opportunities designed to reduce local currency risk while preserving long-term purchasing power.",
    dailyReturnRate: 8,
    weeklyProjectionRate: 56,
    weeklyRoiBps: 5600,
    minimumInvestment: 10_000_000,
    maximumInvestment: 50_000_000,
    currency: "NGN",
    status: "active",
    recommended: false,
    featured: false,
    badge: "Elite",
    badgeColour: "gold",
    theme: "gold",
    themeColor: "gold",
    accentGradient: "from-[var(--gold)] to-amber-600",
    icon: "briefcase",
    heroImage: PACKAGE_IMAGES.elite,
    image: PACKAGE_IMAGES.elite,
    displayPriority: 4,
    visibility: "public",
    available: true,
    riskCategory: "Growth",
    targetAudience: "Members seeking hard-currency exposure and global diversification.",
    highlights: ["Currency diversification", "Global asset exposure", "Elite portfolio allocation"],
    benefits: ["Currency diversification", "Global asset exposure", "Elite portfolio allocation"],
    keyBenefits: ["8% daily return", "₦10,000,000 to ₦50,000,000", "Currency diversification"],
    bestFor: "Best for global diversification.",
    whyChoose: "Ideal for members seeking hard-currency exposure and global diversification.",
    ctaLabel: "Get Started",
    cardDescription:
      "Access diversified hard-currency investment opportunities designed to reduce local currency risk while preserving long-term purchasing power.",
    referralPercent: 5,
    payoutTiming: PAYOUT_TIMING,
    faqReference: "packages/elite",
    knowledgeArticles: ["fx-preservation"],
    supportReference: "/contact",
    metadata: { tier: 4, riskScore: 4 }
  }
] as const;

export const PORTFOLIO_BY_SLUG = Object.fromEntries(
  INVESTMENT_PORTFOLIOS.map((p) => [p.slug, p])
) as Record<PortfolioSlug, InvestmentPortfolio>;

export const PORTFOLIO_SLUGS: PortfolioSlug[] = [...INVESTMENT_PORTFOLIOS]
  .sort((a, b) => a.displayOrder - b.displayOrder)
  .map((p) => p.slug);

export function isPortfolioSlug(value: string): value is PortfolioSlug {
  return value in PORTFOLIO_BY_SLUG;
}

export function getPortfolioById(id: string): InvestmentPortfolio | undefined {
  return PORTFOLIO_BY_SLUG[id as PortfolioSlug];
}

export function getPortfolioBySlug(slug: string): InvestmentPortfolio | undefined {
  return getPortfolioById(slug);
}

export function getAvailablePortfolios(): InvestmentPortfolio[] {
  return INVESTMENT_PORTFOLIOS.filter((p) => p.available && p.status === "active" && p.visibility === "public").sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
}

export function getFeaturedPortfolio(): InvestmentPortfolio | undefined {
  return INVESTMENT_PORTFOLIOS.find((p) => p.featured && p.available);
}

export function getRecommendedPortfolios(): InvestmentPortfolio[] {
  return INVESTMENT_PORTFOLIOS.filter((p) => p.recommended && p.available);
}

/** Highest display-priority portfolio that matches the amount within configured limits. */
export function getPortfolioByInvestmentAmount(amountNgn: number): InvestmentPortfolio | undefined {
  const sorted = [...INVESTMENT_PORTFOLIOS].sort((a, b) => b.displayPriority - a.displayPriority);
  return sorted.find(
    (p) => amountNgn >= p.minimumInvestment && amountNgn <= p.maximumInvestment && p.available
  );
}

export type InvestmentValidationResult =
  | { ok: true }
  | { ok: false; code: "BELOW_MINIMUM" | "ABOVE_MAXIMUM" | "UNAVAILABLE"; message: string };

export function validateInvestmentAmount(
  slug: PortfolioSlug,
  amountNgn: number
): InvestmentValidationResult {
  const portfolio = getPortfolioBySlug(slug);
  if (!portfolio || !portfolio.available) {
    return { ok: false, code: "UNAVAILABLE", message: "This investment portfolio is not available." };
  }
  if (amountNgn < portfolio.minimumInvestment) {
    return {
      ok: false,
      code: "BELOW_MINIMUM",
      message: `Minimum investment is ₦${portfolio.minimumInvestment.toLocaleString("en-NG")}.`
    };
  }
  if (amountNgn > portfolio.maximumInvestment) {
    return {
      ok: false,
      code: "ABOVE_MAXIMUM",
      message: `Maximum investment is ₦${portfolio.maximumInvestment.toLocaleString("en-NG")}.`
    };
  }
  return { ok: true };
}

export function getMaxDailyReturnRate(): number {
  return Math.max(...INVESTMENT_PORTFOLIOS.map((p) => p.dailyReturnRate));
}

export function getMaxWeeklyProjectionRate(): number {
  return Math.max(...INVESTMENT_PORTFOLIOS.map((p) => p.weeklyProjectionRate));
}

/** Unified calculation engine — all projections derive from portfolio config. */
export function calculateDailyReturn(slug: PortfolioSlug, amountNgn: number): number {
  const portfolio = getPortfolioBySlug(slug);
  if (!portfolio) return 0;
  return Math.round((Math.abs(amountNgn) * portfolio.dailyReturnRate) / 100);
}

export function calculateWeeklyProjection(slug: PortfolioSlug, amountNgn: number): number {
  const portfolio = getPortfolioBySlug(slug);
  if (!portfolio) return 0;
  return Math.round((Math.abs(amountNgn) * portfolio.weeklyProjectionRate) / 100);
}

export function calculateMonthlyProjection(slug: PortfolioSlug, amountNgn: number): number {
  return calculateDailyReturn(slug, amountNgn) * 30;
}

export function calculateThreeMonthProjection(slug: PortfolioSlug, amountNgn: number): number {
  return calculateWeeklyProjection(slug, amountNgn) * 13;
}

export function calculateSixMonthProjection(slug: PortfolioSlug, amountNgn: number): number {
  return calculateWeeklyProjection(slug, amountNgn) * 26;
}

export function calculateAnnualProjection(slug: PortfolioSlug, amountNgn: number): number {
  return calculateDailyReturn(slug, amountNgn) * 365;
}

export function projectedDailyForPortfolio(slug: PortfolioSlug, principalNgn: number): number {
  return calculateDailyReturn(slug, principalNgn);
}

export function weeklyInterestForPortfolio(slug: PortfolioSlug, amountNgn: number): number {
  return calculateWeeklyProjection(slug, amountNgn);
}

export function getPortfolioBadge(slug: PortfolioSlug): string | null {
  return getPortfolioBySlug(slug)?.badge ?? null;
}

export function getPortfolioColor(slug: PortfolioSlug): string {
  return getPortfolioBySlug(slug)?.themeColor ?? "emerald";
}

export function getPortfolioIcon(slug: PortfolioSlug): PortfolioIcon {
  return getPortfolioBySlug(slug)?.icon ?? "piggy";
}

export function getPortfolioWeeklyRoiBps(slug: PortfolioSlug): number {
  return getPortfolioBySlug(slug)?.weeklyRoiBps ?? INVESTMENT_PORTFOLIOS[0].weeklyRoiBps;
}

/**
 * Resolve weekly ROI bps from portfolio slug, stored investment value, or amount range.
 * Prefer slug → stored bps → amount inference → Starter default.
 */
export function resolveWeeklyRoiBps(input: {
  slug?: string | null;
  weeklyRoiBps?: number | null;
  amountNgn?: number | null;
}): number {
  if (input.slug && isPortfolioSlug(input.slug)) {
    return getPortfolioWeeklyRoiBps(input.slug);
  }
  const stored = Number(input.weeklyRoiBps);
  if (Number.isFinite(stored) && stored > 0) {
    return Math.floor(stored);
  }
  if (typeof input.amountNgn === "number" && Number.isFinite(input.amountNgn)) {
    const matched = getPortfolioByInvestmentAmount(input.amountNgn);
    if (matched) return matched.weeklyRoiBps;
  }
  return INVESTMENT_PORTFOLIOS[0].weeklyRoiBps;
}

export function formatPortfolioDailyRate(slug: PortfolioSlug): string {
  const rate = getPortfolioBySlug(slug)?.dailyReturnRate;
  return rate != null ? `${rate}% daily` : "";
}

export function formatPortfolioWeeklyRate(slug: PortfolioSlug): string {
  const rate = getPortfolioBySlug(slug)?.weeklyProjectionRate;
  return rate != null ? `${rate}% weekly` : "";
}

export function getReferralCommissionByPortfolio(): Record<PortfolioSlug, number> {
  return Object.fromEntries(INVESTMENT_PORTFOLIOS.map((p) => [p.slug, p.referralPercent])) as Record<
    PortfolioSlug,
    number
  >;
}

export const PORTFOLIO_ROI_RANGE = {
  minPercent: Math.min(...INVESTMENT_PORTFOLIOS.map((p) => p.dailyReturnRate)),
  maxPercent: getMaxDailyReturnRate(),
  minWeeklyPercent: Math.min(...INVESTMENT_PORTFOLIOS.map((p) => p.weeklyProjectionRate)),
  maxWeeklyPercent: getMaxWeeklyProjectionRate(),
  headline: `Earn Up To ${getMaxDailyReturnRate()}% Daily`,
  weeklyHeadline: `${getMaxWeeklyProjectionRate()}% weekly equivalent`
} as const;
