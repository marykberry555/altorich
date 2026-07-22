import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { formatNaira } from "@/lib/domain";
import { WalletService } from "@/services/wallet/wallet.service";
import { SettingsService } from "@/services/admin/settings.service";
import { NotificationService } from "@/services/notification/notification.service";
import { WithdrawalService } from "@/services/withdrawal/withdrawal.service";
import { AuditService } from "@/services/audit/audit.service";
import {
  mergeWelcomeBonusConfig,
  WELCOME_BONUS_SETTINGS_KEY,
  WELCOME_BONUS_WALLET_CURRENCY,
  type WelcomeBonusConfig
} from "@/lib/welcome-bonus/config";
import { buildProgrammeStatus, type WelcomeBonusProgrammeStatus } from "@/lib/welcome-bonus/programme-status";
import {
  daysRemainingUntil,
  expectedUnlockFromRegistration
} from "@/lib/welcome-bonus/schedule";
import { assertValidAccountNumber, normalizeAccountNumber } from "@/lib/validation/identity";
import { accountNamesMatch, ACCOUNT_NAME_MISMATCH_MESSAGE } from "@/lib/validation/account-name";

type Client = SupabaseClient<Database>;

export type WelcomeBonusRow = {
  id: string;
  user_id: string;
  allocation_number: number;
  amount: number;
  status: "locked" | "available" | "withdrawal_requested" | "paid" | "cancelled";
  registered_at: string;
  email_verified_at: string;
  qualification_ends_at: string;
  expected_unlock_at: string;
  unlocked_at: string | null;
  wallet_id: string | null;
  award_tx_id: string | null;
  unlock_tx_id: string | null;
  withdrawal_id: string | null;
  settlement_reference: string | null;
  created_at: string;
  updated_at: string;
};

export type WelcomeBonusMemberView = {
  allocated: boolean;
  amount: number;
  status: WelcomeBonusRow["status"] | "none";
  allocationNumber: number | null;
  daysRemaining: number;
  qualificationEndsAt: string | null;
  expectedUnlockAt: string | null;
  unlockedAt: string | null;
  withdrawableBalance: number;
  settlementReference: string | null;
  unlockHint: string;
};

export class WelcomeBonusService {
  private readonly wallet: WalletService;
  private readonly settings: SettingsService;
  private readonly notifications: NotificationService;
  private readonly audit: AuditService;

  constructor(private readonly supabase: Client) {
    this.wallet = new WalletService(supabase);
    this.settings = new SettingsService(supabase);
    this.notifications = new NotificationService(supabase);
    this.audit = new AuditService(supabase);
  }

  async getConfig(): Promise<WelcomeBonusConfig> {
    const raw = await this.settings.get<Partial<WelcomeBonusConfig>>(WELCOME_BONUS_SETTINGS_KEY);
    const fromSettings = mergeWelcomeBonusConfig(raw);
    // Prefer live programme row for enabled + remaining capacity when present.
    const { data } = await this.supabase
      .from("welcome_bonus_programme" as never)
      .select("enabled, amount_ngn, max_allocations, allocated, qualification_days")
      .eq("id", 1)
      .maybeSingle();
    if (!data) return fromSettings;
    const row = data as {
      enabled: boolean;
      amount_ngn: number;
      max_allocations: number;
      allocated: number;
      qualification_days: number;
    };
    return mergeWelcomeBonusConfig({
      enabled: row.enabled && fromSettings.enabled,
      amount_ngn: Number(row.amount_ngn),
      max_allocations: row.max_allocations,
      qualification_days: row.qualification_days
    });
  }

  async updateConfig(updates: Partial<WelcomeBonusConfig>, updatedBy?: string) {
    const current = await this.getConfig();
    const next = mergeWelcomeBonusConfig({ ...current, ...updates });

    await this.supabase.from("settings").upsert({
      key: WELCOME_BONUS_SETTINGS_KEY,
      value: next as unknown as Json,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy ?? null
    });

    await this.supabase
      .from("welcome_bonus_programme" as never)
      .update({
        enabled: next.enabled,
        amount_ngn: next.amount_ngn,
        max_allocations: next.max_allocations,
        qualification_days: next.qualification_days,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy ?? null
      } as never)
      .eq("id", 1);

    return next;
  }

  async getByUserId(userId: string): Promise<WelcomeBonusRow | null> {
    const { data, error } = await this.supabase
      .from("welcome_bonuses" as never)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? normalizeBonus(data) : null;
  }

  async getMemberView(userId: string, now = new Date()): Promise<WelcomeBonusMemberView> {
    const bonus = await this.getByUserId(userId);
    if (!bonus) {
      return {
        allocated: false,
        amount: 0,
        status: "none",
        allocationNumber: null,
        daysRemaining: 0,
        qualificationEndsAt: null,
        expectedUnlockAt: null,
        unlockedAt: null,
        withdrawableBalance: 0,
        settlementReference: null,
        unlockHint: "Unlocks on the next eligible Monday settlement."
      };
    }

    let withdrawable = 0;
    if (bonus.wallet_id && (bonus.status === "available" || bonus.status === "withdrawal_requested")) {
      withdrawable = await this.wallet.getBalance(bonus.wallet_id).catch(() => 0);
    }

    return {
      allocated: true,
      amount: bonus.amount,
      status: bonus.status,
      allocationNumber: bonus.allocation_number,
      daysRemaining:
        bonus.status === "locked" ? daysRemainingUntil(new Date(bonus.qualification_ends_at), now) : 0,
      qualificationEndsAt: bonus.qualification_ends_at,
      expectedUnlockAt: bonus.expected_unlock_at,
      unlockedAt: bonus.unlocked_at,
      withdrawableBalance: withdrawable,
      settlementReference: bonus.settlement_reference,
      unlockHint: "Unlocks on the next eligible Monday settlement."
    };
  }

  /**
   * Allocate Welcome Bonus after successful email verification.
   * Idempotent per user; atomically capped at max_allocations.
   */
  async allocateOnEmailVerified(userId: string): Promise<{ allocated: boolean; reason?: string }> {
    const config = await this.getConfig();
    if (!config.enabled) return { allocated: false, reason: "disabled" };

    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select("id, created_at, email_verified_at")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.email_verified_at) return { allocated: false, reason: "not_verified" };

    const registeredAt = new Date(profile.created_at);
    const verifiedAt = new Date(profile.email_verified_at);
    const { qualificationEndsAt, expectedUnlockAt } = expectedUnlockFromRegistration(
      registeredAt,
      config.qualification_days
    );

    const { data: claimPayload, error: claimError } = await this.supabase.rpc(
      "claim_welcome_bonus_allocation" as never,
      {
        p_user_id: userId,
        p_amount: config.amount_ngn,
        p_registered_at: registeredAt.toISOString(),
        p_email_verified_at: verifiedAt.toISOString(),
        p_qualification_ends_at: qualificationEndsAt.toISOString(),
        p_expected_unlock_at: expectedUnlockAt.toISOString()
      } as never
    );

    if (claimError) {
      logger.warn("Welcome bonus claim RPC failed", { userId, message: claimError.message });
      return { allocated: false, reason: "rpc_error" };
    }

    const claim = claimPayload as {
      ok?: boolean;
      duplicate?: boolean;
      reason?: string;
      bonus_id?: string;
      allocation_number?: number;
      amount?: number;
    };

    if (!claim?.ok) {
      return { allocated: false, reason: claim?.reason ?? "closed" };
    }

    if (claim.duplicate) {
      return { allocated: true, reason: "duplicate" };
    }

    const bonusId = String(claim.bonus_id);
    const amount = Number(claim.amount ?? config.amount_ngn);

    // Ensure dedicated WB wallet exists (never NGN / REF).
    let wallet = await this.wallet.getWalletByUserId(userId, WELCOME_BONUS_WALLET_CURRENCY).catch(() => null);
    if (!wallet) {
      const { data: created, error: wErr } = await this.supabase
        .from("wallets")
        .insert({ user_id: userId, currency: WELCOME_BONUS_WALLET_CURRENCY })
        .select("*")
        .single();
      if (wErr) throw wErr;
      wallet = created;
    }

    // Pending credit — excluded from wallet_balance until Monday unlock completes it.
    const awardTx = await this.wallet.postTransaction({
      walletId: wallet.id,
      type: "credit",
      amount,
      reference: `WB-AWARD-${userId}`,
      reason: "bonus",
      status: "pending",
      metadata: {
        welcome_bonus_id: bonusId,
        allocation_number: claim.allocation_number,
        ledger_event: "welcome_bonus_awarded"
      }
    });

    await this.supabase
      .from("welcome_bonuses" as never)
      .update({
        wallet_id: wallet.id,
        award_tx_id: awardTx.id,
        updated_at: new Date().toISOString()
      } as never)
      .eq("id", bonusId);

    await this.recordEvent({
      welcomeBonusId: bonusId,
      userId,
      eventType: "welcome_bonus_awarded",
      amount,
      reference: awardTx.reference
    });
    await this.recordEvent({
      welcomeBonusId: bonusId,
      userId,
      eventType: "welcome_bonus_locked",
      amount,
      reference: awardTx.reference,
      metadata: {
        qualification_ends_at: qualificationEndsAt.toISOString(),
        expected_unlock_at: expectedUnlockAt.toISOString()
      }
    });

    await this.audit.log({
      actorId: userId,
      action: "welcome_bonus.awarded",
      entityType: "welcome_bonus",
      entityId: bonusId,
      metadata: {
        reference: awardTx.reference,
        allocation_number: claim.allocation_number,
        amount,
        expected_unlock_at: expectedUnlockAt.toISOString()
      }
    });

    await this.notifications.notifyEvent("welcome_bonus.awarded", userId, {
      amount,
      expected_unlock_at: expectedUnlockAt.toISOString(),
      qualification_ends_at: qualificationEndsAt.toISOString()
    }).catch(() => undefined);

    return { allocated: true };
  }

  /** Monday settlement: unlock due locked bonuses into WB available balance. */
  async unlockDue(asOf = new Date(), limit = 200) {
    const { data: due, error } = await this.supabase
      .from("welcome_bonuses" as never)
      .select("id")
      .eq("status", "locked")
      .lte("expected_unlock_at", asOf.toISOString())
      .order("expected_unlock_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const results: Array<{ bonusId: string; ok: boolean; reason?: string }> = [];

    for (const row of due ?? []) {
      const bonusId = String((row as { id: string }).id);
      try {
        const unlocked = await this.unlockOne(bonusId);
        results.push({ bonusId, ok: unlocked.ok, reason: unlocked.reason });
      } catch (err) {
        logger.warn("Welcome bonus unlock failed", {
          bonusId,
          message: err instanceof Error ? err.message : String(err)
        });
        results.push({ bonusId, ok: false, reason: "error" });
      }
    }

    return results;
  }

  private async unlockOne(bonusId: string) {
    const { data: claimPayload, error: rpcError } = await this.supabase.rpc(
      "claim_welcome_bonus_for_unlock" as never,
      { p_bonus_id: bonusId } as never
    );
    if (rpcError) throw rpcError;

    const claim = claimPayload as {
      ok?: boolean;
      claimed?: boolean;
      reason?: string;
      user_id?: string;
      amount?: number;
      wallet_id?: string;
      award_tx_id?: string;
    };

    if (!claim?.ok) return { ok: false, reason: claim?.reason ?? "failed" };
    if (!claim.claimed) return { ok: true, reason: "already" };

    const userId = String(claim.user_id);
    const amount = Number(claim.amount);
    let walletId = claim.wallet_id ? String(claim.wallet_id) : null;

    if (!walletId) {
      const wallet = await this.wallet.getWalletByUserId(userId, WELCOME_BONUS_WALLET_CURRENCY);
      walletId = wallet.id;
    }

    // Complete pending award, or post completed credit if missing.
    let unlockTxId: string | null = null;
    if (claim.award_tx_id) {
      const { data: updated, error: upErr } = await this.supabase
        .from("wallet_transactions")
        .update({
          status: "completed",
          metadata: {
            welcome_bonus_id: bonusId,
            ledger_event: "welcome_bonus_unlocked"
          } as Json
        })
        .eq("id", String(claim.award_tx_id))
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (upErr) throw upErr;
      unlockTxId = updated?.id ?? String(claim.award_tx_id);
    } else {
      const tx = await this.wallet.postTransaction({
        walletId,
        type: "credit",
        amount,
        reference: `WB-UNLOCK-${bonusId}`,
        reason: "bonus",
        status: "completed",
        metadata: { welcome_bonus_id: bonusId, ledger_event: "welcome_bonus_unlocked" }
      });
      unlockTxId = tx.id;
    }

    await this.supabase
      .from("welcome_bonuses" as never)
      .update({
        unlock_tx_id: unlockTxId,
        wallet_id: walletId,
        updated_at: new Date().toISOString()
      } as never)
      .eq("id", bonusId);

    await this.recordEvent({
      welcomeBonusId: bonusId,
      userId,
      eventType: "welcome_bonus_unlocked",
      amount,
      reference: unlockTxId
    });

    await this.audit.log({
      actorId: null,
      action: "welcome_bonus.unlocked",
      entityType: "welcome_bonus",
      entityId: bonusId,
      metadata: { reference: unlockTxId, amount, user_id: userId }
    });

    await this.notifications
      .notifyEvent("welcome_bonus.unlocked", userId, {
        amount,
        message: `Your ${formatNaira(amount)} Welcome Bonus is available for Monday withdrawal.`
      })
      .catch(() => undefined);

    return { ok: true };
  }

  async requestWithdrawal(input: {
    userId: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankAccountId?: string | null;
    asOf?: Date;
  }) {
    const bonus = await this.getByUserId(input.userId);
    if (!bonus) throw new AppError("No Welcome Bonus allocation found.", 404, "NOT_FOUND");
    if (bonus.status === "locked") {
      throw new AppError(
        "Your Welcome Bonus is still locked until the next eligible Monday settlement.",
        403,
        "BONUS_LOCKED"
      );
    }
    if (bonus.status === "paid") {
      throw new AppError("Welcome Bonus has already been paid out.", 409, "ALREADY_PAID");
    }
    if (bonus.status === "withdrawal_requested" && bonus.withdrawal_id) {
      throw new AppError("A Welcome Bonus withdrawal is already in the queue.", 409, "PENDING_EXISTS");
    }
    if (bonus.status !== "available") {
      throw new AppError("Welcome Bonus is not available for withdrawal.", 409, "INVALID_STATUS");
    }

    const accountNumber = normalizeAccountNumber(input.accountNumber);
    assertValidAccountNumber(accountNumber);

    const { data: profile } = await this.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", input.userId)
      .maybeSingle();
    const registeredName = profile?.full_name?.trim() ?? "";
    if (!registeredName || !accountNamesMatch(registeredName, input.accountName)) {
      throw new AppError(ACCOUNT_NAME_MISMATCH_MESSAGE, 400, "ACCOUNT_NAME_MISMATCH");
    }

    if (!bonus.wallet_id) throw Errors.internal();
    const balance = await this.wallet.getBalance(bonus.wallet_id);
    if (balance < bonus.amount) {
      throw new AppError("Insufficient Welcome Bonus balance.", 400, "INSUFFICIENT_BALANCE");
    }

    const withdrawals = new WithdrawalService(this.supabase);
    const created = await withdrawals.create({
      userId: input.userId,
      amount: bonus.amount,
      bankName: input.bankName,
      accountName: input.accountName,
      accountNumber,
      bankAccountId: input.bankAccountId,
      note: "Welcome Bonus withdrawal",
      idempotencyKey: `WB-WD-${bonus.id}`,
      requestType: "manual",
      asOf: input.asOf,
      fundSource: "welcome_bonus"
    });

    if (!created) throw Errors.internal();

    await this.supabase
      .from("welcome_bonuses" as never)
      .update({
        status: "withdrawal_requested",
        withdrawal_id: created.id,
        settlement_reference: created.settlement_reference ?? null,
        updated_at: new Date().toISOString()
      } as never)
      .eq("id", bonus.id)
      .eq("status", "available");

    await this.recordEvent({
      welcomeBonusId: bonus.id,
      userId: input.userId,
      eventType: "welcome_bonus_withdrawal_requested",
      amount: bonus.amount,
      reference: created.settlement_reference ?? created.id
    });

    return created;
  }

  async markBonusPaidFromWithdrawal(withdrawalId: string, settlementReference: string | null) {
    const { data: bonus } = await this.supabase
      .from("welcome_bonuses" as never)
      .select("*")
      .eq("withdrawal_id", withdrawalId)
      .maybeSingle();
    if (!bonus) return;

    const row = normalizeBonus(bonus);
    await this.supabase
      .from("welcome_bonuses" as never)
      .update({
        status: "paid",
        settlement_reference: settlementReference ?? row.settlement_reference,
        updated_at: new Date().toISOString()
      } as never)
      .eq("id", row.id);

    await this.recordEvent({
      welcomeBonusId: row.id,
      userId: row.user_id,
      eventType: "welcome_bonus_withdrawal_paid",
      amount: row.amount,
      reference: settlementReference ?? row.settlement_reference
    });
  }

  async getPublicProgrammeStatus(): Promise<WelcomeBonusProgrammeStatus> {
    const config = await this.getConfig();
    const { data } = await this.supabase
      .from("welcome_bonus_programme" as never)
      .select("enabled, allocated, max_allocations")
      .eq("id", 1)
      .maybeSingle();
    const row = data as { enabled?: boolean; allocated?: number; max_allocations?: number } | null;
    return buildProgrammeStatus(
      config,
      Number(row?.allocated ?? 0),
      row?.enabled ?? true
    );
  }

  async getAdminSnapshot() {
    const config = await this.getConfig();
    const { data: programme } = await this.supabase
      .from("welcome_bonus_programme" as never)
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    const prog = programme as {
      allocated?: number;
      max_allocations?: number;
      amount_ngn?: number;
      enabled?: boolean;
    } | null;

    const allocated = Number(prog?.allocated ?? 0);
    const maxAllocations = Number(prog?.max_allocations ?? config.max_allocations);
    const amount = Number(prog?.amount_ngn ?? config.amount_ngn);

    const statuses = ["locked", "available", "withdrawal_requested", "paid", "cancelled"] as const;
    const counts: Record<string, number> = {};
    await Promise.all(
      statuses.map(async (status) => {
        const { count } = await this.supabase
          .from("welcome_bonuses" as never)
          .select("id", { count: "exact", head: true })
          .eq("status", status);
        counts[status] = count ?? 0;
      })
    );

    const { data: recent } = await this.supabase
      .from("welcome_bonuses" as never)
      .select(
        "id, user_id, allocation_number, amount, status, registered_at, qualification_ends_at, expected_unlock_at, unlocked_at, settlement_reference, created_at"
      )
      .order("allocation_number", { ascending: true })
      .limit(200);

    return {
      enabled: Boolean(prog?.enabled ?? config.enabled),
      amount,
      maxAllocations,
      allocated,
      remaining: Math.max(maxAllocations - allocated, 0),
      totalLiability: allocated * amount,
      counts: {
        locked: counts.locked ?? 0,
        available: counts.available ?? 0,
        awaitingSettlement: counts.withdrawal_requested ?? 0,
        paid: counts.paid ?? 0,
        cancelled: counts.cancelled ?? 0
      },
      recent: (recent ?? []).map((r) => normalizeBonus(r))
    };
  }

  private async recordEvent(input: {
    welcomeBonusId: string;
    userId: string;
    eventType:
      | "welcome_bonus_awarded"
      | "welcome_bonus_locked"
      | "welcome_bonus_unlocked"
      | "welcome_bonus_withdrawal_requested"
      | "welcome_bonus_withdrawal_paid";
    amount?: number;
    reference?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const { error } = await this.supabase.from("welcome_bonus_events" as never).insert({
      welcome_bonus_id: input.welcomeBonusId,
      user_id: input.userId,
      event_type: input.eventType,
      amount: input.amount ?? null,
      reference: input.reference ?? null,
      metadata: (input.metadata ?? {}) as Json
    } as never);
    if (error) {
      logger.warn("Failed to record welcome bonus event", {
        eventType: input.eventType,
        message: error.message
      });
    }
  }
}

function normalizeBonus(row: unknown): WelcomeBonusRow {
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    allocation_number: Number(r.allocation_number),
    amount: Number(r.amount),
    status: r.status as WelcomeBonusRow["status"],
    registered_at: String(r.registered_at),
    email_verified_at: String(r.email_verified_at),
    qualification_ends_at: String(r.qualification_ends_at),
    expected_unlock_at: String(r.expected_unlock_at),
    unlocked_at: r.unlocked_at ? String(r.unlocked_at) : null,
    wallet_id: r.wallet_id ? String(r.wallet_id) : null,
    award_tx_id: r.award_tx_id ? String(r.award_tx_id) : null,
    unlock_tx_id: r.unlock_tx_id ? String(r.unlock_tx_id) : null,
    withdrawal_id: r.withdrawal_id ? String(r.withdrawal_id) : null,
    settlement_reference: r.settlement_reference ? String(r.settlement_reference) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at)
  };
}
