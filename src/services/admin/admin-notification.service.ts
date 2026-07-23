import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { AdminNotificationFilter } from "@/lib/admin-app/notification-events";
import { coerceAuditEntityId } from "@/lib/audit/entity-id";
import { logger } from "@/lib/logger";

type Client = SupabaseClient<Database>;

export type AdminNotificationRow = Database["public"]["Tables"]["admin_notifications"]["Row"];

const FILTER_TYPES: Record<Exclude<AdminNotificationFilter, "all">, string[]> = {
  registrations: ["member.registered"],
  logins: ["user.login"],
  investments: ["investment.created"],
  withdrawals: ["withdrawal.requested", "withdrawal.completed", "withdrawal.rejected"],
  deposits: ["deposit.submitted", "deposit.requested", "deposit.approved", "deposit.rejected"],
  system: [
    "settlement.completed",
    "admin.profile_updated",
    "system.error",
    "cron.failed",
    "payment.failed",
    "security.alert",
    "ops.reconcile_failed",
    "ops.deposit_stuck",
    "ops.withdrawal_stuck",
    "ops.referral_payout_stuck",
    "ops.duplicate_surge",
    "ops.queue_backlog"
  ]
};

export class AdminNotificationService {
  constructor(private readonly supabase: Client) {}

  /**
   * Secondary side effect — never throw. Callers use this after primary mutations.
   */
  async create(input: {
    eventType: string;
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      const { entityId } = coerceAuditEntityId(input.entityId);

      const { data, error } = await this.supabase
        .from("admin_notifications")
        .insert({
          event_type: input.eventType,
          title: input.title,
          body: input.body,
          entity_type: input.entityType ?? null,
          entity_id: entityId,
          metadata: (input.metadata ?? {}) as Json
        })
        .select("id")
        .single();
      if (error) {
        logger.error("Admin notification create failed (fail-soft)", {
          eventType: input.eventType,
          message: error.message,
          code: error.code
        });
        return null;
      }
      return data;
    } catch (error) {
      logger.error("Admin notification create failed (fail-soft)", {
        eventType: input.eventType,
        message: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  async list(limit = 40, unreadOnly = false, filter: AdminNotificationFilter | "payouts" = "all") {
    let query = this.supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) query = query.is("read_at", null);
    const resolvedFilter = filter === "payouts" ? "withdrawals" : filter;
    if (resolvedFilter !== "all") query = query.in("event_type", FILTER_TYPES[resolvedFilter]);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async markRead(ids: string[]) {
    if (ids.length === 0) return;
    const { error } = await this.supabase
      .from("admin_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw error;
  }

  async unreadCount() {
    const { count, error } = await this.supabase
      .from("admin_notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null);
    if (error) throw error;
    return count ?? 0;
  }
}

export class AdminPushSubscriptionService {
  constructor(private readonly supabase: Client) {}

  async upsert(input: {
    adminUserId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  }) {
    const { error } = await this.supabase.from("admin_push_subscriptions").upsert(
      {
        admin_user_id: input.adminUserId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        user_agent: input.userAgent ?? null
      },
      { onConflict: "admin_user_id,endpoint" }
    );
    if (error) throw error;
  }
}
