import { NAIRA_SYMBOL } from "@/lib/domain";
import { LIVE_ACTIVITY_CITIES, LIVE_ACTIVITY_LABELS, type LiveActivityType } from "@/lib/social/live-activity-config";
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

/** Stable privacy-safe city when we lack a verified Nigerian locality. */
export function cityFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return LIVE_ACTIVITY_CITIES[hash % LIVE_ACTIVITY_CITIES.length];
}

export function sanitizeCity(raw: string | null | undefined, seed: string): string {
  const city = (raw ?? "").trim();
  if (!city) return cityFromSeed(seed);
  const lower = city.toLowerCase();
  // Drop anything that looks like an IP-derived foreign city dump or over-specific address
  if (/\d/.test(city) || city.length > 32) return cityFromSeed(seed);
  if (lower.includes("null") || lower === "unknown") return cityFromSeed(seed);
  const match = LIVE_ACTIVITY_CITIES.find((c) => c.toLowerCase() === lower);
  if (match) return match;
  // Title-case a short African-looking locality from geo, else fallback
  if (city.length >= 3 && city.length <= 24 && /^[A-Za-z\s'-]+$/.test(city)) {
    return city
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return cityFromSeed(seed);
}

export function randomInRange(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function isLiveActivityType(value: string): value is LiveActivityType {
  return value === "joined" || value === "invested" || value === "payout" || value === "reinvested";
}
