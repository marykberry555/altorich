import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { FinancialOpsService } from "@/services/admin/financial-ops.service";
import { AdminNotificationService } from "@/services/admin/admin-notification.service";
import { AdminPushService } from "@/services/admin/admin-push.service";
import { logger } from "@/lib/logger";

type Client = SupabaseClient<Database>;

export type FinancialAlertKind =
  | "ops.reconcile_failed"
  | "ops.deposit_stuck"
  | "ops.withdrawal_stuck"
  | "ops.referral_payout_stuck"
  | "ops.duplicate_surge"
  | "ops.queue_backlog";

type AlertDraft = {
  kind: FinancialAlertKind;
  title: string;
  body: string;
  fingerprint: string;
  metadata: Record<string, unknown>;
};

const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours per fingerprint

export class FinancialAlertService {
  private readonly ops: FinancialOpsService;
  private readonly notifications: AdminNotificationService;
  private readonly push: AdminPushService;

  constructor(private readonly supabase: Client) {
    this.ops = new FinancialOpsService(supabase);
    this.notifications = new AdminNotificationService(supabase);
    this.push = new AdminPushService(supabase);
  }

  async evaluateAndNotify(options?: { cooldownMs?: number }) {
    const cooldownMs = options?.cooldownMs ?? COOLDOWN_MS;
    const health = await this.ops.getHealthSnapshot();
    const drafts = this.buildDrafts(health);
    const sent: Array<{ kind: FinancialAlertKind; notificationId: string | null; skipped?: string }> = [];

    for (const draft of drafts) {
      const recent = await this.hasRecentAlert(draft.kind, draft.fingerprint, cooldownMs);
      if (recent) {
        sent.push({ kind: draft.kind, notificationId: null, skipped: "cooldown" });
        continue;
      }

      try {
        const row = await this.notifications.create({
          eventType: draft.kind,
          title: draft.title,
          body: draft.body,
          entityType: "financial_ops",
          metadata: {
            priority: "high",
            fingerprint: draft.fingerprint,
            ...draft.metadata
          }
        });

        if (!row) {
          sent.push({ kind: draft.kind, notificationId: null, skipped: "create_failed" });
          continue;
        }

        await this.push.sendForNotification({
          eventType: draft.kind,
          title: draft.title,
          body: draft.body,
          entityType: "financial_ops",
          metadata: { priority: "high", fingerprint: draft.fingerprint, ...draft.metadata }
        });

        sent.push({ kind: draft.kind, notificationId: row.id });
      } catch (error) {
        logger.warn("Failed to send financial alert", {
          kind: draft.kind,
          message: error instanceof Error ? error.message : String(error)
        });
        sent.push({ kind: draft.kind, notificationId: null, skipped: "error" });
      }
    }

    return {
      generatedAt: health.generatedAt,
      counts: health.counts,
      drafts: drafts.length,
      sent
    };
  }

  private buildDrafts(health: Awaited<ReturnType<FinancialOpsService["getHealthSnapshot"]>>): AlertDraft[] {
    const drafts: AlertDraft[] = [];
    const c = health.counts;

    if (c.openReconcileFailures > 0) {
      drafts.push({
        kind: "ops.reconcile_failed",
        title: "Ledger reconcile failure",
        body: `${c.openReconcileFailures} open reconcile failure(s) in the last 24h. Open Financial Health to resolve.`,
        fingerprint: `reconcile:${c.openReconcileFailures}`,
        metadata: { count: c.openReconcileFailures }
      });
    }

    if (c.stuckDeposits > 0) {
      const sample = health.stuckDeposits[0];
      drafts.push({
        kind: "ops.deposit_stuck",
        title: "Stuck deposit approval",
        body: `${c.stuckDeposits} deposit workflow(s) stuck >5m${
          sample?.reference ? ` · e.g. ${sample.reference}` : ""
        }. Recovery may be needed.`,
        fingerprint: `deposit_stuck:${c.stuckDeposits}`,
        metadata: { count: c.stuckDeposits, sampleId: sample?.id }
      });
    }

    if (c.stuckWithdrawals > 0) {
      const sample = health.stuckWithdrawals[0];
      drafts.push({
        kind: "ops.withdrawal_stuck",
        title: "Stuck withdrawal processing",
        body: `${c.stuckWithdrawals} withdrawal(s) processing >30m${
          sample?.settlement_reference ? ` · e.g. ${sample.settlement_reference}` : ""
        }.`,
        fingerprint: `withdrawal_stuck:${c.stuckWithdrawals}`,
        metadata: { count: c.stuckWithdrawals, sampleId: sample?.id }
      });
    }

    if (c.stuckReferralPayouts > 0) {
      drafts.push({
        kind: "ops.referral_payout_stuck",
        title: "Stuck referral payout",
        body: `${c.stuckReferralPayouts} referral payout(s) processing >30m.`,
        fingerprint: `referral_stuck:${c.stuckReferralPayouts}`,
        metadata: { count: c.stuckReferralPayouts }
      });
    }

    if (c.duplicateAttempts24h >= 5) {
      drafts.push({
        kind: "ops.duplicate_surge",
        title: "Duplicate financial attempts",
        body: `${c.duplicateAttempts24h} duplicate attempt event(s) in 24h — review concurrency guards.`,
        fingerprint: `duplicates:${c.duplicateAttempts24h}`,
        metadata: { count: c.duplicateAttempts24h }
      });
    }

    if (c.openWithdrawalQueue >= 50) {
      drafts.push({
        kind: "ops.queue_backlog",
        title: "Settlement queue backlog",
        body: `${c.openWithdrawalQueue} withdrawal(s) waiting · ${c.withdrawalsProcessing} processing. Check Monday batch throughput.`,
        fingerprint: `queue:${c.openWithdrawalQueue}`,
        metadata: {
          openWithdrawalQueue: c.openWithdrawalQueue,
          withdrawalsProcessing: c.withdrawalsProcessing
        }
      });
    }

    return drafts;
  }

  private async hasRecentAlert(kind: FinancialAlertKind, fingerprint: string, cooldownMs: number) {
    const since = new Date(Date.now() - cooldownMs).toISOString();
    const { data, error } = await this.supabase
      .from("admin_notifications")
      .select("id, metadata, created_at")
      .eq("event_type", kind)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      logger.warn("Alert cooldown lookup failed", { message: error.message });
      return false;
    }

    return (data ?? []).some((row) => {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      return meta.fingerprint === fingerprint;
    });
  }
}
