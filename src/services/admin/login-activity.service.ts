import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { parseUserAgent } from "@/lib/auth/user-agent";

type Client = SupabaseClient<Database>;

export type RecordLoginActivityInput = {
  userId: string;
  userAgent: string;
  ipAddress?: string;
  city?: string;
  country?: string;
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
        country: input.country ?? null
      })
      .select("id, user_id, created_at")
      .single();

    if (error) throw error;

    const { data: profile } = await this.supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", input.userId)
      .maybeSingle();

    const label = profile?.full_name ?? profile?.username ?? "Member";
    const location = [input.city, input.country].filter(Boolean).join(", ");

    await this.supabase.from("admin_notifications").insert({
      event_type: "user.login",
      title: "Successful login",
      body: `${label} signed in${location ? ` · ${location}` : ""}`,
      entity_type: "login_activity",
      entity_id: data.id,
      metadata: {
        user_id: input.userId,
        device_type: parsed.deviceType,
        browser: parsed.browser,
        operating_system: parsed.operatingSystem
      }
    });

    return data;
  }

  async listRecent(limit = 50) {
    const { data, error } = await this.supabase
      .from("login_activity")
      .select("id, user_id, ip_address, device_type, browser, operating_system, city, country, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }
}

export async function recordLoginActivity(
  supabase: Client,
  input: RecordLoginActivityInput
) {
  return new LoginActivityService(supabase).record(input);
}
