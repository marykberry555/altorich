/**
 * Backward-compatible package/sector layer.
 * All portfolio definitions live in `@/config/investment-portfolios` — this module only adapts field names.
 */
import type { ImageAsset } from "@/lib/images";
import {
  type InvestmentPortfolio,
  type PortfolioIcon,
  type PortfolioSlug,
  INVESTMENT_PORTFOLIOS,
  PORTFOLIO_ROI_RANGE,
  PORTFOLIO_SLUGS,
  calculateDailyReturn,
  calculateWeeklyProjection,
  getPortfolioByInvestmentAmount,
  getPortfolioBySlug,
  getReferralCommissionByPortfolio,
  projectedDailyForPortfolio,
  weeklyInterestForPortfolio,
  getMaxDailyReturnRate,
  getMaxWeeklyProjectionRate
} from "@/config/investment-portfolios";

export type PackageSlug = PortfolioSlug;
export type PackageIcon = PortfolioIcon;

/** @deprecated Prefer InvestmentPortfolio from `@/config/investment-portfolios`. */
export type PackageConfig = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
  displayOrder: number;
  minNgn: number;
  maxNgn: number;
  referralPercent: number;
  payoutTiming: string;
  image: ImageAsset;
  icon: PackageIcon;
  accentGradient: string;
  cardDescription: string;
  keyBenefits: string[];
  bestFor: string;
  whyChoose: string;
  ctaLabel: string;
  /** Portfolio-specific weekly projection percent. */
  weeklyRoiPercent: number;
  /** Portfolio-specific weekly ROI basis points. */
  weeklyRoiBps: number;
  /** Portfolio-specific daily return percent. */
  dailyReturnPercent: number;
  strategy: string;
  recommended: boolean;
  featured: boolean;
  badge: string | null;
};

function toPackageConfig(portfolio: InvestmentPortfolio): PackageConfig {
  return {
    slug: portfolio.slug,
    title: portfolio.name,
    subtitle: portfolio.subtitle,
    displayOrder: portfolio.displayOrder,
    minNgn: portfolio.minimumInvestment,
    maxNgn: portfolio.maximumInvestment,
    referralPercent: portfolio.referralPercent,
    payoutTiming: portfolio.payoutTiming,
    image: portfolio.image,
    icon: portfolio.icon,
    accentGradient: portfolio.accentGradient,
    cardDescription: portfolio.cardDescription,
    keyBenefits: portfolio.keyBenefits,
    bestFor: portfolio.bestFor,
    whyChoose: portfolio.whyChoose,
    ctaLabel: portfolio.ctaLabel,
    weeklyRoiPercent: portfolio.weeklyProjectionRate,
    weeklyRoiBps: portfolio.weeklyRoiBps,
    dailyReturnPercent: portfolio.dailyReturnRate,
    strategy: portfolio.strategy,
    recommended: portfolio.recommended,
    featured: portfolio.featured,
    badge: portfolio.badge
  };
}

export const PACKAGE_CONFIG: PackageConfig[] = INVESTMENT_PORTFOLIOS.map(toPackageConfig);

export const PACKAGE_CONFIG_BY_SLUG = Object.fromEntries(
  PACKAGE_CONFIG.map((pkg) => [pkg.slug, pkg])
) as Record<PackageSlug, PackageConfig>;

export const PACKAGE_SLUGS: PackageSlug[] = PORTFOLIO_SLUGS;

export const PACKAGE_ROI_RANGE = {
  minPercent: PORTFOLIO_ROI_RANGE.minPercent,
  maxPercent: PORTFOLIO_ROI_RANGE.maxPercent,
  dailyPercent: PORTFOLIO_ROI_RANGE.maxPercent,
  weeklyPercent: PORTFOLIO_ROI_RANGE.maxWeeklyPercent,
  headline: PORTFOLIO_ROI_RANGE.headline,
  weeklyHeadline: PORTFOLIO_ROI_RANGE.weeklyHeadline
} as const;

export const GUARANTEED_RETURNS_TAGLINE = "Returns are guaranteed.";

export function getPackageConfig(slug: string): PackageConfig | undefined {
  const portfolio = getPortfolioBySlug(slug);
  return portfolio ? toPackageConfig(portfolio) : undefined;
}

export function getPackageTitle(slug: PackageSlug) {
  return getPackageConfig(slug)?.title ?? slug;
}

/** @deprecated Use getPackageConfig */
export const getTierConfig = getPackageConfig;

/** projected_daily from the portfolio calculation engine. */
export function projectedDailyForPrincipal(principalNgn: number, slugOrBps?: PackageSlug | number): number {
  if (typeof slugOrBps === "string" && getPortfolioBySlug(slugOrBps)) {
    return projectedDailyForPortfolio(slugOrBps, principalNgn);
  }
  const matched = getPortfolioByInvestmentAmount(principalNgn);
  return matched ? projectedDailyForPortfolio(matched.slug, principalNgn) : calculateDailyReturn("starter", principalNgn);
}

export function weeklyInterestForAmount(amountNgn: number, slugOrBps?: PackageSlug | number): number {
  if (typeof slugOrBps === "string" && getPortfolioBySlug(slugOrBps)) {
    return weeklyInterestForPortfolio(slugOrBps, amountNgn);
  }
  // Explicit weekly ROI basis points (e.g. 3500 = 35%).
  if (typeof slugOrBps === "number" && Number.isFinite(slugOrBps) && slugOrBps > 0) {
    return Math.round((Math.abs(amountNgn) * slugOrBps) / 10_000);
  }
  const matched = getPortfolioByInvestmentAmount(amountNgn);
  return matched ? weeklyInterestForPortfolio(matched.slug, amountNgn) : calculateWeeklyProjection("starter", amountNgn);
}

export function formatWeeklyRoiLabel(slug?: PackageSlug) {
  if (slug) {
    const p = getPortfolioBySlug(slug);
    return p ? `${p.dailyReturnRate}% daily (${p.weeklyProjectionRate}% weekly)` : "Platform Earning Model";
  }
  return `Up to ${getMaxDailyReturnRate()}% daily (${getMaxWeeklyProjectionRate()}% weekly)`;
}

export function formatPlatformReturnBadge() {
  return "Platform Earning Model";
}

export function getReferralCommissionByPackage(): Record<PackageSlug, number> {
  return getReferralCommissionByPortfolio();
}

/** Back-compat alias used across services and admin. */
export type PackageTierConfig = PackageConfig;
export const PACKAGE_TIER_CONFIG = PACKAGE_CONFIG;

/** Re-export central portfolio access for new call sites. */
export {
  INVESTMENT_PORTFOLIOS,
  PORTFOLIO_BY_SLUG,
  PORTFOLIO_SLUGS,
  getPortfolioBySlug,
  validateInvestmentAmount,
  calculateDailyReturn,
  calculateWeeklyProjection,
  calculateMonthlyProjection,
  calculateAnnualProjection,
  getAvailablePortfolios,
  getFeaturedPortfolio,
  getPortfolioByInvestmentAmount
} from "@/config/investment-portfolios";

export type { InvestmentPortfolio, PortfolioSlug } from "@/config/investment-portfolios";
