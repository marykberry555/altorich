import { LIVE_ACTIVITY_CONFIG } from "@/lib/social/live-activity-config";

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function readJsonArray(key: string): string[] {
  if (!canUseSessionStorage()) return [];
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, value: string[]) {
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private mode failures
  }
}

export function getShownCount(): number {
  if (!canUseSessionStorage()) return 0;
  const raw = sessionStorage.getItem(LIVE_ACTIVITY_CONFIG.storageKeys.shownCount);
  const n = Number(raw ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function incrementShownCount(): number {
  const next = getShownCount() + 1;
  if (canUseSessionStorage()) {
    sessionStorage.setItem(LIVE_ACTIVITY_CONFIG.storageKeys.shownCount, String(next));
  }
  return next;
}

export function getSeenActivityIds(): Set<string> {
  return new Set(readJsonArray(LIVE_ACTIVITY_CONFIG.storageKeys.seenIds));
}

export function markActivitySeen(id: string) {
  const seen = getSeenActivityIds();
  seen.add(id);
  writeJsonArray(LIVE_ACTIVITY_CONFIG.storageKeys.seenIds, [...seen]);
}

export function sessionLimitReached(): boolean {
  return getShownCount() >= LIVE_ACTIVITY_CONFIG.maxPerSession;
}
