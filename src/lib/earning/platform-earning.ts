/**
 * Alto Rich Platform Earning Model.
 * Every active investment uses this model — sectors only allocate capital.
 */
export const PLATFORM_EARNING = {
  /** Official product name for the unified earning engine. */
  modelName: "Platform Earning Model",
  /** Daily return rate as a whole percent (e.g. 5 = 5%). */
  dailyReturnPercent: 5,
  /** Weekly equivalent (daily × 7). */
  weeklyReturnPercent: 35,
  /** Basis points for settlement / ticker math (3500 = 35%). */
  weeklyRoiBps: 3500,
  payoutTiming: "Every Monday, 09:00 WAT" as const,
  settlementScheduleLabel: "Settlement Schedule",
  nextSettlementLabel: "Next Monday Settlement",
  currentDailyRateLabel: "Current Daily Rate",
  currentWeeklyEquivalentLabel: "Current Weekly Equivalent",
  /** Footer line for sector cards. */
  poweredByLabel: "Powered by Alto Rich's Platform Earning Model.",
  /** Primary public headline. */
  headlineDaily: "Earn Up To 5% Daily",
  headlineWeekly: "35% weekly equivalent",
  /** Compact chip — no ROI badge language. */
  badgeLabel: "Platform Earning Model",
  guarantee: "Returns are guaranteed.",
  /** @deprecated Prefer poweredByLabel / modelName */
  productReturnLabel: "Powered by Alto Rich's Platform Earning Model."
} as const;

export type PlatformEarning = typeof PLATFORM_EARNING;

/** Weekly interest for a principal using the platform engine. */
export function platformWeeklyInterest(principalNgn: number): number {
  return Math.round((Math.abs(principalNgn) * PLATFORM_EARNING.weeklyRoiBps) / 10_000);
}

/** Daily interest equivalent (weekly ÷ 7). */
export function platformDailyInterest(principalNgn: number): number {
  return platformWeeklyInterest(principalNgn) / 7;
}

/** projected_daily column helper for settlement schedules. */
export function platformProjectedDaily(principalNgn: number): number {
  return Math.round(platformDailyInterest(principalNgn) * 100) / 100;
}

export function formatPlatformDailyLabel(): string {
  return `${PLATFORM_EARNING.dailyReturnPercent}% daily`;
}

export function formatPlatformWeeklyLabel(): string {
  return `${PLATFORM_EARNING.weeklyReturnPercent}% weekly`;
}

export function formatCurrentDailyRate(): string {
  return `Up to ${PLATFORM_EARNING.dailyReturnPercent}%`;
}

export function formatCurrentWeeklyEquivalent(): string {
  return `${PLATFORM_EARNING.weeklyReturnPercent}% weekly`;
}
