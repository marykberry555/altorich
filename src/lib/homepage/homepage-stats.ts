/** Admin-configurable homepage trust / persuasion statistics. */

import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";

export type HomepageStatsConfig = {
  /** Baseline verified members (grows daily from epoch). */
  verifiedMembers: number;
  verifiedMembersSuffix: string;
  verifiedMembersLabel: string;
  /** New members added across each Lagos day. */
  verifiedMembersDailyGrowth: number;
  /** YYYY-MM-DD — day 0 baseline for cumulative member growth. */
  membersGrowthEpoch: string;

  /** Daily climbing "Transacted Today" counter (NGN). */
  transactedTodayStart: number;
  transactedTodayTarget: number;
  transactedTodayMax: number;
  /** Extra Naira added to the day's floor each Lagos day since epoch. */
  transactedDailyFloorGrowth: number;
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
  verifiedMembersDailyGrowth: 120,
  membersGrowthEpoch: "2026-06-01",

  transactedTodayStart: 39_000_000,
  transactedTodayTarget: 52_000_000,
  transactedTodayMax: 95_000_000,
  transactedDailyFloorGrowth: 350_000,
  transactedTodayLabel: "Transacted Today",
  transactedTodaySuffix: "+",

  memberSatisfactionPercent: 98.7,
  memberSatisfactionLabel: "Member Satisfaction",

  platformAvailabilityPercent: 99.99,
  platformAvailabilityLabel: "Platform Availability",
  platformAvailabilitySupport: "Monitored infrastructure with published status updates.",

  wealthGrowthStart: 1,
  wealthGrowthTarget: 50_000_000,
  wealthGrowthSpeed: 1,
  wealthGrowthHeadline: "How Your Money Grows Daily",
  wealthGrowthDescription:
    "A disciplined allocation journey begins with clarity. This preview shows how consistent participation can compound — not a promise of future results.",
  wealthGrowthSupport: "Illustrative only · Resets daily for demo purposes",

  calculatorMinInvestment: 30_000,
  calculatorDailyRatePercent: PLATFORM_EARNING.dailyReturnPercent,
  calculatorWeeklyRatePercent: PLATFORM_EARNING.weeklyReturnPercent,
  calculatorTitle: "Portfolio calculator",
  calculatorDescription:
    "Select a portfolio and amount to see illustrative projections based on published portfolio parameters.",
  calculatorDisclaimer:
    "Illustrative only. Not financial advice. Review portfolio terms before allocating.",

  opsGraphSpeed: 1,
  opsGraphBaseline: 0.42,
  opsGraphFluctuation: 0.08,
  opsStatusLabel: "Active",
  opsHeadline: "Operational overview",
  opsDescription:
    "A visual summary of platform activity — for context only. Visit the Transparency Center for published metrics.",

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
    verifiedMembersDailyGrowth: positiveInt(
      partial.verifiedMembersDailyGrowth,
      DEFAULT_HOMEPAGE_STATS.verifiedMembersDailyGrowth
    ),
    membersGrowthEpoch:
      typeof partial.membersGrowthEpoch === "string" && /^\d{4}-\d{2}-\d{2}$/.test(partial.membersGrowthEpoch)
        ? partial.membersGrowthEpoch
        : DEFAULT_HOMEPAGE_STATS.membersGrowthEpoch,
    transactedTodayStart: positiveInt(partial.transactedTodayStart, DEFAULT_HOMEPAGE_STATS.transactedTodayStart),
    transactedTodayTarget: positiveInt(partial.transactedTodayTarget, DEFAULT_HOMEPAGE_STATS.transactedTodayTarget),
    transactedTodayMax: positiveInt(partial.transactedTodayMax, DEFAULT_HOMEPAGE_STATS.transactedTodayMax),
    transactedDailyFloorGrowth: positiveInt(
      partial.transactedDailyFloorGrowth,
      DEFAULT_HOMEPAGE_STATS.transactedDailyFloorGrowth
    ),
    wealthGrowthStart: Math.max(1, positiveInt(partial.wealthGrowthStart, DEFAULT_HOMEPAGE_STATS.wealthGrowthStart)),
    wealthGrowthTarget: Math.min(
      50_000_000,
      positiveInt(partial.wealthGrowthTarget, DEFAULT_HOMEPAGE_STATS.wealthGrowthTarget)
    ),
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
  const nowAsUtcWall = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss, now.getMilliseconds());
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

/** Whole Lagos calendar days elapsed since epoch (YYYY-MM-DD), floored at 0. */
export function lagosDaysSinceEpoch(epochYmd: string, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(epochYmd);
  if (!match) return 0;
  const epochY = Number(match[1]);
  const epochM = Number(match[2]);
  const epochD = Number(match[3]);
  const p = lagosParts(now);
  const epochUtc = Date.UTC(epochY, epochM - 1, epochD);
  const todayUtc = Date.UTC(p.y, p.m - 1, p.d);
  return Math.max(0, Math.floor((todayUtc - epochUtc) / (24 * 60 * 60 * 1000)));
}

/**
 * Verified members — cumulative growth every Lagos day (never resets downward).
 * Within the current day the count also climbs toward today's daily growth.
 */
export function verifiedMembersValueAt(
  config: Pick<
    HomepageStatsConfig,
    | "verifiedMembers"
    | "verifiedMembersDailyGrowth"
    | "membersGrowthEpoch"
    | "resetHourLagos"
    | "resetMinuteLagos"
  >,
  now = new Date()
) {
  const days = lagosDaysSinceEpoch(config.membersGrowthEpoch, now);
  const { progress } = getLagosDailyWindow(config.resetHourLagos, config.resetMinuteLagos, now);
  const completed = days * config.verifiedMembersDailyGrowth;
  const todayPortion = Math.round(config.verifiedMembersDailyGrowth * progress);
  return config.verifiedMembers + completed + todayPortion;
}

/**
 * Transacted today — climbs through the Lagos day.
 * Each new day starts higher by `transactedDailyFloorGrowth` so totals grow every day.
 */
export function transactedTodayValueAt(
  config: Pick<
    HomepageStatsConfig,
    | "transactedTodayStart"
    | "transactedTodayTarget"
    | "transactedTodayMax"
    | "transactedDailyFloorGrowth"
    | "membersGrowthEpoch"
    | "resetHourLagos"
    | "resetMinuteLagos"
  >,
  now = new Date()
) {
  const days = lagosDaysSinceEpoch(config.membersGrowthEpoch, now);
  const lift = days * config.transactedDailyFloorGrowth;
  const dayStart = Math.min(config.transactedTodayMax, config.transactedTodayStart + lift);
  const span = Math.max(0, config.transactedTodayTarget - config.transactedTodayStart);
  const dayTarget = Math.min(config.transactedTodayMax, dayStart + span);
  const { progress } = getLagosDailyWindow(config.resetHourLagos, config.resetMinuteLagos, now);
  return interpolateDailyNaira(dayStart, dayTarget, config.transactedTodayMax, progress, false);
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
 * Wealth counter: ₦1 → target over the Lagos day (09:00 → 08:59 next day).
 * Hard-capped at ₦50,000,000.
 */
export function wealthGrowthValueAt(
  config: Pick<
    HomepageStatsConfig,
    "wealthGrowthStart" | "wealthGrowthTarget" | "wealthGrowthSpeed" | "resetHourLagos" | "resetMinuteLagos"
  >,
  now = new Date()
) {
  const WEALTH_HARD_CAP = 50_000_000;
  const { progress } = getLagosDailyWindow(config.resetHourLagos, config.resetMinuteLagos, now);
  const t = Math.min(1, Math.max(0, progress));
  const start = Math.max(1, config.wealthGrowthStart);
  const target = Math.min(WEALTH_HARD_CAP, Math.max(start, config.wealthGrowthTarget));
  const raw = start + (target - start) * t;
  return Math.min(target, Math.max(start, raw));
}

/** Naira + kobo increase expected each second for the wealth counter. */
export function wealthGrowthPerSecond(
  config: Pick<HomepageStatsConfig, "wealthGrowthStart" | "wealthGrowthTarget" | "wealthGrowthSpeed">
) {
  const range = Math.max(0, config.wealthGrowthTarget - config.wealthGrowthStart);
  return range / 86_400;
}

export type EarningsProjection = {
  principal: number;
  today: number;
  weekly: number;
  monthly: number;
  /** Medium-term: weekly × 13 (same engine as monthly/annual). */
  threeMonth: number;
  /** Medium-term: weekly × 26 (same engine as monthly/annual). */
  sixMonth: number;
  annual: number;
};

/** Illustrative projections from portfolio config rates (headline via PLATFORM_EARNING). */
export function projectEarnings(
  principal: number,
  dailyRatePercent: number,
  weeklyRatePercent: number
): EarningsProjection {
  const safe = Math.max(0, principal);
  const today = Math.round((safe * dailyRatePercent) / 100);
  const weekly = Math.round((safe * weeklyRatePercent) / 100);
  const monthly = weekly * 4;
  const threeMonth = weekly * 13;
  const sixMonth = weekly * 26;
  const annual = weekly * 52;
  return { principal: safe, today, weekly, monthly, threeMonth, sixMonth, annual };
}

export function formatNairaCounter(amount: number) {
  const safe = Math.max(0, Math.round(amount));
  return `₦${safe.toLocaleString("en-NG")}`;
}

/** Live counter format with kobo so growth is visible every tick. */
export function formatNairaWithKobo(amount: number) {
  const safe = Math.max(0, amount);
  return `₦${safe.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
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
