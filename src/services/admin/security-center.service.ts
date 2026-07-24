import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type SecurityCenterSnapshot = {
  failedLoginAttempts: Array<{
    id: string;
    user_id: string | null;
    ip_address: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  lockedAccounts: Array<{
    id: string;
    full_name: string;
    username: string | null;
    account_status: string;
    updated_at: string;
  }>;
  newDeviceLogins: Array<{
    id: string;
    user_id: string;
    member_name: string;
    device_type: string | null;
    browser: string | null;
    city: string | null;
    country: string | null;
    created_at: string;
  }>;
  adminLogins: Array<{
    id: string;
    member_name: string;
    city: string | null;
    country: string | null;
    created_at: string;
  }>;
  suspiciousActivity: Array<{
    id: string;
    event_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  recentPasswordChanges: Array<{ id: string; actor_id: string | null; created_at: string; metadata: Record<string, unknown> }>;
  recentPinChanges: Array<{ id: string; actor_id: string | null; created_at: string; metadata: Record<string, unknown> }>;
  recentEmailChanges: Array<{ id: string; actor_id: string | null; created_at: string; metadata: Record<string, unknown> }>;
  recentWithdrawals: Array<{ id: string; user_id: string; amount: number; status: string; created_at: string }>;
  recentFunding: Array<{ id: string; user_id: string; amount: number; status: string; created_at: string }>;
};

export class SecurityCenterService {
  constructor(private readonly supabase: Client) {}

  async getSnapshot(adminUserIds: string[]): Promise<SecurityCenterSnapshot> {
    const [
      failedRes,
      lockedRes,
      loginRes,
      securityRes,
      passwordRes,
      pinRes,
      emailRes,
      withdrawalsRes,
      depositsRes
    ] = await Promise.all([
      this.supabase
        .from("security_events")
        .select("*")
        .eq("event_type", "login.failed")
        .order("created_at", { ascending: false })
        .limit(30),
      this.supabase
        .from("profiles")
        .select("id, full_name, username, account_status, updated_at")
        .in("account_status", ["paused", "blocked"])
        .order("updated_at", { ascending: false })
        .limit(30),
      this.supabase
        .from("login_activity")
        .select("id, user_id, device_type, browser, city, country, created_at")
        .order("created_at", { ascending: false })
        .limit(80),
      this.supabase
        .from("security_events")
        .select("*")
        .neq("event_type", "login.failed")
        .order("created_at", { ascending: false })
        .limit(30),
      this.supabase
        .from("audit_logs")
        .select("id, actor_id, created_at, metadata")
        .ilike("action", "%password%")
        .order("created_at", { ascending: false })
        .limit(20),
      this.supabase
        .from("audit_logs")
        .select("id, actor_id, created_at, metadata")
        .ilike("action", "%pin%")
        .order("created_at", { ascending: false })
        .limit(20),
      this.supabase
        .from("audit_logs")
        .select("id, actor_id, created_at, metadata")
        .ilike("action", "%email%")
        .order("created_at", { ascending: false })
        .limit(20),
      this.supabase.from("withdrawals").select("id, user_id, amount, status, created_at").order("created_at", { ascending: false }).limit(20),
      this.supabase.from("deposits").select("id, user_id, amount, status, created_at").order("created_at", { ascending: false }).limit(20)
    ]);

    const loginRows = loginRes.data ?? [];
    const userIds = [...new Set(loginRows.map((r) => r.user_id))];
    const { data: profiles } = await this.supabase
      .from("profiles")
      .select("id, full_name, username")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const deviceFirstSeen = new Map<string, Set<string>>();
    const newDeviceLogins = loginRows.filter((row) => {
      const key = row.user_id;
      const devices = deviceFirstSeen.get(key) ?? new Set<string>();
      const fingerprint = `${row.device_type}:${row.browser}`;
      if (devices.has(fingerprint)) return false;
      devices.add(fingerprint);
      deviceFirstSeen.set(key, devices);
      return devices.size > 1 || devices.size === 1;
    }).slice(0, 20);

    const adminLogins = loginRows
      .filter((row) => adminUserIds.includes(row.user_id))
      .slice(0, 20)
      .map((row) => ({
        id: row.id,
        member_name: profileMap.get(row.user_id)?.full_name ?? profileMap.get(row.user_id)?.username ?? "Admin",
        city: row.city,
        country: row.country,
        created_at: row.created_at
      }));

    return {
      failedLoginAttempts: (failedRes.data ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        ip_address: row.ip_address as string | null,
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
        created_at: row.created_at
      })),
      lockedAccounts: (lockedRes.data ?? []).map((row) => ({
        id: row.id,
        full_name: row.full_name,
        username: row.username,
        account_status: row.account_status,
        updated_at: row.updated_at
      })),
      newDeviceLogins: newDeviceLogins.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        member_name: profileMap.get(row.user_id)?.full_name ?? profileMap.get(row.user_id)?.username ?? "Member",
        device_type: row.device_type,
        browser: row.browser,
        city: row.city,
        country: row.country,
        created_at: row.created_at
      })),
      adminLogins,
      suspiciousActivity: (securityRes.data ?? []).map((row) => ({
        id: row.id,
        event_type: row.event_type,
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
        created_at: row.created_at
      })),
      recentPasswordChanges: (passwordRes.data ?? []).map((row) => ({
        id: row.id,
        actor_id: row.actor_id,
        created_at: row.created_at,
        metadata: (row.metadata ?? {}) as Record<string, unknown>
      })),
      recentPinChanges: (pinRes.data ?? []).map((row) => ({
        id: row.id,
        actor_id: row.actor_id,
        created_at: row.created_at,
        metadata: (row.metadata ?? {}) as Record<string, unknown>
      })),
      recentEmailChanges: (emailRes.data ?? []).map((row) => ({
        id: row.id,
        actor_id: row.actor_id,
        created_at: row.created_at,
        metadata: (row.metadata ?? {}) as Record<string, unknown>
      })),
      recentWithdrawals: (withdrawalsRes.data ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        amount: Number(row.amount),
        status: row.status,
        created_at: row.created_at
      })),
      recentFunding: (depositsRes.data ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id ?? "",
        amount: Number(row.amount),
        status: row.status,
        created_at: row.created_at
      }))
    };
  }
}
