import type { PackageSlug } from "@/content/packages";

/** Canonical Alto Rich package economics — single source of truth. */
export type PackageTierConfig = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
  minNgn: number;
  maxNgn: number;
  /** Weekly ROI as a whole percent (e.g. 10 = 10%). */
  weeklyRoiPercent: number;
  /** Basis points for DB / settlement math. */
  weeklyRoiBps: number;
  payoutTiming: "Every Monday, 09:00 WAT";
};

export const PACKAGE_TIER_CONFIG: PackageTierConfig[] = [
  {
    slug: "starter",
    title: "Alto Starter",
    subtitle: "High-Yield Savings & Fintech Lock Plans",
    minNgn: 20_000,
    maxNgn: 100_000,
    weeklyRoiPercent: 10,
    weeklyRoiBps: 1000,
    payoutTiming: "Every Monday, 09:00 WAT"
  },
  {
    slug: "growth",
    title: "Alto Growth",
    subtitle: "Agricultural Crowdfunding & Processing",
    minNgn: 101_000,
    maxNgn: 500_000,
    weeklyRoiPercent: 15,
    weeklyRoiBps: 1500,
    payoutTiming: "Every Monday, 09:00 WAT"
  },
  {
    slug: "premium",
    title: "Alto Premium",
    subtitle: "Real Estate (Land & Property Banking)",
    minNgn: 501_000,
    maxNgn: 5_000_000,
    weeklyRoiPercent: 20,
    weeklyRoiBps: 2000,
    payoutTiming: "Every Monday, 09:00 WAT"
  },
  {
    slug: "elite",
    title: "Alto Elite",
    subtitle: "Foreign Exchange (USD & Hard Currency Assets)",
    minNgn: 5_001_000,
    maxNgn: 50_000_000,
    weeklyRoiPercent: 25,
    weeklyRoiBps: 2500,
    payoutTiming: "Every Monday, 09:00 WAT"
  }
];

export const PACKAGE_ROI_RANGE = {
  minPercent: 10,
  maxPercent: 25,
  headline: "10% to 25% weekly"
} as const;

export const GUARANTEED_RETURNS_TAGLINE = "Returns are guaranteed.";

export function getTierConfig(slug: string): PackageTierConfig | undefined {
  return PACKAGE_TIER_CONFIG.find((t) => t.slug === slug);
}

/** projected_daily for weekly settlement accrual display (weekly amount ÷ 7). */
export function projectedDailyForPrincipal(principalNgn: number, weeklyRoiBps: number): number {
  const weeklyAmount = (principalNgn * weeklyRoiBps) / 10_000;
  return weeklyAmount / 7;
}

export function weeklyInterestForAmount(amountNgn: number, weeklyRoiBps: number): number {
  return Math.round((amountNgn * weeklyRoiBps) / 10_000);
}
