import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { clientIpFromHeaders } from "@/lib/auth/user-agent";

type Client = SupabaseClient<Database>;

export async function recordSecurityEvent(
  supabase: Client,
  input: {
    eventType: string;
    userId?: string;
    request?: Request;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("security_events").insert({
      event_type: input.eventType,
      user_id: input.userId ?? null,
      ip_address: input.ipAddress ?? (input.request ? clientIpFromHeaders(input.request.headers) : null),
      metadata: (input.metadata ?? {}) as Json
    });
  } catch {
    // Non-blocking security telemetry.
  }
}
