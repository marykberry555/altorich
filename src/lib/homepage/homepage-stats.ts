/** Admin-configurable homepage trust / persuasion statistics. */

import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";

export type HomepageStatsConfig = {
  /** Displayed as "55,000+" */
  verifiedMembers: number;
  verifiedMembersSuffix: string;
  verifiedMembersLabel: string;

  /** Daily climbing "Transacted Today" counter (NGN). */
  transactedTodayStart: number;
  transactedTodayTarget: number;
  transactedTodayMax: number;
  transactedTodayLabel: string;
  transactedTodaySuffix: string;

  /** e.g. 98.7 */
  memberSatisfactionPercent: number;
  memberSatisfactionLabel: string;

  /** e.g. 99.99 */
  platformAvailabilityPercent: number;
  platformAvailabilityLabel: string;
  platformAvailabilitySupport: string;

  /** Wealth growth showcase counter (NGN). */
  wealthGrowthStart: number;
  wealthGrowthTarget: number;
  /** Visual pacing — 1 = full day to reach target; >1 reaches earlier. */
  wealthGrowthSpeed: number;
  wealthGrowthHeadline: string;
  wealthGrowthDescription: string;
  wealthGrowthSupport: string;

  /** Earnings calculator. */
  calculatorMinInvestment: number;
  calculatorDailyRatePercent: number;
  calculatorWeeklyRatePercent: number;
  calculatorTitle: string;
  calculatorDescription: string;
  calculatorDisclaimer: string;

  /** Live operations graph. */
  opsGraphSpeed: number;
  opsGraphBaseline: number;
  opsGraphFluctuation: number;
  opsStatusLabel: string;
  opsHeadline: string;
  opsDescription: string;

  /** Daily reset in Africa/Lagos. */
  resetHourLagos: number;
  resetMinuteLagos: number;

  /**
   * Future metrics without schema changes.
   * Each entry: { key, label, value, format?: "number" | "percent" | "naira" | "text" }
   */
  extras: Array<{
    key: string;
    label: string;
    value: number | string;
    format?: "number" | "percent" | "naira" | "text";
    suffix?: string;
  }>;
};

export const DEFAULT_HOMEPAGE_STATS: HomepageStatsConfig = {
  verifiedMembers: 55_000,
  verifiedMembersSuffix: "+",
  verifiedMembersLabel: "Verified Members",

  transactedTodayStart: 39_000_000,
  transactedTodayTarget: 52_000_000,
  transactedTodayMax: 75_000_000,
  transactedTodayLabel: "Transacted Today",
  transactedTodaySuffix: "+",

  memberSatisfactionPercent: 98.7,
  memberSatisfactionLabel: "Member Satisfaction",

  platformAvailabilityPercent: 99.99,
  platformAvailabilityLabel: "Platform Availability",
  platformAvailabilitySupport: "Secure. Reliable. Always Ready.",

  wealthGrowthStart: 1,
  wealthGrowthTarget: 50_000_000,
  wealthGrowthSpeed: 1,
  wealthGrowthHeadline: "Growing with Discipline",
  wealthGrowthDescription:
    "Every great investment journey begins with a single naira. Watch how disciplined investing can grow over time.",
  wealthGrowthSupport: "Resets daily at 09:00 Africa/Lagos · Illustrative growth journey",

  calculatorMinInvestment: 20_000,
  calculatorDailyRatePercent: PLATFORM_EARNING.dailyReturnPercent,
  calculatorWeeklyRatePercent: PLATFORM_EARNING.weeklyReturnPercent,
  calculatorTitle: "See How Your Investment Can Grow",
  calculatorDescription:
    "Enter your intended investment amount to preview earnings using Alto Rich's current Platform Earning Model.",
  calculatorDisclaimer:
    "Illustrative estimates based on the current Platform Earning Model. Calculations update automatically whenever the Platform Earning Model changes.",

  opsGraphSpeed: 1,
  opsGraphBaseline: 0.42,
  opsGraphFluctuation: 0.08,
  opsStatusLabel: "Active",
  opsHeadline: "Live Operations",
  opsDescription:
    "Alto Rich continuously allocates capital across professionally managed investment sectors.",

  resetHourLagos: 9,
  resetMinuteLagos: 0,

  extras: []
};

export const HOMEPAGE_STATS_SETTINGS_KEY = "homepage_stats" as const;

export function mergeHomepageStats(partial?: Partial<HomepageStatsConfig> | null): HomepageStatsConfig {
  if (!partial) return { ...DEFAULT_HOMEPAGE_STATS, extras: [] };

  const extras = Array.isArray(partial.extras) ? partial.extras : DEFAULT_HOMEPAGE_STATS.extras;

  return {
    ...DEFAULT_HOMEPAGE_STATS,
    ...partial,
    extras,
    verifiedMembers: positiveInt(partial.verifiedMembers, DEFAULT_HOMEPAGE_STATS.verifiedMembers),
    transactedTodayStart: positiveInt(partial.transactedTodayStart, DEFAULT_HOMEPAGE_STATS.transactedTodayStart),
    transactedTodayTarget: positiveInt(partial.transactedTodayTarget, DEFAULT_HOMEPAGE_STATS.transactedTodayTarget),
    transactedTodayMax: positiveInt(partial.transactedTodayMax, DEFAULT_HOMEPAGE_STATS.transactedTodayMax),
    wealthGrowthStart: Math.max(1, positiveInt(partial.wealthGrowthStart, DEFAULT_HOMEPAGE_STATS.wealthGrowthStart)),
    wealthGrowthTarget: positiveInt(partial.wealthGrowthTarget, DEFAULT_HOMEPAGE_STATS.wealthGrowthTarget),
    wealthGrowthSpeed: clamp(
      Number(partial.wealthGrowthSpeed ?? DEFAULT_HOMEPAGE_STATS.wealthGrowthSpeed),
      0.25,
      4
    ),
    calculatorMinInvestment: positiveInt(
      partial.calculatorMinInvestment,
      DEFAULT_HOMEPAGE_STATS.calculatorMinInvestment
    ),
    calculatorDailyRatePercent: clamp(
      Number(partial.calculatorDailyRatePercent ?? DEFAULT_HOMEPAGE_STATS.calculatorDailyRatePercent),
      0,
      100
    ),
    calculatorWeeklyRatePercent: clamp(
      Number(partial.calculatorWeeklyRatePercent ?? DEFAULT_HOMEPAGE_STATS.calculatorWeeklyRatePercent),
      0,
      1000
    ),
    opsGraphSpeed: clamp(Number(partial.opsGraphSpeed ?? DEFAULT_HOMEPAGE_STATS.opsGraphSpeed), 0.25, 3),
    opsGraphBaseline: clamp(
      Number(partial.opsGraphBaseline ?? DEFAULT_HOMEPAGE_STATS.opsGraphBaseline),
      0.05,
      0.9
    ),
    opsGraphFluctuation: clamp(
      Number(partial.opsGraphFluctuation ?? DEFAULT_HOMEPAGE_STATS.opsGraphFluctuation),
      0.01,
      0.25
    ),
    memberSatisfactionPercent: clamp(
      Number(partial.memberSatisfactionPercent ?? DEFAULT_HOMEPAGE_STATS.memberSatisfactionPercent),
      0,
      100
    ),
    platformAvailabilityPercent: clamp(
      Number(partial.platformAvailabilityPercent ?? DEFAULT_HOMEPAGE_STATS.platformAvailabilityPercent),
      0,
      100
    ),
    resetHourLagos: clampInt(partial.resetHourLagos, 0, 23, DEFAULT_HOMEPAGE_STATS.resetHourLagos),
    resetMinuteLagos: clampInt(partial.resetMinuteLagos, 0, 59, DEFAULT_HOMEPAGE_STATS.resetMinuteLagos)
  };
}

function positiveInt(value: unknown, fallback: number) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Ease-in-out cubic — smooth counting without hard jumps. */
export function easeInOutCubic(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

type LagosParts = { y: number; m: number; d: number; hh: number; mm: number; ss: number };

function lagosParts(date: Date): LagosParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour"), mm: get("minute"), ss: get("second") };
}

/**
 * Current daily window anchored at reset time Africa/Lagos.
 * Returns progress 0→1 through the 24h cycle (eased separately by callers).
 */
export function getLagosDailyWindow(
  resetHour: number,
  resetMinute: number,
  now = new Date()
): { startMs: number; endMs: number; progress: number; elapsedMs: number; durationMs: number } {
  const p = lagosParts(now);
  const nowAsUtcWall = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  let startAsUtcWall = Date.UTC(p.y, p.m - 1, p.d, resetHour, resetMinute, 0);

  if (nowAsUtcWall < startAsUtcWall) {
    startAsUtcWall -= 24 * 60 * 60 * 1000;
  }

  const endAsUtcWall = startAsUtcWall + 24 * 60 * 60 * 1000;
  const durationMs = endAsUtcWall - startAsUtcWall;
  const elapsedMs = Math.min(durationMs, Math.max(0, nowAsUtcWall - startAsUtcWall));
  const progress = durationMs > 0 ? elapsedMs / durationMs : 0;

  const skew = now.getTime() - nowAsUtcWall;
  return {
    startMs: startAsUtcWall + skew,
    endMs: endAsUtcWall + skew,
    progress,
    elapsedMs,
    durationMs
  };
}

/** Linear interpolation clamped to max. */
export function interpolateDailyNaira(
  start: number,
  target: number,
  max: number,
  progress: number,
  eased = true
) {
  const t = eased ? easeInOutCubic(progress) : Math.min(1, Math.max(0, progress));
  const raw = start + (target - start) * t;
  return Math.min(max, Math.max(start, Math.round(raw)));
}

/**
 * Wealth counter value for the current Lagos day.
 * Linear by default so the figure keeps ticking while the visitor stays on the page.
 */
export function wealthGrowthValueAt(
  config: Pick<
    HomepageStatsConfig,
    "wealthGrowthStart" | "wealthGrowthTarget" | "wealthGrowthSpeed" | "resetHourLagos" | "resetMinuteLagos"
  >,
  now = new Date()
) {
  const { progress } = getLagosDailyWindow(config.resetHourLagos, config.resetMinuteLagos, now);
  const paced = Math.min(1, Math.max(0, progress * config.wealthGrowthSpeed));
  return interpolateDailyNaira(
    config.wealthGrowthStart,
    config.wealthGrowthTarget,
    config.wealthGrowthTarget,
    paced,
    false
  );
}

export type EarningsProjection = {
  principal: number;
  today: number;
  weekly: number;
  monthly: number;
  annual: number;
};

/** Illustrative projections from the Platform Earning Model rates. */
export function projectEarnings(
  principal: number,
  dailyRatePercent: number,
  weeklyRatePercent: number
): EarningsProjection {
  const safe = Math.max(0, principal);
  const today = Math.round((safe * dailyRatePercent) / 100);
  const weekly = Math.round((safe * weeklyRatePercent) / 100);
  const monthly = today * 30;
  const annual = today * 365;
  return { principal: safe, today, weekly, monthly, annual };
}

export function formatNairaCounter(amount: number) {
  const safe = Math.max(0, Math.round(amount));
  return `₦${safe.toLocaleString("en-NG")}`;
}

export function formatMembersCount(count: number, suffix = "+") {
  return `${count.toLocaleString("en-NG")}${suffix}`;
}

export function formatPercentDisplay(value: number) {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
  return `${text}%`;
}

/** Public JSON-safe payload for the homepage / API. */
export type HomepageStatsPublic = HomepageStatsConfig;
