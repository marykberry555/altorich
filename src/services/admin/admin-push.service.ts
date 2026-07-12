import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  notificationHref,
  pushEligibleEventTypes,
  type AdminNotificationItem
} from "@/lib/admin-app/notification-events";

type Client = SupabaseClient<Database>;

export class AdminPushService {
  constructor(private readonly supabase: Client) {}

  shouldPush(eventType: string) {
    return (pushEligibleEventTypes() as readonly string[]).includes(eventType);
  }

  resolvePushUrl(notification: Pick<AdminNotificationItem, "event_type" | "entity_id" | "metadata">) {
    return notificationHref({
      id: "",
      event_type: notification.event_type,
      title: "",
      body: "",
      entity_type: null,
      entity_id: notification.entity_id,
      metadata: notification.metadata ?? {},
      read_at: null,
      created_at: ""
    });
  }

  async sendForNotification(input: {
    eventType: string;
    title: string;
    body: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const publicKey = process.env.ADMIN_VAPID_PUBLIC_KEY;
    const privateKey = process.env.ADMIN_VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return { sent: 0, skipped: "vapid_not_configured" as const };

    if (!this.shouldPush(input.eventType)) {
      return { sent: 0, skipped: "event_not_eligible" as const };
    }

    let webpush: typeof import("web-push");
    try {
      webpush = await import("web-push");
    } catch {
      return { sent: 0, skipped: "web_push_unavailable" as const };
    }

    webpush.setVapidDetails(`mailto:hello@altorich.com`, publicKey, privateKey);

    const { data: subs } = await this.supabase.from("admin_push_subscriptions").select("*");
    if (!subs?.length) return { sent: 0, skipped: "no_subscriptions" as const };

    const url = this.resolvePushUrl({
      event_type: input.eventType,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {}
    });

    const payload = JSON.stringify({
      title: input.title,
      body: input.body.split("\n").slice(0, 2).join(" · "),
      url,
      eventType: input.eventType
    });

    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          payload
        );
        sent += 1;
      } catch {
        // Expired subscriptions are cleaned up on next subscribe.
      }
    }

    return { sent };
  }

  /** Idempotent push dispatch for DB-triggered notifications. */
  async deliverPushForNotificationId(notificationId: string) {
    const { data: row, error } = await this.supabase
      .from("admin_notifications")
      .select("*")
      .eq("id", notificationId)
      .maybeSingle();

    if (error || !row) return { sent: 0, skipped: "not_found" as const };

    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    if (metadata.push_sent_at) return { sent: 0, skipped: "already_sent" as const };

    const result = await this.sendForNotification({
      eventType: row.event_type,
      title: row.title,
      body: row.body,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata
    });

    if (!metadata.push_sent_at) {
      await this.supabase
        .from("admin_notifications")
        .update({
          metadata: {
            ...metadata,
            push_sent_at: new Date().toISOString(),
            push_result: result
          }
        })
        .eq("id", notificationId);
    }

    return result;
  }
}

export async function dispatchAdminPush(
  supabase: Client,
  notification: {
    event_type: string;
    title: string;
    body: string;
    entity_type?: string | null;
    entity_id?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const push = new AdminPushService(supabase);
  return push.sendForNotification({
    eventType: notification.event_type,
    title: notification.title,
    body: notification.body,
    entityType: notification.entity_type,
    entityId: notification.entity_id,
    metadata: (notification.metadata ?? {}) as Record<string, unknown>
  });
}
