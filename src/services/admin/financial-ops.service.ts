import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { logger } from "@/lib/logger";

type Client = SupabaseClient<Database>;

export type FinancialOpsEventType =
  | "reconcile_failed"
  | "duplicate_attempt"
  | "deposit_stuck"
  | "withdrawal_stuck"
  | "referral_payout_stuck"
  | "settlement_batch_failed"
  | "recovery_resumed"
  | "recovery_completed";

export class FinancialOpsService {
  constructor(private readonly supabase: Client) {}

  async recordEvent(input: {
    eventType: FinancialOpsEventType;
    severity?: "info" | "warning" | "error";
    entityType: string;
    entityId?: string | null;
    reference?: string | null;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    const { error } = await this.supabase.from("financial_ops_events" as never).insert({
      event_type: input.eventType,
      severity: input.severity ?? (input.eventType.includes("failed") ? "error" : "info"),
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      reference: input.reference ?? null,
      message: input.message,
      metadata: (input.metadata ?? {}) as Json
    } as never);

    if (error) {
      logger.warn("Failed to record financial ops event", {
        eventType: input.eventType,
        error: error.message
      });
    }
  }

  async getHealthSnapshot() {
    const now = Date.now();
    const fiveMinAgo = new Date(now - 5 * 60_000).toISOString();
    const thirtyMinAgo = new Date(now - 30 * 60_000).toISOString();
    const dayAgo = new Date(now - 24 * 60 * 60_000).toISOString();

    const [
      stuckDeposits,
      stuckWithdrawals,
      stuckReferralPayouts,
      openReconcile,
      openDuplicates,
      recentEvents,
      openWithdrawals,
      processingWithdrawals
    ] = await Promise.all([
      this.supabase
        .from("deposits")
        .select("id, amount, status, workflow_phase, workflow_updated_at, workflow_error, reference, user_id")
        .in("workflow_phase", ["claimed", "wallet_credited", "investment_created", "reconciled", "failed"])
        .lt("workflow_updated_at", fiveMinAgo)
        .order("workflow_updated_at", { ascending: true })
        .limit(50),
      this.supabase
        .from("withdrawals")
        .select("id, amount, status, settlement_reference, processing_started_at, queued_at, user_id")
        .eq("status", "processing")
        .lt("processing_started_at", thirtyMinAgo)
        .order("processing_started_at", { ascending: true })
        .limit(50),
      this.supabase
        .from("referral_payouts")
        .select("id, amount, status, settlement_reference, reviewed_at, created_at, user_id")
        .eq("status", "processing")
        .lt("reviewed_at", thirtyMinAgo)
        .order("reviewed_at", { ascending: true })
        .limit(50),
      this.supabase
        .from("financial_ops_events" as never)
        .select("id, event_type, severity, entity_type, entity_id, reference, message, created_at, metadata")
        .eq("event_type", "reconcile_failed")
        .is("resolved_at", null)
        .gte("created_at", dayAgo)
        .order("created_at", { ascending: false })
        .limit(50),
      this.supabase
        .from("financial_ops_events" as never)
        .select("id, event_type, severity, entity_type, entity_id, reference, message, created_at, metadata")
        .eq("event_type", "duplicate_attempt")
        .gte("created_at", dayAgo)
        .order("created_at", { ascending: false })
        .limit(50),
      this.supabase
        .from("financial_ops_events" as never)
        .select("id, event_type, severity, entity_type, entity_id, reference, message, created_at, resolved_at")
        .gte("created_at", dayAgo)
        .order("created_at", { ascending: false })
        .limit(100),
      this.supabase
        .from("withdrawals")
        .select("id", { count: "exact", head: true })
        .in("status", ["scheduled", "pending", "approved", "processing"]),
      this.supabase
        .from("withdrawals")
        .select("id", { count: "exact", head: true })
        .eq("status", "processing")
    ]);

    for (const [label, result] of [
      ["stuckDeposits", stuckDeposits],
      ["stuckWithdrawals", stuckWithdrawals],
      ["stuckReferralPayouts", stuckReferralPayouts],
      ["openReconcile", openReconcile],
      ["openDuplicates", openDuplicates],
      ["recentEvents", recentEvents],
      ["openWithdrawals", openWithdrawals],
      ["processingWithdrawals", processingWithdrawals]
    ] as const) {
      if ("error" in result && result.error) {
        logger.warn("Financial health query failed", { label, message: result.error.message });
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      thresholds: {
        depositStuckMinutes: 5,
        withdrawalStuckMinutes: 30
      },
      counts: {
        stuckDeposits: stuckDeposits.data?.length ?? 0,
        stuckWithdrawals: stuckWithdrawals.data?.length ?? 0,
        stuckReferralPayouts: stuckReferralPayouts.data?.length ?? 0,
        openReconcileFailures: openReconcile.data?.length ?? 0,
        duplicateAttempts24h: openDuplicates.data?.length ?? 0,
        openWithdrawalQueue: openWithdrawals.count ?? 0,
        withdrawalsProcessing: processingWithdrawals.count ?? 0
      },
      stuckDeposits: stuckDeposits.data ?? [],
      stuckWithdrawals: stuckWithdrawals.data ?? [],
      stuckReferralPayouts: stuckReferralPayouts.data ?? [],
      reconcileFailures: openReconcile.data ?? [],
      duplicateAttempts: openDuplicates.data ?? [],
      recentEvents: recentEvents.data ?? []
    };
  }

  async resolveEvent(eventId: string) {
    const { error } = await this.supabase
      .from("financial_ops_events" as never)
      .update({ resolved_at: new Date().toISOString() } as never)
      .eq("id", eventId);
    if (error) throw error;
  }
}
