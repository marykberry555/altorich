import type { ImageAsset } from "@/lib/images";
import { PACKAGE_IMAGES } from "@/lib/images";

/** Canonical package slugs — single source of truth. */
export type PackageSlug = "starter" | "growth" | "premium" | "elite";

export type PackageIcon = "piggy" | "leaf" | "home" | "briefcase";

/** Canonical Alto Rich package configuration — single source of truth. */
export type PackageConfig = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
  displayOrder: number;
  minNgn: number;
  maxNgn: number;
  /** Weekly ROI as a whole percent (e.g. 15 = 15%). */
  weeklyRoiPercent: number;
  /** Basis points for DB / settlement math. */
  weeklyRoiBps: number;
  referralPercent: number;
  payoutTiming: "Every Monday, 09:00 WAT";
  image: ImageAsset;
  icon: PackageIcon;
  /** Tailwind gradient classes for package accent bars. */
  accentGradient: string;
  /** Short marketing blurb for cards and listings. */
  cardDescription: string;
  /** Two to three bullets for compact package cards. */
  keyBenefits: string[];
  ctaLabel: string;
};

export const PACKAGE_CONFIG: PackageConfig[] = [
  {
    slug: "starter",
    title: "Alto Starter",
    subtitle: "High-Yield Savings & Fintech Lock Plans",
    displayOrder: 1,
    minNgn: 20_000,
    maxNgn: 100_000,
    weeklyRoiPercent: 15,
    weeklyRoiBps: 1500,
    referralPercent: 3,
    payoutTiming: "Every Monday, 09:00 WAT",
    image: PACKAGE_IMAGES.starter,
    icon: "piggy",
    accentGradient: "from-slate-500 to-slate-700",
    cardDescription:
      "Disciplined, fixed-term digital cooperative plans designed to shield your capital from daily inflation. Lock funds securely into high-yield savings pools with consistent payouts visible in your dashboard.",
    keyBenefits: ["Inflation hedging", "Transparent ledger", "Low complexity"],
    ctaLabel: "Get Started"
  },
  {
    slug: "growth",
    title: "Alto Growth",
    subtitle: "Agricultural Crowdfunding & Processing",
    displayOrder: 2,
    minNgn: 101_000,
    maxNgn: 500_000,
    weeklyRoiPercent: 20,
    weeklyRoiBps: 2000,
    referralPercent: 4,
    payoutTiming: "Every Monday, 09:00 WAT",
    image: PACKAGE_IMAGES.growth,
    icon: "leaf",
    accentGradient: "from-[var(--emerald)] to-[var(--emerald-mid)]",
    cardDescription:
      "Direct access to seasonal crop production, poultry cycles, and agro-processing operations. Benefit from structured agro-cycles aligned with real harvest timelines.",
    keyBenefits: ["Real-economy backing", "Harvest-aligned payouts", "Local impact"],
    ctaLabel: "Get Started"
  },
  {
    slug: "premium",
    title: "Alto Premium",
    subtitle: "Real Estate (Land & Property Banking)",
    displayOrder: 3,
    minNgn: 501_000,
    maxNgn: 5_000_000,
    weeklyRoiPercent: 30,
    weeklyRoiBps: 3000,
    referralPercent: 6,
    payoutTiming: "Every Monday, 09:00 WAT",
    image: PACKAGE_IMAGES.premium,
    icon: "home",
    accentGradient: "from-[var(--navy-mid)] to-[var(--navy)]",
    cardDescription:
      "Position your wealth in Nigeria's ultimate security asset. Participate in cooperative land banking and co-own premium rental developments optimized for stable cash flow.",
    keyBenefits: ["Asset-backed security", "Stable cash flow", "Premium tier access"],
    ctaLabel: "Get Started"
  },
  {
    slug: "elite",
    title: "Alto Elite",
    subtitle: "Foreign Exchange (USD & Hard Currency Assets)",
    displayOrder: 4,
    minNgn: 5_001_000,
    maxNgn: 50_000_000,
    weeklyRoiPercent: 25,
    weeklyRoiBps: 2500,
    referralPercent: 5,
    payoutTiming: "Every Monday, 09:00 WAT",
    image: PACKAGE_IMAGES.elite,
    icon: "briefcase",
    accentGradient: "from-[var(--gold)] to-amber-600",
    cardDescription:
      "Total capital preservation against local currency depreciation. Access fractional global assets and dollar-denominated programmes with priority performance reviews.",
    keyBenefits: ["Currency diversification", "Priority reviews", "Elite member access"],
    ctaLabel: "Get Started"
  }
];

export const PACKAGE_CONFIG_BY_SLUG = Object.fromEntries(
  PACKAGE_CONFIG.map((pkg) => [pkg.slug, pkg])
) as Record<PackageSlug, PackageConfig>;

export const PACKAGE_SLUGS: PackageSlug[] = PACKAGE_CONFIG.sort(
  (a, b) => a.displayOrder - b.displayOrder
).map((pkg) => pkg.slug);

export const PACKAGE_ROI_RANGE = {
  minPercent: Math.min(...PACKAGE_CONFIG.map((p) => p.weeklyRoiPercent)),
  maxPercent: Math.max(...PACKAGE_CONFIG.map((p) => p.weeklyRoiPercent)),
  headline: `${Math.min(...PACKAGE_CONFIG.map((p) => p.weeklyRoiPercent))}% to ${Math.max(...PACKAGE_CONFIG.map((p) => p.weeklyRoiPercent))}% weekly`
} as const;

export const GUARANTEED_RETURNS_TAGLINE = "Returns are guaranteed.";

export function getPackageConfig(slug: string): PackageConfig | undefined {
  return PACKAGE_CONFIG_BY_SLUG[slug as PackageSlug];
}

/** @deprecated Use getPackageConfig */
export const getTierConfig = getPackageConfig;

/** projected_daily for weekly settlement accrual display (weekly amount ÷ 7). */
export function projectedDailyForPrincipal(principalNgn: number, weeklyRoiBps: number): number {
  const weeklyAmount = (principalNgn * weeklyRoiBps) / 10_000;
  return weeklyAmount / 7;
}

export function weeklyInterestForAmount(amountNgn: number, weeklyRoiBps: number): number {
  return Math.round((amountNgn * weeklyRoiBps) / 10_000);
}

export function formatWeeklyRoiLabel(percent: number) {
  return `${percent}% weekly`;
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
