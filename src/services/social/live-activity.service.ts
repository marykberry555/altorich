import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { LIVE_ACTIVITY_CONFIG } from "@/lib/social/live-activity-config";
import { buildFallbackActivities } from "@/lib/social/live-activity-fallback";
import {
  firstNameOnly,
  formatActivityNaira,
  resolveVerifiedLocation
} from "@/lib/social/live-activity-format";
import type { LiveActivity } from "@/lib/social/live-activity-types";

type Client = SupabaseClient<Database>;

type ProfileLocation = {
  id: string;
  full_name: string;
  location_state_code: string | null;
  location_city_area: string | null;
};

function lookbackIso() {
  const ms = LIVE_ACTIVITY_CONFIG.lookbackDays * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

function toActivityLocation(profile: ProfileLocation | undefined) {
  if (!profile) return null;
  return resolveVerifiedLocation(profile.location_state_code, profile.location_city_area);
}

async function profilesByIds(supabase: Client, userIds: string[]) {
  const map = new Map<string, ProfileLocation>();
  if (userIds.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, location_state_code, location_city_area")
    .in("id", userIds);
  for (const row of data ?? []) {
    map.set(row.id, row as ProfileLocation);
  }
  return map;
}

function buildActivity(input: {
  id: string;
  type: LiveActivity["type"];
  profile?: ProfileLocation;
  amount?: number;
  occurredAt: string;
}): LiveActivity | null {
  const loc = toActivityLocation(input.profile);
  // Never invent locations for real platform events.
  if (!loc || !input.profile) return null;

  return {
    id: input.id,
    type: input.type,
    firstName: firstNameOnly(input.profile.full_name),
    cityArea: loc.cityArea,
    stateCode: loc.stateCode,
    locationLabel: loc.locationLabel,
    amountLabel: input.amount != null ? formatActivityNaira(input.amount) : undefined,
    occurredAt: input.occurredAt,
    source: "live"
  };
}

async function fetchJoined(supabase: Client): Promise<LiveActivity[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email_verified_at, created_at, location_state_code, location_city_area")
    .not("email_verified_at", "is", null)
    .not("location_state_code", "is", null)
    .not("location_city_area", "is", null)
    .gte("created_at", lookbackIso())
    .order("created_at", { ascending: false })
    .limit(LIVE_ACTIVITY_CONFIG.fetchLimitPerType);

  return (data ?? [])
    .map((row) =>
      buildActivity({
        id: `joined-${row.id}`,
        type: "joined",
        profile: row as ProfileLocation,
        occurredAt: row.email_verified_at ?? row.created_at
      })
    )
    .filter((row): row is LiveActivity => Boolean(row));
}

async function fetchInvested(supabase: Client): Promise<LiveActivity[]> {
  const { data } = await supabase
    .from("investments")
    .select("id, user_id, amount, started_at, status, created_at")
    .in("status", ["active", "stopping", "stopped", "completed", "matured", "closed"])
    .gte("created_at", lookbackIso())
    .order("created_at", { ascending: false })
    .limit(LIVE_ACTIVITY_CONFIG.fetchLimitPerType);

  const rows = data ?? [];
  const profiles = await profilesByIds(
    supabase,
    [...new Set(rows.map((r) => r.user_id))]
  );

  return rows
    .map((row) =>
      buildActivity({
        id: `invested-${row.id}`,
        type: "invested",
        profile: profiles.get(row.user_id),
        amount: Number(row.amount),
        occurredAt: row.started_at || row.created_at
      })
    )
    .filter((row): row is LiveActivity => Boolean(row));
}

async function fetchPayouts(supabase: Client): Promise<LiveActivity[]> {
  const { data } = await supabase
    .from("withdrawals")
    .select("id, user_id, amount, status, reviewed_at, created_at")
    .eq("status", "paid")
    .gte("created_at", lookbackIso())
    .order("created_at", { ascending: false })
    .limit(LIVE_ACTIVITY_CONFIG.fetchLimitPerType);

  const rows = data ?? [];
  const profiles = await profilesByIds(
    supabase,
    [...new Set(rows.map((r) => r.user_id))]
  );

  return rows
    .map((row) =>
      buildActivity({
        id: `payout-${row.id}`,
        type: "payout",
        profile: profiles.get(row.user_id),
        amount: Number(row.amount),
        occurredAt: row.reviewed_at ?? row.created_at
      })
    )
    .filter((row): row is LiveActivity => Boolean(row));
}

async function fetchReinvested(supabase: Client): Promise<LiveActivity[]> {
  const { data: settlements } = await supabase
    .from("investment_settlements")
    .select("id, investment_id, amount, status, settled_at, wallet_transaction_id, created_at")
    .eq("status", "paid")
    .is("wallet_transaction_id", null)
    .gte("created_at", lookbackIso())
    .order("created_at", { ascending: false })
    .limit(LIVE_ACTIVITY_CONFIG.fetchLimitPerType);

  const rows = settlements ?? [];
  if (rows.length === 0) return [];

  const investmentIds = [...new Set(rows.map((r) => r.investment_id))];
  const { data: investments } = await supabase
    .from("investments")
    .select("id, user_id")
    .in("id", investmentIds);

  const userByInvestment = new Map((investments ?? []).map((i) => [i.id, i.user_id]));
  const userIds = [...new Set([...(investments ?? []).map((i) => i.user_id)])];
  const profiles = await profilesByIds(supabase, userIds);

  const activities: LiveActivity[] = [];
  for (const row of rows) {
    const userId = userByInvestment.get(row.investment_id);
    if (!userId) continue;
    const activity = buildActivity({
      id: `reinvested-${row.id}`,
      type: "reinvested",
      profile: profiles.get(userId),
      amount: Number(row.amount),
      occurredAt: row.settled_at ?? row.created_at
    });
    if (activity) activities.push(activity);
  }
  return activities;
}

function mergeUnique(activities: LiveActivity[]): LiveActivity[] {
  const seen = new Set<string>();
  const merged: LiveActivity[] = [];
  for (const item of activities) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

/**
 * Builds anonymized live activity feed from completed platform events,
 * padded with curated fallback when live volume is low.
 */
export async function getLiveActivities(supabase: Client): Promise<LiveActivity[]> {
  const now = Date.now();

  const settled = await Promise.allSettled([
    fetchJoined(supabase),
    fetchInvested(supabase),
    fetchPayouts(supabase),
    fetchReinvested(supabase)
  ]);

  const live: LiveActivity[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") live.push(...result.value);
  }

  const merged = mergeUnique(live);
  if (merged.length >= 8) return merged.slice(0, 48);

  const fallback = buildFallbackActivities(now).filter((f) => !merged.some((m) => m.id === f.id));
  return mergeUnique([...merged, ...fallback]).slice(0, 48);
}
