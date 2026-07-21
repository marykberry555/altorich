import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { buildMemberSecurityTimeline } from "@/lib/trust/security-timeline";
import type { MemberSecuritySnapshot } from "@/lib/trust/types";

type Client = SupabaseClient<Database>;

function parseMetadata(metadata: Json): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  return metadata as Record<string, unknown>;
}

export class MemberSecurityService {
  constructor(private readonly supabase: Client) {}

  async getSnapshot(userId: string): Promise<MemberSecuritySnapshot> {
    const [
      profileRes,
      loginRes,
      securityRes,
      auditRes,
      withdrawalsRes,
      depositsRes,
      devicesRes
    ] = await Promise.all([
      this.supabase
        .from("profiles")
        .select("email_verified_at, updated_at, notification_preferences")
        .eq("id", userId)
        .maybeSingle(),
      this.supabase
        .from("login_activity")
        .select("id, created_at, browser, device_type, operating_system, ip_address, city, country")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25),
      this.supabase
        .from("security_events")
        .select("id, event_type, created_at, ip_address, metadata")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
      this.supabase
        .from("audit_logs")
        .select("id, action, created_at, metadata, actor_id")
        .or(`actor_id.eq.${userId},entity_id.eq.${userId},metadata->>user_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(40),
      this.supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15),
      this.supabase
        .from("deposits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15),
      this.supabase
        .from("trusted_devices")
        .select("id, device_name, browser, operating_system, country, last_seen_at, created_at")
        .eq("user_id", userId)
        .order("last_seen_at", { ascending: false })
    ]);

    const profile = profileRes.data;
    const prefs = (profile?.notification_preferences ?? {}) as Record<string, unknown>;
    const loginAlertsEnabled =
      typeof prefs.security_alerts === "boolean"
        ? prefs.security_alerts
        : typeof prefs.email === "boolean"
          ? prefs.email
          : null;

    const passwordAudit = (auditRes.data ?? []).find((row) =>
      row.action.toLowerCase().includes("password")
    );

    const timeline = buildMemberSecurityTimeline({
      userId,
      loginActivity: loginRes.data ?? [],
      securityEvents: (securityRes.data ?? []).map((row) => ({
        ...row,
        metadata: parseMetadata(row.metadata)
      })),
      auditLogs: (auditRes.data ?? []).map((row) => ({
        id: row.id,
        action: row.action,
        created_at: row.created_at,
        metadata: parseMetadata(row.metadata)
      })),
      withdrawals: withdrawalsRes.data ?? [],
      deposits: depositsRes.data ?? [],
      emailVerifiedAt: profile?.email_verified_at ?? null,
      limit: 120
    });

    return {
      emailVerified: Boolean(profile?.email_verified_at),
      emailVerifiedAt: profile?.email_verified_at ?? null,
      passwordLastChanged: passwordAudit?.created_at ?? null,
      loginAlertsEnabled,
      recentLogins: loginRes.data ?? [],
      trustedDevices: (devicesRes.data ?? []).map((d) => ({
        id: d.id,
        device_name: d.device_name,
        browser: d.browser,
        operating_system: d.operating_system,
        country: d.country,
        last_seen_at: d.last_seen_at,
        created_at: d.created_at
      })),
      activeSessionsAvailable: false,
      timeline
    };
  }
}
