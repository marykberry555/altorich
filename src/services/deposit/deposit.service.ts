import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Deposit } from "@/types/database";
import { AppError, Errors, unknownErrorMessage } from "@/lib/errors";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { InvestmentService } from "@/services/investment/investment.service";
import { RoiService } from "@/services/roi/roi.service";
import { FinancialOpsService } from "@/services/admin/financial-ops.service";
import { getPublicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { runSecondary } from "@/lib/resilience/run-secondary";
import type { DepositWorkflowPhase } from "@/lib/finance/deposit-workflow";
import { isTerminalDepositWorkflow } from "@/lib/finance/deposit-workflow";

type Client = SupabaseClient<Database>;
type DepositRow = Deposit & {
  workflow_phase?: DepositWorkflowPhase | null;
  workflow_updated_at?: string | null;
  workflow_error?: string | null;
};

export class DepositService {
  private readonly wallet: WalletService;
  private readonly notifications: NotificationService;
  private readonly ops: FinancialOpsService;

  constructor(private readonly supabase: Client) {
    this.wallet = new WalletService(supabase);
    this.notifications = new NotificationService(supabase);
    this.ops = new FinancialOpsService(supabase);
  }

  async listRecent(limit = 20): Promise<Deposit[]> {
    const { data, error } = await this.supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  async listForUser(userId: string, limit = 20): Promise<Deposit[]> {
    const { data, error } = await this.supabase
      .from("deposits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  async listPending(): Promise<Deposit[]> {
    const { data, error } = await this.supabase
      .from("deposits")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async create(input: {
    memberName: string;
    phone: string;
    amount: number;
    reference: string;
    receiptNote: string;
    userId?: string;
    proofUrl?: string;
  }) {
    if (input.userId) {
      const { assertCanDeposit } = await import("@/lib/account-status/enforce");
      await assertCanDeposit(this.supabase, input.userId);
    }

    const { data, error } = await this.supabase
      .from("deposits")
      .insert({
        member_name: input.memberName,
        phone: input.phone,
        amount: input.amount,
        reference: input.reference,
        receipt_note: input.receiptNote,
        user_id: input.userId ?? null,
        proof_url: input.proofUrl ?? null,
        status: "pending"
      } as Database["public"]["Tables"]["deposits"]["Insert"])
      .select()
      .single();

    if (error) throw error;

    if (input.userId) {
      await this.notifications.dispatch({
        userId: input.userId,
        title: "Deposit submitted",
        body: `Your deposit of ₦${input.amount.toLocaleString("en-NG")} is pending verification.`,
        channel: "in_app",
        metadata: { deposit_id: data.id }
      });
    }

    return data;
  }

  private async resolveUserId(deposit: Deposit): Promise<string | null> {
    if (deposit.user_id) return deposit.user_id;

    const normalizedPhone = deposit.phone.replace(/\s+/g, "");
    const { data } = await this.supabase
      .from("profiles")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    return data?.id ?? null;
  }

  private async setWorkflowPhase(
    depositId: string,
    phase: DepositWorkflowPhase,
    extra?: Database["public"]["Tables"]["deposits"]["Update"] & {
      workflow_error?: string | null;
    }
  ) {
    const { data, error } = await this.supabase
      .from("deposits")
      .update({
        ...extra,
        workflow_phase: phase,
        workflow_updated_at: new Date().toISOString(),
        workflow_error: extra?.workflow_error ?? null
      } as never)
      .eq("id", depositId)
      .select("*")
      .single();
    if (error) throw error;
    return data as DepositRow;
  }

  async approve(depositId: string, reviewerId: string) {
    let deposit: DepositRow | null = null;
    let claimed = false;
    let previousStatus = "pending";

    const { data: claimPayload, error: rpcError } = await this.supabase.rpc(
      "claim_deposit_for_approval" as never,
      { p_deposit_id: depositId, p_reviewer_id: reviewerId } as never
    );

    if (!rpcError && claimPayload && typeof claimPayload === "object") {
      const payload = claimPayload as {
        claimed?: boolean;
        previous_status?: string;
        deposit?: DepositRow;
      };
      claimed = Boolean(payload.claimed);
      previousStatus = String(payload.previous_status ?? "unknown");
      deposit = payload.deposit ?? null;
    } else {
      const { data: claimedRow, error: claimError } = await this.supabase
        .from("deposits")
        .update({
          status: "approved",
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          workflow_phase: "claimed",
          workflow_updated_at: new Date().toISOString(),
          workflow_error: null
        } as never)
        .eq("id", depositId)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();

      if (claimError) throw claimError;
      if (claimedRow) {
        deposit = claimedRow as DepositRow;
        claimed = true;
        previousStatus = "pending";
      } else {
        const { data: existing, error: existingError } = await this.supabase
          .from("deposits")
          .select("*")
          .eq("id", depositId)
          .maybeSingle();
        if (existingError) throw existingError;
        deposit = existing as DepositRow | null;
        previousStatus = String(existing?.status ?? "unknown");
      }
    }

    if (!deposit) throw Errors.notFound("Deposit");

    if (!claimed) {
      const phase = (deposit.workflow_phase ?? "pending") as DepositWorkflowPhase;
      if (deposit.status === "completed" || phase === "completed") {
        await this.ops.recordEvent({
          eventType: "duplicate_attempt",
          severity: "info",
          entityType: "deposit",
          entityId: depositId,
          reference: `DEP-${depositId}`,
          message: "Duplicate deposit approval ignored (already completed).",
          metadata: { previousStatus, phase }
        });
        return deposit;
      }
      // Resume intermediate workflow instead of failing hard.
      if (deposit.status === "approved" || !isTerminalDepositWorkflow(phase)) {
        logger.info("Deposit approval resuming workflow", { depositId, phase });
        return this.advanceApprovalWorkflow(deposit, reviewerId);
      }
      throw new AppError("Deposit is not pending", 409, "INVALID_STATUS");
    }

    return this.advanceApprovalWorkflow(deposit, reviewerId, previousStatus);
  }

  /**
   * Advance claim → credit → invest → reconcile → completed.
   * Safe to call repeatedly for recovery of stuck intermediate phases.
   */
  async advanceApprovalWorkflow(deposit: DepositRow, reviewerId: string, previousStatus = "approved") {
    const depositId = deposit.id;
    let phase = (deposit.workflow_phase ?? "claimed") as DepositWorkflowPhase;
    let walletTxId: string | null = deposit.wallet_transaction_id;
    const userId = await this.resolveUserId(deposit);

    try {
      if (phase === "pending" || phase === "claimed") {
        if (!userId) {
          return this.setWorkflowPhase(depositId, "completed", {
            status: "approved",
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString()
          } as never);
        }

        const wallet = await this.wallet.ensureWallet(userId);
        const walletBefore = await this.wallet.getBalance(wallet.id);

        try {
          const tx = await this.wallet.creditDeposit(wallet.id, Number(deposit.amount), depositId);
          walletTxId = tx.id;
        } catch (creditError) {
          const message = unknownErrorMessage(creditError);
          if (!/duplicate|unique/i.test(message)) throw creditError;
          const { data: existing } = await this.supabase
            .from("wallet_transactions")
            .select("id")
            .eq("reference", `DEP-${depositId}`)
            .maybeSingle();
          walletTxId = existing?.id ?? null;
          await this.ops.recordEvent({
            eventType: "duplicate_attempt",
            severity: "info",
            entityType: "deposit",
            entityId: depositId,
            reference: `DEP-${depositId}`,
            message: "Deposit wallet credit reused existing DEP ledger row.",
            metadata: { walletTxId }
          });
        }

        deposit = await this.setWorkflowPhase(depositId, "wallet_credited", {
          status: "approved",
          user_id: userId,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          wallet_transaction_id: walletTxId
        } as never);
        phase = "wallet_credited";

        await runSecondary("deposit.approved.notify", () =>
          this.notifications.notifyEvent("deposit.approved", userId, {
            amount: Number(deposit.amount),
            deposit_id: depositId
          })
        );

        await runSecondary("deposit.approved.roi_reset", async () => {
          if (!getPublicEnv().NEXT_PUBLIC_ROI_MODE_ENABLED) return;
          const roi = new RoiService(this.supabase);
          await roi.resetWeeklyCycle(userId);
        });

        // Continue with invest using walletBefore captured above.
        return this.continueInvestAndComplete(deposit, reviewerId, userId, walletBefore, previousStatus);
      }

      if (phase === "wallet_credited" || phase === "investment_created" || phase === "reconciled" || phase === "failed") {
        if (!userId) {
          return this.setWorkflowPhase(depositId, "completed", {
            status: walletTxId ? "completed" : "approved",
            wallet_transaction_id: walletTxId
          } as never);
        }

        // If investment already exists for this deposit, complete without re-investing.
        const { data: existingInv } = await this.supabase
          .from("investments")
          .select("id")
          .eq("source_deposit_id", depositId)
          .neq("status", "cancelled")
          .maybeSingle();
        if (existingInv || phase === "investment_created" || phase === "reconciled") {
          return this.setWorkflowPhase(depositId, "completed", {
            status: walletTxId ? "completed" : "approved",
            user_id: userId,
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
            wallet_transaction_id: walletTxId
          } as never);
        }

        const wallet = await this.wallet.ensureWallet(userId);
        const balance = await this.wallet.getBalance(wallet.id);
        // After credit: balance ≈ prior + deposit → recover prior for reconciliation.
        const walletBefore = Math.max(0, Math.round((balance - Number(deposit.amount)) * 100) / 100);
        return this.continueInvestAndComplete(deposit, reviewerId, userId, walletBefore, previousStatus);
      }

      if (phase === "completed") return deposit;
      return deposit;
    } catch (err) {
      const message = unknownErrorMessage(err);
      await this.setWorkflowPhase(depositId, "failed", { workflow_error: message } as never).catch(() => null);
      await this.ops.recordEvent({
        eventType: "reconcile_failed",
        severity: "error",
        entityType: "deposit",
        entityId: depositId,
        reference: `DEP-${depositId}`,
        message,
        metadata: { phase, reviewerId }
      });
      throw err;
    }
  }

  private async continueInvestAndComplete(
    deposit: DepositRow,
    reviewerId: string,
    userId: string,
    walletBefore: number,
    previousStatus: string
  ) {
    const depositId = deposit.id;
    let walletTxId = deposit.wallet_transaction_id;
    let investmentId: string | null = null;

    try {
      const investments = new InvestmentService(this.supabase);
      const created = await investments.autoInvestFromPreferredPackage(userId, Number(deposit.amount), {
        depositId,
        walletBefore,
        source: "deposit_approval"
      });
      if (created) {
        investmentId = created.id;
        await this.setWorkflowPhase(depositId, "investment_created", {
          wallet_transaction_id: walletTxId
        } as never);
        logger.info("Auto-invested preferred package after deposit approval", {
          userId,
          depositId,
          investmentId: created.id,
          amount: Number(created.amount)
        });
      }
      await this.setWorkflowPhase(depositId, "reconciled");
    } catch (autoInvestError) {
      const code =
        autoInvestError && typeof autoInvestError === "object" && "code" in autoInvestError
          ? String((autoInvestError as { code?: string }).code)
          : "";
      const message = unknownErrorMessage(autoInvestError);
      if (code === "LEDGER_RECONCILIATION_FAILED") {
        await this.ops.recordEvent({
          eventType: "reconcile_failed",
          severity: "error",
          entityType: "deposit",
          entityId: depositId,
          reference: `DEP-${depositId}`,
          message,
          metadata: { userId }
        });
        logger.error("Auto-invest rolled back after ledger reconciliation failure", {
          userId,
          depositId,
          error: message
        });
        await this.setWorkflowPhase(depositId, "failed", { workflow_error: message } as never);
        throw autoInvestError;
      }
      // Below-min / no preferred package — funds stay in wallet; still complete deposit.
      logger.warn("Auto-invest after deposit approval skipped", { userId, depositId, error: message });
      await this.setWorkflowPhase(depositId, "reconciled");
    }

    const data = await this.setWorkflowPhase(depositId, "completed", {
      status: walletTxId ? "completed" : "approved",
      user_id: userId,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      wallet_transaction_id: walletTxId
    } as never);

    logger.info("Deposit approved", {
      depositId,
      previousStatus,
      newStatus: data.status,
      walletTxId,
      investmentId,
      reviewerId,
      workflow_phase: "completed"
    });

    return data;
  }

  /** Resume deposits stuck in intermediate workflow phases. */
  async recoverStuckApprovals(olderThanMinutes = 5, limit = 25) {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString();
    const { data, error } = await this.supabase
      .from("deposits")
      .select("*")
      .in("workflow_phase", ["claimed", "wallet_credited", "investment_created", "reconciled", "failed"])
      .lt("workflow_updated_at", cutoff)
      .order("workflow_updated_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const results: { id: string; ok: boolean; phase?: string; error?: string }[] = [];
    for (const row of data ?? []) {
      const deposit = row as DepositRow;
      try {
        await this.ops.recordEvent({
          eventType: "recovery_resumed",
          severity: "warning",
          entityType: "deposit",
          entityId: deposit.id,
          reference: `DEP-${deposit.id}`,
          message: `Resuming stuck deposit workflow from ${deposit.workflow_phase}.`,
          metadata: { phase: deposit.workflow_phase }
        });
        const advanced = await this.advanceApprovalWorkflow(
          deposit,
          deposit.reviewed_by ?? "00000000-0000-0000-0000-000000000000"
        );
        results.push({ id: deposit.id, ok: true, phase: String((advanced as DepositRow).workflow_phase) });
        await this.ops.recordEvent({
          eventType: "recovery_completed",
          severity: "info",
          entityType: "deposit",
          entityId: deposit.id,
          reference: `DEP-${deposit.id}`,
          message: "Deposit workflow recovery completed.",
          metadata: { phase: (advanced as DepositRow).workflow_phase }
        });
      } catch (err) {
        results.push({
          id: deposit.id,
          ok: false,
          error: unknownErrorMessage(err)
        });
      }
    }
    return results;
  }

  async reject(depositId: string, reviewerId: string, reason: string) {
    const { data: deposit, error: fetchError } = await this.supabase
      .from("deposits")
      .select("*")
      .eq("id", depositId)
      .single();

    if (fetchError) throw fetchError;
    if (!deposit) throw Errors.notFound("Deposit");
    if (deposit.status !== "pending") {
      throw new AppError("Only pending deposits can be rejected.", 409, "DEPOSIT_NOT_PENDING");
    }

    const { data, error } = await this.supabase
      .from("deposits")
      .update({
        status: "rejected",
        rejection_reason: reason,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        workflow_phase: "failed",
        workflow_updated_at: new Date().toISOString(),
        workflow_error: reason
      } as never)
      .eq("id", depositId)
      .eq("status", "pending")
      .select()
      .single();

    if (error) throw error;

    if (deposit.user_id) {
      await runSecondary("deposit.rejected.notify", () =>
        this.notifications.notifyEvent("deposit.rejected", deposit.user_id!, {
          amount: Number(deposit.amount),
          reason: reason || "Your deposit could not be verified.",
          deposit_id: depositId
        })
      );
    }

    return data;
  }

  async getUserStats(userId: string) {
    const deposits = await this.listForUser(userId, 500);
    const approved = deposits
      .filter((d) => d.status === "approved" || d.status === "completed")
      .reduce((s, d) => s + Number(d.amount), 0);
    const pending = deposits
      .filter((d) => d.status === "pending")
      .reduce((s, d) => s + Number(d.amount), 0);
    return { approved, pending, count: deposits.length };
  }

  async getAdminStats() {
    const deposits = await this.listRecent(500);
    const approved = deposits
      .filter((d) => d.status === "approved" || d.status === "completed")
      .reduce((s, d) => s + Number(d.amount), 0);
    const pending = deposits.filter((d) => d.status === "pending").reduce((s, d) => s + Number(d.amount), 0);
    const members = new Set(deposits.map((d) => d.phone)).size;
    return { approved, pending, members };
  }
}
