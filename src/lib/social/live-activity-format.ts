import { NAIRA_SYMBOL } from "@/lib/domain";
import { LIVE_ACTIVITY_LABELS, type LiveActivityType } from "@/lib/social/live-activity-config";
import {
  formatLocationLabel,
  formatPersonFromLocation,
  isNgStateCode,
  isValidCityForState,
  locationFromSeed,
  type NgStateCode
} from "@/lib/location/ng-locations";
import type { LiveActivity } from "@/lib/social/live-activity-types";

/** Whole-naira formatting for social proof (no kobo). */
export function formatActivityNaira(amount: number): string {
  const whole = Math.round(Math.abs(amount));
  return `${NAIRA_SYMBOL}${whole.toLocaleString("en-NG", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  })}`;
}

/** First token only — never expose surname. */
export function firstNameOnly(fullName: string | null | undefined): string {
  const raw = (fullName ?? "").trim();
  if (!raw) return "Member";
  const first = raw.split(/\s+/)[0]?.replace(/[^A-Za-zÀ-ÿ'-]/g, "") ?? "";
  if (!first) return "Member";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function activityActionLabel(activity: LiveActivity): string {
  return LIVE_ACTIVITY_LABELS[activity.type](activity.amountLabel);
}

/** "{Name} from {City}, {State}" — never invent for live rows without a profile location. */
export function activityPersonLine(activity: LiveActivity): string {
  return formatPersonFromLocation(activity.firstName, activity.stateCode, activity.cityArea);
}

export function formatRelativeTime(iso: string, nowMs = Date.now()): string {
  const occurred = new Date(iso).getTime();
  if (!Number.isFinite(occurred)) return "Just now";
  const diffSec = Math.max(1, Math.floor((nowMs - occurred) / 1000));
  if (diffSec < 60) return `${diffSec} second${diffSec === 1 ? "" : "s"} ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 48) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

export function resolveVerifiedLocation(
  stateCode: string | null | undefined,
  cityArea: string | null | undefined
): { stateCode: NgStateCode; cityArea: string; locationLabel: string } | null {
  if (!stateCode || !cityArea || !isNgStateCode(stateCode)) return null;
  if (!isValidCityForState(stateCode, cityArea)) return null;
  return {
    stateCode,
    cityArea,
    locationLabel: formatLocationLabel(stateCode, cityArea)
  };
}

/** Fallback-only seeded location — never used to invent live member cities. */
export function fallbackLocationFromSeed(seed: string) {
  const loc = locationFromSeed(seed);
  return {
    stateCode: loc.stateCode,
    cityArea: loc.cityArea,
    locationLabel: formatLocationLabel(loc.stateCode, loc.cityArea)
  };
}

export function randomInRange(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function isLiveActivityType(value: string): value is LiveActivityType {
  return value === "joined" || value === "invested" || value === "payout" || value === "reinvested";
}
