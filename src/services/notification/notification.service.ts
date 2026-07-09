import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { logger } from "@/lib/logger";

export type NotificationPayload = {
  userId: string;
  title: string;
  body: string;
  channel?: Database["public"]["Enums"]["notification_channel"];
  metadata?: Record<string, unknown>;
};

export type NotificationEvent =
  | "payment.received"
  | "deposit.approved"
  | "deposit.rejected"
  | "investment.purchased"
  | "settlement.completed"
  | "withdrawal.approved"
  | "withdrawal.rejected"
  | "kyc.approved"
  | "profile.updated";

type Client = SupabaseClient<Database>;

export class NotificationService {
  constructor(private readonly supabase: Client) {}

  async dispatch(payload: NotificationPayload): Promise<void> {
    const channel = payload.channel ?? "in_app";

    if (channel === "in_app") {
      const { error } = await this.supabase.from("notifications").insert({
        user_id: payload.userId,
        title: payload.title,
        body: payload.body,
        channel: "in_app",
        metadata: (payload.metadata ?? {}) as Json,
        read_at: null
      });

      if (error) {
        logger.error("Failed to persist in-app notification", {
          userId: payload.userId,
          error: error.message
        });
        throw error;
      }
      return;
    }

    if (channel === "email") {
      if (!process.env.RESEND_API_KEY) {
        logger.warn("RESEND_API_KEY not configured — skipping email notification", {
          userId: payload.userId
        });
        return;
      }
      logger.info("Email notification queued (provider ready when template wired)", {
        userId: payload.userId,
        title: payload.title
      });
      return;
    }

    logger.warn("Notification channel not implemented", { channel, userId: payload.userId });
  }

  async notifyEvent(event: NotificationEvent, userId: string, data: Record<string, unknown> = {}) {
    const templates: Record<NotificationEvent, { title: string; body: string }> = {
      "payment.received": {
        title: "Payment received",
        body: `₦${Number(data.amount ?? 0).toLocaleString("en-NG")} credited to your wallet.`
      },
      "deposit.approved": {
        title: "Deposit approved",
        body: `₦${Number(data.amount ?? 0).toLocaleString("en-NG")} has been added to your wallet.`
      },
      "deposit.rejected": {
        title: "Deposit declined",
        body: String(data.reason ?? "Your deposit could not be verified.")
      },
      "investment.purchased": {
        title: "Investment confirmed",
        body: `Your investment of ₦${Number(data.amount ?? 0).toLocaleString("en-NG")} is now active.`
      },
      "settlement.completed": {
        title: "Settlement posted",
        body: `₦${Number(data.amount ?? 0).toLocaleString("en-NG")} settlement credited to your wallet.`
      },
      "withdrawal.approved": {
        title: "Withdrawal approved",
        body: `Your withdrawal of ₦${Number(data.amount ?? 0).toLocaleString("en-NG")} has been approved.`
      },
      "withdrawal.rejected": {
        title: "Withdrawal declined",
        body: String(data.reason ?? "Your withdrawal request was not approved.")
      },
      "kyc.approved": {
        title: "KYC approved",
        body: "Your identity verification is complete."
      },
      "profile.updated": {
        title: "Profile updated",
        body: "Your profile settings were saved successfully."
      }
    };

    const template = templates[event];
    await this.dispatch({
      userId,
      title: template.title,
      body: template.body,
      channel: "in_app",
      metadata: { event, ...data }
    });
  }

  async listForUser(userId: string, limit = 20) {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) throw error;
    return count ?? 0;
  }

  async markRead(notificationId: string, userId: string) {
    const { error } = await this.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw error;
  }
}
