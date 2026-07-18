import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { clientIpFromHeaders } from "@/lib/auth/user-agent";
import { AdminNotificationService } from "@/services/admin/admin-notification.service";

type Client = SupabaseClient<Database>;

export async function recordSecurityEvent(
  supabase: Client,
  input: {
    eventType: string;
    userId?: string;
    request?: Request;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
    alertAdmins?: boolean;
  }
) {
  try {
    await supabase.from("security_events").insert({
      event_type: input.eventType,
      user_id: input.userId ?? null,
      ip_address: input.ipAddress ?? (input.request ? clientIpFromHeaders(input.request.headers) : null),
      metadata: (input.metadata ?? {}) as Json
    });

    if (input.alertAdmins === true) {
      const title = "Security alert";
      const body = `${input.eventType}${input.userId ? ` · member ${input.userId.slice(0, 8)}…` : ""}`;
      await new AdminNotificationService(supabase).create({
        eventType: "security.alert",
        title,
        body,
        entityType: "security_events",
        entityId: input.userId,
        metadata: {
          priority: "high",
          security_event_type: input.eventType,
          user_id: input.userId ?? null,
          ...(input.metadata ?? {})
        }
      });
    }
  } catch {
    // Non-blocking security telemetry.
  }
}
