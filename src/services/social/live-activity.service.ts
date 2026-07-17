import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { LIVE_ACTIVITY_CONFIG } from "@/lib/social/live-activity-config";
import { buildFallbackActivities } from "@/lib/social/live-activity-fallback";
import {
  cityFromSeed,
  firstNameOnly,
  formatActivityNaira,
  sanitizeCity
} from "@/lib/social/live-activity-format";
import type { LiveActivity } from "@/lib/social/live-activity-types";

type Client = SupabaseClient<Database>;

function lookbackIso() {
  const ms = LIVE_ACTIVITY_CONFIG.lookbackDays * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

async function latestCityByUser(supabase: Client, userIds: string[]) {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;

  const { data } = await supabase
    .from("login_activity")
    .select("user_id, city, created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(200);

  for (const row of data ?? []) {
    if (map.has(row.user_id)) continue;
    if (row.city) map.set(row.user_id, row.city);
  }
  return map;
}

async function fetchJoined(supabase: Client): Promise<LiveActivity[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email_verified_at, created_at")
    .not("email_verified_at", "is", null)
    .gte("created_at", lookbackIso())
    .order("created_at", { ascending: false })
    .limit(LIVE_ACTIVITY_CONFIG.fetchLimitPerType);

  const rows = data ?? [];
  const cities = await latestCityByUser(
    supabase,
    rows.map((r) => r.id)
  );

  return rows.map((row) => ({
    id: `joined-${row.id}`,
    type: "joined" as const,
    firstName: firstNameOnly(row.full_name),
    city: sanitizeCity(cities.get(row.id), row.id),
    occurredAt: row.email_verified_at ?? row.created_at,
    source: "live" as const
  }));
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
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const [{ data: profiles }, cities] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", userIds),
    latestCityByUser(supabase, userIds)
  ]);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return rows.map((row) => ({
    id: `invested-${row.id}`,
    type: "invested" as const,
    firstName: firstNameOnly(nameById.get(row.user_id)),
    city: sanitizeCity(cities.get(row.user_id), row.user_id),
    amountLabel: formatActivityNaira(Number(row.amount)),
    occurredAt: row.started_at || row.created_at,
    source: "live" as const
  }));
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
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const [{ data: profiles }, cities] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", userIds),
    latestCityByUser(supabase, userIds)
  ]);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return rows.map((row) => ({
    id: `payout-${row.id}`,
    type: "payout" as const,
    firstName: firstNameOnly(nameById.get(row.user_id)),
    city: sanitizeCity(cities.get(row.user_id), row.user_id),
    amountLabel: formatActivityNaira(Number(row.amount)),
    occurredAt: row.reviewed_at ?? row.created_at,
    source: "live" as const
  }));
}

async function fetchReinvested(supabase: Client): Promise<LiveActivity[]> {
  // Paid settlements without a wallet credit are treated as compounded reinvestments.
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
  const [{ data: profiles }, cities] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", userIds),
    latestCityByUser(supabase, userIds)
  ]);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const activities: LiveActivity[] = [];
  for (const row of rows) {
    const userId = userByInvestment.get(row.investment_id);
    if (!userId) continue;
    activities.push({
      id: `reinvested-${row.id}`,
      type: "reinvested",
      firstName: firstNameOnly(nameById.get(userId)),
      city: sanitizeCity(cities.get(userId), userId),
      amountLabel: formatActivityNaira(Number(row.amount)),
      occurredAt: row.settled_at ?? row.created_at,
      source: "live"
    });
  }
  return activities;
}

function mergeUnique(activities: LiveActivity[]): LiveActivity[] {
  const seen = new Set<string>();
  const merged: LiveActivity[] = [];
  for (const item of activities) {
    if (seen.has(item.id)) continue;
    if (!item.firstName || item.firstName === "Member") {
      // Keep but soft-anonymize consistency
      item.firstName = item.firstName || "Member";
    }
    if (!item.city) item.city = cityFromSeed(item.id);
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
