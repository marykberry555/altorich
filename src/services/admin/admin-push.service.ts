import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { adminAppPath } from "@/lib/admin-app/constants";

type Client = SupabaseClient<Database>;

const PUSH_EVENT_TYPES = new Set([
  "investment.created",
  "withdrawal.requested",
  "member.registered",
  "user.login",
  "deposit.requested",
  "wallet.large_credit"
]);

function isLargeAmount(metadata: Record<string, unknown>, threshold = 500_000) {
  const amount = Number(metadata.amount ?? metadata.investment_amount ?? 0);
  return amount >= threshold;
}

export class AdminPushService {
  constructor(private readonly supabase: Client) {}

  shouldPush(eventType: string, metadata: Record<string, unknown> = {}) {
    if (eventType === "investment.created" || eventType === "wallet.large_credit") {
      return isLargeAmount(metadata);
    }
    return PUSH_EVENT_TYPES.has(eventType);
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

    const metadata = input.metadata ?? {};
    if (!this.shouldPush(input.eventType, metadata)) {
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

    const payload = JSON.stringify({
      title: input.title,
      body: input.body,
      url: adminAppPath("/notifications"),
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
