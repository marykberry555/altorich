import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { parseUserAgent } from "@/lib/auth/user-agent";
import { AdminPushService } from "@/services/admin/admin-push.service";

type Client = SupabaseClient<Database>;

export type RecordLoginActivityInput = {
  userId: string;
  userAgent: string;
  ipAddress?: string;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
};

export class LoginActivityService {
  constructor(private readonly supabase: Client) {}

  async record(input: RecordLoginActivityInput) {
    const parsed = parseUserAgent(input.userAgent);

    const { data, error } = await this.supabase
      .from("login_activity")
      .insert({
        user_id: input.userId,
        ip_address: input.ipAddress ?? null,
        user_agent: input.userAgent,
        device_type: parsed.deviceType,
        browser: parsed.browser,
        operating_system: parsed.operatingSystem,
        city: input.city ?? null,
        region: input.region ?? null,
        country: input.country ?? null,
        isp: input.isp ?? null
      })
      .select("id, user_id, created_at")
      .single();

    if (error) throw error;

    const { data: profile } = await this.supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", input.userId)
      .maybeSingle();

    const memberName = profile?.full_name ?? "Member";
    const username = profile?.username ?? "";
    const locationParts = [input.city, input.region, input.country].filter(Boolean);
    const location = locationParts.join(", ");
    const loginTime = new Date(data.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

    const title = "Member Login";
    const body = [
      memberName,
      username ? `@${username}` : null,
      location || null,
      `${parsed.deviceType} · ${parsed.browser} · ${parsed.operatingSystem}`,
      loginTime
    ]
      .filter(Boolean)
      .join("\n");

    const metadata = {
      priority: "information",
      member_name: memberName,
      username,
      user_id: input.userId,
      city: input.city ?? null,
      region: input.region ?? null,
      country: input.country ?? null,
      device_type: parsed.deviceType,
      browser: parsed.browser,
      operating_system: parsed.operatingSystem,
      login_at: data.created_at
    };

    const { data: notification } = await this.supabase
      .from("admin_notifications")
      .insert({
        event_type: "user.login",
        title,
        body,
        entity_type: "login_activity",
        entity_id: data.id,
        metadata: metadata as Json
      })
      .select("id")
      .single();

    if (notification?.id) {
      void new AdminPushService(this.supabase).deliverPushForNotificationId(notification.id);
    }

    return data;
  }

  async listRecent(limit = 50) {
    const { data, error } = await this.supabase
      .from("login_activity")
      .select("id, user_id, ip_address, device_type, browser, operating_system, city, region, country, isp, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }
}

export async function recordLoginActivity(supabase: Client, input: RecordLoginActivityInput) {
  return new LoginActivityService(supabase).record(input);
}
