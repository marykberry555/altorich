import { LIVE_ACTIVITY_CONFIG } from "@/lib/social/live-activity-config";
import { buildFallbackActivities } from "@/lib/social/live-activity-fallback";
import type { LiveActivity, LiveActivityApiResponse } from "@/lib/social/live-activity-types";

type CacheEntry = {
  activities: LiveActivity[];
  fetchedAt: number;
};

let memoryCache: CacheEntry | null = null;
let inflight: Promise<LiveActivity[]> | null = null;

function isValidActivity(value: unknown): value is LiveActivity {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.type === "string" &&
    typeof row.firstName === "string" &&
    typeof row.cityArea === "string" &&
    typeof row.stateCode === "string" &&
    typeof row.locationLabel === "string" &&
    typeof row.occurredAt === "string" &&
    (row.source === "live" || row.source === "fallback")
  );
}

async function fetchFromApi(): Promise<LiveActivity[]> {
  const res = await fetch("/api/social/live-activity", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "default"
  });
  if (!res.ok) throw new Error(`live-activity ${res.status}`);
  const body = (await res.json()) as LiveActivityApiResponse;
  const activities = Array.isArray(body.activities) ? body.activities.filter(isValidActivity) : [];
  return activities.length > 0 ? activities : buildFallbackActivities();
}

/** Cached activity feed — one network round-trip until TTL expires. */
export async function loadLiveActivities(force = false): Promise<LiveActivity[]> {
  const now = Date.now();
  if (!force && memoryCache && now - memoryCache.fetchedAt < LIVE_ACTIVITY_CONFIG.clientCacheTtlMs) {
    return memoryCache.activities;
  }

  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const activities = await fetchFromApi();
      memoryCache = { activities, fetchedAt: Date.now() };
      return activities;
    } catch {
      const fallback = buildFallbackActivities();
      memoryCache = { activities: fallback, fetchedAt: Date.now() };
      return fallback;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function pickNextActivity(
  pool: LiveActivity[],
  seenIds: Set<string>
): LiveActivity | null {
  const available = pool.filter((a) => !seenIds.has(a.id));
  if (available.length === 0) return null;
  const index = Math.floor(Math.random() * available.length);
  return available[index] ?? null;
}
