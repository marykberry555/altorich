import type { ImageAsset } from "@/lib/images";
import { PACKAGE_IMAGES } from "@/lib/images";
import {
  PLATFORM_EARNING,
  platformProjectedDaily,
  platformWeeklyInterest
} from "@/lib/earning/platform-earning";

/** Canonical sector slugs — capital allocation categories, not ROI packages. */
export type PackageSlug = "starter" | "growth" | "premium" | "elite";

export type PackageIcon = "piggy" | "leaf" | "home" | "briefcase";

/**
 * Investment sector configuration.
 * Earnings always come from PLATFORM_EARNING — never from per-sector ROI.
 */
export type PackageConfig = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
  displayOrder: number;
  minNgn: number;
  maxNgn: number;
  referralPercent: number;
  payoutTiming: typeof PLATFORM_EARNING.payoutTiming;
  image: ImageAsset;
  icon: PackageIcon;
  accentGradient: string;
  cardDescription: string;
  keyBenefits: string[];
  /** Short “best for” line on sector cards. */
  bestFor: string;
  /** Concise “Why choose this sector?” copy. */
  whyChoose: string;
  ctaLabel: string;
  /** @deprecated Use PLATFORM_EARNING — kept for gradual call-site migration. */
  weeklyRoiPercent: number;
  /** @deprecated Use PLATFORM_EARNING.weeklyRoiBps */
  weeklyRoiBps: number;
};

const PLATFORM_BPS = PLATFORM_EARNING.weeklyRoiBps;
const PLATFORM_PCT = PLATFORM_EARNING.weeklyReturnPercent;

export const PACKAGE_CONFIG: PackageConfig[] = [
  {
    slug: "starter",
    title: "Alto Starter",
    subtitle: "High-Yield Savings & Fintech Lock Plans",
    displayOrder: 1,
    minNgn: 20_000,
    maxNgn: 100_000,
    weeklyRoiPercent: PLATFORM_PCT,
    weeklyRoiBps: PLATFORM_BPS,
    referralPercent: 3,
    payoutTiming: PLATFORM_EARNING.payoutTiming,
    image: PACKAGE_IMAGES.starter,
    icon: "piggy",
    accentGradient: "from-slate-500 to-slate-700",
    cardDescription:
      "Designed for members seeking disciplined wealth accumulation through structured savings pools and fintech-backed capital preservation strategies.",
    keyBenefits: ["Inflation protection", "Stable savings discipline", "Transparent investment ledger"],
    bestFor: "Best for disciplined savers.",
    whyChoose: "Ideal for members seeking disciplined savings and structured capital growth.",
    ctaLabel: "Get Started"
  },
  {
    slug: "growth",
    title: "Alto Growth",
    subtitle: "Agricultural Crowdfunding & Processing",
    displayOrder: 2,
    minNgn: 101_000,
    maxNgn: 500_000,
    weeklyRoiPercent: PLATFORM_PCT,
    weeklyRoiBps: PLATFORM_BPS,
    referralPercent: 4,
    payoutTiming: PLATFORM_EARNING.payoutTiming,
    image: PACKAGE_IMAGES.growth,
    icon: "leaf",
    accentGradient: "from-[var(--emerald)] to-[var(--emerald-mid)]",
    cardDescription:
      "Participate in Nigerian agricultural production, processing, and seasonal value chains supporting real economic growth.",
    keyBenefits: ["Agriculture-backed investments", "Seasonal production cycles", "Community economic impact"],
    bestFor: "Best for agriculture-focused investors.",
    whyChoose: "Ideal for members who believe in agriculture and food production.",
    ctaLabel: "Get Started"
  },
  {
    slug: "premium",
    title: "Alto Premium",
    subtitle: "Land Banking & Rental Property Cooperatives",
    displayOrder: 3,
    minNgn: 501_000,
    maxNgn: 5_000_000,
    weeklyRoiPercent: PLATFORM_PCT,
    weeklyRoiBps: PLATFORM_BPS,
    referralPercent: 6,
    payoutTiming: PLATFORM_EARNING.payoutTiming,
    image: PACKAGE_IMAGES.premium,
    icon: "home",
    accentGradient: "from-[var(--navy-mid)] to-[var(--navy)]",
    cardDescription:
      "Invest alongside premium land banking opportunities and income-generating real estate projects built for long-term wealth preservation.",
    keyBenefits: ["Asset-backed investments", "Property growth exposure", "Long-term wealth strategy"],
    bestFor: "Best for real estate investors.",
    whyChoose: "Ideal for members focused on long-term property and land-backed opportunities.",
    ctaLabel: "Get Started"
  },
  {
    slug: "elite",
    title: "Alto Elite",
    subtitle: "Foreign Exchange & Hard Currency Assets",
    displayOrder: 4,
    minNgn: 5_001_000,
    maxNgn: 50_000_000,
    weeklyRoiPercent: PLATFORM_PCT,
    weeklyRoiBps: PLATFORM_BPS,
    referralPercent: 5,
    payoutTiming: PLATFORM_EARNING.payoutTiming,
    image: PACKAGE_IMAGES.elite,
    icon: "briefcase",
    accentGradient: "from-[var(--gold)] to-amber-600",
    cardDescription:
      "Access diversified hard-currency investment opportunities designed to reduce local currency risk while preserving long-term purchasing power.",
    keyBenefits: ["Currency diversification", "Global asset exposure", "Elite portfolio allocation"],
    bestFor: "Best for global diversification.",
    whyChoose: "Ideal for members seeking hard-currency exposure and global diversification.",
    ctaLabel: "Get Started"
  }
];

export const PACKAGE_CONFIG_BY_SLUG = Object.fromEntries(
  PACKAGE_CONFIG.map((pkg) => [pkg.slug, pkg])
) as Record<PackageSlug, PackageConfig>;

export const PACKAGE_SLUGS: PackageSlug[] = [...PACKAGE_CONFIG]
  .sort((a, b) => a.displayOrder - b.displayOrder)
  .map((pkg) => pkg.slug);

/** @deprecated Prefer PLATFORM_EARNING — retained for marketing call sites. */
export const PACKAGE_ROI_RANGE = {
  minPercent: PLATFORM_EARNING.dailyReturnPercent,
  maxPercent: PLATFORM_EARNING.weeklyReturnPercent,
  dailyPercent: PLATFORM_EARNING.dailyReturnPercent,
  weeklyPercent: PLATFORM_EARNING.weeklyReturnPercent,
  headline: PLATFORM_EARNING.headlineDaily,
  weeklyHeadline: formatPlatformWeeklyCompat()
} as const;

function formatPlatformWeeklyCompat() {
  return `${PLATFORM_EARNING.weeklyReturnPercent}% weekly`;
}

export const GUARANTEED_RETURNS_TAGLINE = PLATFORM_EARNING.guarantee;

export function getPackageConfig(slug: string): PackageConfig | undefined {
  return PACKAGE_CONFIG_BY_SLUG[slug as PackageSlug];
}

export function getPackageTitle(slug: PackageSlug) {
  return getPackageConfig(slug)?.title ?? slug;
}

/** @deprecated Use getPackageConfig */
export const getTierConfig = getPackageConfig;

/** projected_daily from the platform earning engine. */
export function projectedDailyForPrincipal(principalNgn: number, _weeklyRoiBps?: number): number {
  return platformProjectedDaily(principalNgn);
}

export function weeklyInterestForAmount(amountNgn: number, _weeklyRoiBps?: number): number {
  return platformWeeklyInterest(amountNgn);
}

/** Official Platform Earning Model label — never product-specific ROI. */
export function formatWeeklyRoiLabel(_percent?: number) {
  return PLATFORM_EARNING.modelName;
}

export function formatPlatformReturnBadge() {
  return PLATFORM_EARNING.badgeLabel;
}

export function getReferralCommissionByPackage(): Record<PackageSlug, number> {
  return Object.fromEntries(PACKAGE_CONFIG.map((p) => [p.slug, p.referralPercent])) as Record<
    PackageSlug,
    number
  >;
}

/** Back-compat alias used across services and admin. */
export type PackageTierConfig = PackageConfig;
export const PACKAGE_TIER_CONFIG = PACKAGE_CONFIG;
