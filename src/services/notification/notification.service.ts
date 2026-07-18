import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email/send";
import {
  newDeviceLoginEmailHtml,
  payoutApprovedEmailHtml,
  payoutRejectedEmailHtml,
  walletFundedEmailHtml
} from "@/lib/email/activity-templates";
import { formatNaira } from "@/lib/domain";

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
  | "withdrawal.submitted"
  | "withdrawal.auto_created"
  | "withdrawal.auto_scheduled"
  | "withdrawal.auto_skipped"
  | "withdrawal.approved"
  | "withdrawal.rejected"
  | "withdrawal.paid"
  | "kyc.approved"
  | "profile.updated"
  | "security.device_login"
  | "referral.verified"
  | "referral.payout_requested"
  | "referral.payout_approved"
  | "referral.payout_rejected"
  | "vip.level_up"
  | "liquidation.requested"
  | "liquidation.approved"
  | "liquidation.rejected";

type Client = SupabaseClient<Database>;

type NotificationPreferences = {
  in_app: boolean;
  email: boolean;
  sms: boolean;
};

export class NotificationService {
  constructor(private readonly supabase: Client) {}

  private async getUserEmail(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);
    if (error || !data.user?.email) return null;
    return data.user.email;
  }

  private async getEmailPreferences(userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", userId)
      .maybeSingle();
    const prefs = (data?.notification_preferences ?? {}) as NotificationPreferences;
    return prefs.email !== false;
  }

  private emailHtmlForEvent(event: NotificationEvent, data: Record<string, unknown>): string | null {
    const amount = Number(data.amount ?? 0);
    switch (event) {
      case "deposit.approved":
      case "payment.received":
        return walletFundedEmailHtml(amount);
      case "withdrawal.approved":
      case "withdrawal.paid":
        return payoutApprovedEmailHtml(amount);
      case "withdrawal.rejected":
        return payoutRejectedEmailHtml(amount, String(data.reason ?? ""));
      case "security.device_login":
        return newDeviceLoginEmailHtml();
      default:
        // Keep emails only for critical/account events. In-app covers the rest.
        return null;
    }
  }

  private async sendEmailForEvent(
    event: NotificationEvent,
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown>
  ) {
    if (!process.env.RESEND_API_KEY) return;
    if (!(await this.getEmailPreferences(userId))) return;

    const email = await this.getUserEmail(userId);
    if (!email) return;

    const html = this.emailHtmlForEvent(event, data);
    if (!html) return;

    await sendEmail({ to: email, subject: `${title} · AltoRich`, html });
  }

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
      const email = await this.getUserEmail(payload.userId);
      if (!email) return;
      await sendEmail({
        to: email,
        subject: `${payload.title} · AltoRich`,
        html: payload.body
      });
      return;
    }

    logger.warn("Notification channel not implemented", { channel, userId: payload.userId });
  }

  async notifyEvent(event: NotificationEvent, userId: string, data: Record<string, unknown> = {}) {
    const templates: Record<NotificationEvent, { title: string; body: string }> = {
      "payment.received": {
        title: "Payment received",
        body: `${formatNaira(Number(data.amount ?? 0))} credited to your wallet.`
      },
      "deposit.approved": {
        title: "Funding approved",
        body: `${formatNaira(Number(data.amount ?? 0))} credited. Your preferred investment sector invests automatically when the amount meets the sector minimum.`
      },
      "deposit.rejected": {
        title: "Funding declined",
        body: String(data.reason ?? "Your deposit could not be verified.")
      },
      "investment.purchased": {
        title: "Investment active",
        body: `Your investment of ${formatNaira(Number(data.amount ?? 0))} is live. Earnings accrue toward Monday settlement.`
      },
      "settlement.completed": {
        title: "Settlement posted",
        body: `${formatNaira(Number(data.amount ?? 0))} settlement credited to your wallet.`
      },
      "withdrawal.submitted": {
        title: "Withdrawal submitted",
        body: String(
          data.schedule_message ??
            `Your withdrawal request of ${formatNaira(Number(data.amount ?? 0))} is pending review.`
        )
      },
      "withdrawal.auto_created": {
        title: "Automatic withdrawal created",
        body: `Your automatic weekly withdrawal of ${formatNaira(Number(data.amount ?? 0))} has been queued for processing.`
      },
      "withdrawal.auto_scheduled": {
        title: "Automatic withdrawal scheduled",
        body: "Automatic weekly withdrawal is enabled. Accrued earnings will be withdrawn every Monday settlement."
      },
      "withdrawal.auto_skipped": {
        title: "Automatic withdrawal skipped",
        body: String(data.reason ?? "Add a withdrawal bank account to receive automatic withdrawals.")
      },
      "withdrawal.approved": {
        title: "Withdrawal approved",
        body: `Your withdrawal of ${formatNaira(Number(data.amount ?? 0))} has been approved.`
      },
      "withdrawal.paid": {
        title: "Withdrawal completed",
        body: `Your withdrawal of ${formatNaira(Number(data.amount ?? 0))} has been processed.`
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
      },
      "security.device_login": {
        title: "New device sign-in",
        body: "Your account was accessed from a new browser or device."
      },
      "referral.verified": {
        title: "Referral verified",
        body: `You earned ${formatNaira(Number(data.amount ?? 0))} — your referral activated their first investment.`
      },
      "referral.payout_requested": {
        title: "Referral withdrawal submitted",
        body: `Your referral reward withdrawal of ${formatNaira(Number(data.amount ?? 0))} is pending review.`
      },
      "referral.payout_approved": {
        title: "Referral withdrawal approved",
        body: `Your referral withdrawal of ${formatNaira(Number(data.amount ?? 0))} has been approved.`
      },
      "referral.payout_rejected": {
        title: "Referral withdrawal declined",
        body: String(data.reason ?? "Your referral withdrawal request was not approved. Funds returned to your referral wallet.")
      },
      "vip.level_up": {
        title: "VIP level unlocked",
        body: `Congratulations — you reached ${String(data.label ?? "a new VIP level")}! Your referral commission is now ${Number(data.commission_percent ?? 0)}%.`
      },
      "liquidation.requested": {
        title: "Capital liquidation submitted",
        body: `Your request to liquidate ${formatNaira(Number(data.amount ?? 0))} principal is pending admin review.`
      },
      "liquidation.approved": {
        title: "Capital liquidation approved",
        body: `${formatNaira(Number(data.amount ?? 0))} principal has been returned to your wallet.`
      },
      "liquidation.rejected": {
        title: "Capital liquidation declined",
        body: String(data.reason ?? "Your capital liquidation request was not approved. Your investment remains active.")
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

    await this.sendEmailForEvent(event, userId, template.title, template.body, data);
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
