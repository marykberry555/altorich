import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Withdrawal } from "@/types/database";
import { AppError } from "@/lib/errors";
import { assertValidAccountNumber, normalizeAccountNumber } from "@/lib/validation/identity";
import { accountNamesMatch, ACCOUNT_NAME_MISMATCH_MESSAGE } from "@/lib/validation/account-name";
import { resolvePayoutQueue } from "@/lib/payout/schedule";
import {
  batchNumberForPosition,
  buildQueuedScheduleMessage,
  estimateSettlementProcessingAt,
  formatSettlementEtaShort,
  formatSettlementOpenLabel,
  memberQueueStatusLabel,
  type SettlementQueueConfig
} from "@/lib/payout/settlement-queue";
import { nextSettlementReference } from "@/lib/payout/settlement-reference";
import {
  isPayoutSchemaCompatError,
  normalizeWithdrawalRow,
  toLegacyWithdrawalInsert
} from "@/lib/payout/withdrawal-compat";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { KycService } from "@/services/kyc/kyc.service";
import { SettingsService } from "@/services/admin/settings.service";

type Client = SupabaseClient<Database>;

const OPEN_QUEUE_STATUSES = ["scheduled", "pending", "approved", "processing"] as const;
const RESERVED_STATUSES = ["scheduled", "pending", "approved", "processing"] as const;

export class WithdrawalService {
  private readonly wallet: WalletService;
  private readonly notifications: NotificationService;
  private readonly kyc: KycService;
  private readonly settings: SettingsService;

  constructor(private readonly supabase: Client) {
    this.wallet = new WalletService(supabase);
    this.notifications = new NotificationService(supabase);
    this.kyc = new KycService(supabase);
    this.settings = new SettingsService(supabase);
  }

  private mapRows(rows: Withdrawal[] | null) {
    return (rows ?? []).map(normalizeWithdrawalRow);
  }

  private async listOpenWithdrawals(filter?: { userId?: string; requestType?: "manual" | "automatic" }) {
    let query = this.supabase
      .from("withdrawals")
      .select("*")
      .in("status", [...OPEN_QUEUE_STATUSES])
      .order("queue_number", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (filter?.userId) query = query.eq("user_id", filter.userId);
    if (filter?.requestType) query = query.eq("request_type", filter.requestType);

    const modern = await query;
    if (!modern.error) return this.mapRows(modern.data);

    if (!isPayoutSchemaCompatError(modern.error)) throw modern.error;

    let legacyQuery = this.supabase
      .from("withdrawals")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (filter?.userId) legacyQuery = legacyQuery.eq("user_id", filter.userId);

    const legacy = await legacyQuery;
    if (legacy.error) throw legacy.error;
    return this.mapRows(legacy.data);
  }

  private async countOpenWithdrawals(filter?: { userId?: string; requestType?: "manual" | "automatic" }) {
    let query = this.supabase
      .from("withdrawals")
      .select("id", { count: "exact", head: true })
      .in("status", [...OPEN_QUEUE_STATUSES]);

    if (filter?.userId) query = query.eq("user_id", filter.userId);
    if (filter?.requestType) query = query.eq("request_type", filter.requestType);

    const modern = await query;
    if (!modern.error) return modern.count ?? 0;

    if (!isPayoutSchemaCompatError(modern.error)) throw modern.error;

    let legacyQuery = this.supabase
      .from("withdrawals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if (filter?.userId) legacyQuery = legacyQuery.eq("user_id", filter.userId);

    const legacy = await legacyQuery;
    if (legacy.error) throw legacy.error;
    return legacy.count ?? 0;
  }

  private async getQueueConfig(): Promise<SettlementQueueConfig> {
    return this.settings.getSettlementQueueConfig();
  }

  /** Live 1-based FIFO position among open settlement-queue withdrawals. */
  async getLiveQueuePosition(withdrawalId: string, createdAt: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("withdrawals")
      .select("id", { count: "exact", head: true })
      .in("status", [...OPEN_QUEUE_STATUSES])
      .or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${withdrawalId})`);

    if (error) {
      // Fallback: load open list and compute locally.
      const open = await this.listOpenWithdrawals();
      const idx = open.findIndex((row) => row.id === withdrawalId);
      return idx >= 0 ? idx + 1 : open.length + 1;
    }

    return (count ?? 0) + 1;
  }

  async buildQueueView(withdrawal: Withdrawal, config?: SettlementQueueConfig) {
    const cfg = config ?? (await this.getQueueConfig());
    const position = await this.getLiveQueuePosition(withdrawal.id, withdrawal.created_at);
    const estimatedAt = estimateSettlementProcessingAt({
      queuePosition: position,
      config: cfg
    });
    const batchNumber = batchNumberForPosition(position, cfg.batch_size);
    const statusLabel = memberQueueStatusLabel(withdrawal);

    return {
      withdrawalId: withdrawal.id,
      settlementReference: withdrawal.settlement_reference ?? null,
      queuePosition: position,
      queueNumber: withdrawal.queue_number ?? position,
      batchNumber,
      estimatedProcessingAt: estimatedAt.toISOString(),
      estimatedProcessingLabel: formatSettlementEtaShort(estimatedAt),
      status: withdrawal.status,
      statusLabel,
      paused: cfg.paused,
      scheduleMessage: buildQueuedScheduleMessage({
        queuePosition: position,
        estimatedAt,
        settlementReference: withdrawal.settlement_reference
      })
    };
  }

  private async countPaidToday(asOf = new Date()) {
    const dayKey = asOf.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
    const startLagos = new Date(`${dayKey}T00:00:00+01:00`);
    const { count, error } = await this.supabase
      .from("withdrawals")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .gte("paid_at", startLagos.toISOString());
    if (error) return 0;
    return count ?? 0;
  }

  async getSettlementDashboard() {
    const config = await this.getQueueConfig();
    const open = await this.listOpenWithdrawals();
    const completedToday = await this.countPaidToday();
    const remainingToday = open.length;
    const dailyCap = config.max_daily_processing_limit;

    const { data: paidToday } = await this.supabase
      .from("withdrawals")
      .select("id, paid_at, reviewed_at, created_at, processing_started_at, settlement_reference")
      .eq("status", "paid")
      .gte("paid_at", new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString());

    const durations: number[] = [];
    for (const row of paidToday ?? []) {
      const start = row.processing_started_at ?? row.created_at;
      const end = row.paid_at ?? row.reviewed_at;
      if (start && end) {
        durations.push(new Date(end).getTime() - new Date(start).getTime());
      }
    }
    const avgMs =
      durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

    const queue = [];
    for (let i = 0; i < open.length; i++) {
      const row = open[i];
      const position = i + 1;
      const estimatedAt = estimateSettlementProcessingAt({
        queuePosition: position,
        config,
        completedToday
      });
      queue.push({
        ...row,
        liveQueuePosition: position,
        liveBatchNumber: batchNumberForPosition(position, config.batch_size),
        liveEstimatedProcessingAt: estimatedAt.toISOString(),
        statusLabel: memberQueueStatusLabel(row)
      });
    }

    const lastEta =
      queue.length > 0
        ? queue[queue.length - 1].liveEstimatedProcessingAt
        : estimateSettlementProcessingAt({ queuePosition: 1, config, completedToday }).toISOString();

    return {
      config,
      queue,
      stats: {
        completedToday,
        remainingToday,
        requestsPerBatch: config.batch_size,
        batchIntervalMinutes: config.batch_interval_minutes,
        estimatedCompletionAt: lastEta,
        averageProcessingMs: avgMs,
        paused: config.paused,
        opensLabel: formatSettlementOpenLabel(config),
        maxDailyProcessingLimit: dailyCap,
        dailyCapRemaining:
          dailyCap == null ? null : Math.max(0, dailyCap - completedToday)
      }
    };
  }

  private async insertWithdrawal(input: Database["public"]["Tables"]["withdrawals"]["Insert"]) {
    const modern = await this.supabase.from("withdrawals").insert(input).select().single();
    if (!modern.error) return normalizeWithdrawalRow(modern.data);

    // Unique idempotency_key / settlement_reference race — signal caller to re-fetch.
    if (modern.error.code === "23505") return null;

    if (!isPayoutSchemaCompatError(modern.error)) throw modern.error;

    const legacy = await this.supabase
      .from("withdrawals")
      .insert(toLegacyWithdrawalInsert(input))
      .select()
      .single();

    if (legacy.error) {
      if (legacy.error.code === "23505") return null;
      throw legacy.error;
    }
    return normalizeWithdrawalRow(legacy.data);
  }

  async listForUser(userId: string, limit = 50): Promise<Withdrawal[]> {
    const { data, error } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return this.mapRows(data);
  }

  async listRecent(limit = 100): Promise<Withdrawal[]> {
    const { data, error } = await this.supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return this.mapRows(data);
  }

  async listPending(): Promise<Withdrawal[]> {
    return this.listOpenWithdrawals();
  }

  async create(input: {
    userId: string;
    amount: number;
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankAccountId?: string | null;
    note?: string | null;
    idempotencyKey?: string | null;
    requestType?: "manual" | "automatic";
    asOf?: Date;
  }) {
    const accountNumber = normalizeAccountNumber(input.accountNumber);
    assertValidAccountNumber(accountNumber);

    const idempotencyKey = input.idempotencyKey?.trim() || null;
    if (idempotencyKey) {
      const { data: existingByKey } = await this.supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", input.userId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (existingByKey) {
        const row = normalizeWithdrawalRow(existingByKey);
        const queueView = await this.buildQueueView(row);
        return { ...row, queueView, scheduleMessage: queueView.scheduleMessage };
      }
    }

    const { data: profile } = await this.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", input.userId)
      .maybeSingle();
    const registeredName = profile?.full_name?.trim() ?? "";
    if (!registeredName || !accountNamesMatch(registeredName, input.accountName)) {
      throw new AppError(ACCOUNT_NAME_MISMATCH_MESSAGE, 400, "ACCOUNT_NAME_MISMATCH");
    }

    const kycCheck = await this.kyc.isWithdrawalAllowed(input.userId);
    if (!kycCheck.allowed) {
      throw new AppError(kycCheck.reason ?? "Identity verification is required before requesting a withdrawal.", 403, "KYC_REQUIRED");
    }

    const wallet = await this.wallet.getWalletByUserId(input.userId);
    const balance = await this.wallet.getBalance(wallet.id);
    const reserved = await this.sumOpenWithdrawalAmount(input.userId);
    if (balance - reserved < input.amount) {
      throw new AppError("Insufficient available balance.", 400, "INSUFFICIENT_BALANCE");
    }

    const requestType = input.requestType ?? "manual";

    if (requestType === "manual") {
      const pendingCount = await this.countOpenWithdrawals({ userId: input.userId });
      if (pendingCount > 0) {
        throw new AppError(
          "You already have an open withdrawal request. Wait for it to complete or cancel it before requesting another.",
          409,
          "PENDING_EXISTS",
          "You already have an open withdrawal request. Check Withdrawal history below.",
          "business",
          { label: "View withdrawals", href: "/withdrawals" }
        );
      }
    } else {
      try {
        const autoCount = await this.countOpenWithdrawals({ userId: input.userId, requestType: "automatic" });
        if (autoCount > 0) return null;
      } catch {
        const pendingCount = await this.countOpenWithdrawals({ userId: input.userId });
        if (pendingCount > 0) return null;
      }
    }

    const queue = resolvePayoutQueue({ now: input.asOf });
    const status = requestType === "automatic" && queue.status === "pending" ? "pending" : queue.status;
    const config = await this.getQueueConfig();
    const openAhead = await this.countOpenWithdrawals();
    const queuePosition = openAhead + 1;
    const completedToday = await this.countPaidToday();
    const estimatedAt = estimateSettlementProcessingAt({
      queuePosition,
      config,
      now: input.asOf ?? new Date(),
      completedToday
    });
    const batchNumber = batchNumberForPosition(queuePosition, config.batch_size);
    const queuedAt = new Date().toISOString();
    const settlementReference = await nextSettlementReference(this.supabase);

    const data = await this.insertWithdrawal({
      user_id: input.userId,
      amount: input.amount,
      bank_name: input.bankName,
      account_name: input.accountName,
      account_number: accountNumber,
      bank_account_id: input.bankAccountId ?? null,
      note: input.note ?? null,
      idempotency_key: idempotencyKey,
      request_type: requestType,
      scheduled_at: queue.scheduledAt.toISOString(),
      status,
      queue_number: queuePosition,
      batch_number: batchNumber,
      estimated_processing_at: estimatedAt.toISOString(),
      queued_at: queuedAt,
      settlement_reference: settlementReference
    });

    if (!data) {
      // Unique idempotency race — return the winner's row.
      if (idempotencyKey) {
        const { data: raced } = await this.supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", input.userId)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        if (raced) {
          const row = normalizeWithdrawalRow(raced);
          const queueView = await this.buildQueueView(row);
          return { ...row, queueView, scheduleMessage: queueView.scheduleMessage };
        }
      }
      return null;
    }

    const queueView = await this.buildQueueView(data, config);
    const scheduleMessage = queueView.scheduleMessage;

    const event = requestType === "automatic" ? "withdrawal.auto_created" : "withdrawal.submitted";
    await this.notifications.notifyEvent(event, input.userId, {
      amount: input.amount,
      withdrawal_id: data.id,
      settlement_reference: settlementReference,
      scheduled_at: queue.scheduledAt.toISOString(),
      schedule_message: scheduleMessage,
      queue_position: queueView.queuePosition,
      estimated_processing_at: queueView.estimatedProcessingAt
    });

    return { ...data, queueView, scheduleMessage, settlementReference };
  }

  async createAutomaticFromSettlement(input: {
    userId: string;
    amount: number;
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankAccountId?: string | null;
    asOf?: Date;
  }) {
    if (input.amount <= 0) return null;
    return this.create({
      ...input,
      requestType: "automatic",
      note: "Automatic weekly earnings withdrawal"
    });
  }

  async promoteScheduledWithdrawals(asOf = new Date()) {
    const { data, error } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", asOf.toISOString());

    if (error) {
      if (isPayoutSchemaCompatError(error)) return 0;
      throw error;
    }

    for (const withdrawal of data ?? []) {
      const config = await this.getQueueConfig();
      const openAhead = await this.countOpenWithdrawals();
      // This row is still scheduled; countOpen includes it once status flips — use ahead among still-open excluding self.
      const position = Math.max(1, openAhead);
      const estimatedAt = estimateSettlementProcessingAt({ queuePosition: position, config, now: asOf });

      await this.supabase
        .from("withdrawals")
        .update({
          status: "pending",
          queued_at: asOf.toISOString(),
          queue_number: position,
          batch_number: batchNumberForPosition(position, config.batch_size),
          estimated_processing_at: estimatedAt.toISOString()
        } as Database["public"]["Tables"]["withdrawals"]["Update"])
        .eq("id", withdrawal.id);

      const queueView = await this.buildQueueView(
        normalizeWithdrawalRow({
          ...withdrawal,
          status: "pending",
          queued_at: asOf.toISOString(),
          queue_number: position,
          batch_number: batchNumberForPosition(position, config.batch_size),
          estimated_processing_at: estimatedAt.toISOString()
        } as Withdrawal),
        config
      );

      await this.notifications.notifyEvent("withdrawal.submitted", withdrawal.user_id, {
        amount: Number(withdrawal.amount),
        withdrawal_id: withdrawal.id,
        schedule_message: queueView.scheduleMessage,
        queue_position: queueView.queuePosition,
        estimated_processing_at: queueView.estimatedProcessingAt
      });
    }

    return data?.length ?? 0;
  }

  /** Move to Under Review — does not debit wallet. */
  async approve(withdrawalId: string, reviewerId: string) {
    const { data: withdrawal, error: fetchError } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) throw new AppError("Withdrawal not found", 404, "NOT_FOUND");
    if (withdrawal.status !== "pending" && withdrawal.status !== "scheduled") {
      throw new AppError("Withdrawal is not queued", 409, "INVALID_STATUS");
    }

    const { data, error } = await this.supabase
      .from("withdrawals")
      .update({
        status: "approved",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      } as Database["public"]["Tables"]["withdrawals"]["Update"])
      .eq("id", withdrawalId)
      .in("status", ["pending", "scheduled"])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new AppError("Withdrawal is no longer queued", 409, "INVALID_STATUS");

    await this.notifications.notifyEvent("withdrawal.approved", withdrawal.user_id, {
      amount: Number(withdrawal.amount),
      withdrawal_id: withdrawalId,
      settlement_reference: withdrawal.settlement_reference ?? null
    });

    return normalizeWithdrawalRow(data);
  }

  async startProcessing(withdrawalId: string, reviewerId: string) {
    const { data: withdrawal, error: fetchError } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) throw new AppError("Withdrawal not found", 404, "NOT_FOUND");
    if (!["pending", "scheduled", "approved"].includes(withdrawal.status)) {
      throw new AppError("Withdrawal cannot enter processing", 409, "INVALID_STATUS");
    }

    const startedAt = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("withdrawals")
      .update({
        status: "processing",
        processing_started_at: startedAt,
        reviewed_by: reviewerId,
        reviewed_at: startedAt
      } as Database["public"]["Tables"]["withdrawals"]["Update"])
      .eq("id", withdrawalId)
      .in("status", ["pending", "scheduled", "approved"])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const { data: current } = await this.supabase.from("withdrawals").select("*").eq("id", withdrawalId).single();
      if (current?.status === "processing" || current?.status === "paid") {
        return normalizeWithdrawalRow(current);
      }
      throw new AppError("Withdrawal update failed", 409, "INVALID_STATUS");
    }

    await this.notifications.notifyEvent("withdrawal.processing", withdrawal.user_id, {
      amount: Number(withdrawal.amount),
      withdrawal_id: withdrawalId,
      settlement_reference: withdrawal.settlement_reference ?? null
    });

    return normalizeWithdrawalRow(data);
  }

  /** Debit wallet and mark paid — terminal success state. Exactly-once safe. */
  async markPaid(withdrawalId: string, reviewerId: string) {
    // Row-locked claim → processing (or return if already paid).
    const { data: claimPayload, error: rpcError } = await this.supabase.rpc(
      "claim_withdrawal_for_paid" as never,
      { p_withdrawal_id: withdrawalId, p_reviewer_id: reviewerId } as never
    );

    let withdrawal: Withdrawal | null = null;
    let claimed = false;

    if (!rpcError && claimPayload && typeof claimPayload === "object") {
      const payload = claimPayload as {
        claimed?: boolean;
        withdrawal?: Withdrawal;
      };
      claimed = Boolean(payload.claimed);
      withdrawal = payload.withdrawal ? normalizeWithdrawalRow(payload.withdrawal) : null;
      if (withdrawal?.status === "paid" && !claimed) {
        return withdrawal;
      }
    } else {
      const { data: fetched, error: fetchError } = await this.supabase
        .from("withdrawals")
        .select("*")
        .eq("id", withdrawalId)
        .single();
      if (fetchError) throw fetchError;
      withdrawal = normalizeWithdrawalRow(fetched);
      if (withdrawal.status === "paid") return withdrawal;
      if (!["pending", "scheduled", "approved", "processing"].includes(withdrawal.status)) {
        throw new AppError("Withdrawal is not payable", 409, "INVALID_STATUS");
      }
      claimed = true;
    }

    if (!withdrawal) throw new AppError("Withdrawal not found", 404, "NOT_FOUND");
    if (!claimed && withdrawal.status !== "processing") {
      throw new AppError("Withdrawal is not payable", 409, "INVALID_STATUS");
    }

    // Never mark paid without a ledger debit first.
    const wallet = await this.wallet.getWalletByUserId(withdrawal.user_id);
    const balance = await this.wallet.getBalance(wallet.id);
    const reservedOthers = await this.sumOpenWithdrawalAmount(withdrawal.user_id, withdrawalId);
    if (balance - reservedOthers < Number(withdrawal.amount)) {
      throw new AppError("Insufficient available balance.", 400, "INSUFFICIENT_BALANCE");
    }

    let txId: string;
    try {
      const tx = await this.wallet.debitWithdrawal(
        wallet.id,
        Number(withdrawal.amount),
        withdrawalId,
        withdrawal.settlement_reference
      );
      txId = tx.id;
    } catch (debitError) {
      const message = debitError instanceof Error ? debitError.message : String(debitError);
      if (!/duplicate|unique/i.test(message)) throw debitError;
      const refs = [withdrawal.settlement_reference, `WD-${withdrawalId}`].filter(Boolean) as string[];
      let existing: { id: string } | null = null;
      for (const ref of refs) {
        const { data } = await this.supabase
          .from("wallet_transactions")
          .select("id")
          .eq("reference", ref)
          .maybeSingle();
        if (data) {
          existing = data;
          break;
        }
      }
      if (!existing) throw debitError;
      txId = existing.id;
    }

    const paidAt = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("withdrawals")
      .update({
        status: "paid",
        reviewed_by: reviewerId,
        reviewed_at: paidAt,
        paid_at: paidAt,
        processing_started_at: withdrawal.processing_started_at ?? paidAt,
        wallet_transaction_id: txId
      } as Database["public"]["Tables"]["withdrawals"]["Update"])
      .eq("id", withdrawalId)
      .in("status", ["pending", "scheduled", "approved", "processing"])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const { data: current } = await this.supabase.from("withdrawals").select("*").eq("id", withdrawalId).single();
      if (current?.status === "paid") {
        // Ensure paid row always has a ledger link.
        if (!current.wallet_transaction_id && txId) {
          await this.supabase
            .from("withdrawals")
            .update({ wallet_transaction_id: txId } as Database["public"]["Tables"]["withdrawals"]["Update"])
            .eq("id", withdrawalId);
        }
        return normalizeWithdrawalRow(current);
      }
      throw new AppError("Withdrawal is no longer payable", 409, "INVALID_STATUS");
    }

    await this.notifications.notifyEvent("withdrawal.paid", withdrawal.user_id, {
      amount: Number(withdrawal.amount),
      withdrawal_id: withdrawalId,
      settlement_reference: withdrawal.settlement_reference ?? null
    });

    return normalizeWithdrawalRow(data);
  }

  /** Skip — move to end of FIFO queue without rejecting. */
  async skip(withdrawalId: string, reviewerId: string) {
    const open = await this.listOpenWithdrawals();
    const target = open.find((row) => row.id === withdrawalId);
    if (!target) throw new AppError("Withdrawal is not in the open queue", 409, "INVALID_STATUS");

    const config = await this.getQueueConfig();
    const maxQueue = open.reduce((max, row) => Math.max(max, Number(row.queue_number ?? 0)), 0);
    const newPosition = Math.max(open.length, maxQueue + 1);
    const estimatedAt = estimateSettlementProcessingAt({ queuePosition: newPosition, config });

    const { data, error } = await this.supabase
      .from("withdrawals")
      .update({
        queue_number: newPosition,
        batch_number: batchNumberForPosition(newPosition, config.batch_size),
        estimated_processing_at: estimatedAt.toISOString(),
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        note: `${target.note ? `${target.note} | ` : ""}SKIPPED_BY_ADMIN`
      } as Database["public"]["Tables"]["withdrawals"]["Update"])
      .eq("id", withdrawalId)
      .select()
      .single();

    if (error) throw error;
    return normalizeWithdrawalRow(data);
  }

  private async sumOpenWithdrawalAmount(userId: string, excludeId?: string) {
    const { data, error } = await this.supabase
      .from("withdrawals")
      .select("id, amount")
      .eq("user_id", userId)
      .in("status", [...RESERVED_STATUSES]);
    if (error) throw error;
    return (data ?? [])
      .filter((row) => row.id !== excludeId)
      .reduce((sum, row) => sum + Number(row.amount), 0);
  }

  async reject(withdrawalId: string, reviewerId: string, reason: string) {
    const { data: withdrawal, error: fetchError } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) throw new AppError("Withdrawal not found", 404, "NOT_FOUND");
    if (![...OPEN_QUEUE_STATUSES].includes(withdrawal.status as (typeof OPEN_QUEUE_STATUSES)[number])) {
      throw new AppError("Withdrawal is not open", 409, "INVALID_STATUS");
    }

    const { data, error } = await this.supabase
      .from("withdrawals")
      .update({
        status: "rejected",
        rejection_reason: reason,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      } as Database["public"]["Tables"]["withdrawals"]["Update"])
      .eq("id", withdrawalId)
      .in("status", [...OPEN_QUEUE_STATUSES])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new AppError("Withdrawal is no longer open", 409, "INVALID_STATUS");
    }

    await this.notifications.notifyEvent("withdrawal.rejected", withdrawal.user_id, {
      amount: Number(withdrawal.amount),
      reason,
      withdrawal_id: withdrawalId
    });

    return normalizeWithdrawalRow(data);
  }

  async cancel(withdrawalId: string, userId: string) {
    const { data: withdrawal, error: fetchError } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .eq("user_id", userId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) throw new AppError("Withdrawal not found", 404, "NOT_FOUND");
    if (!["pending", "scheduled"].includes(withdrawal.status)) {
      throw new AppError("Only queued withdrawal requests can be cancelled.", 409, "INVALID_STATUS");
    }

    const { data, error } = await this.supabase
      .from("withdrawals")
      .update({ status: "cancelled" } as Database["public"]["Tables"]["withdrawals"]["Update"])
      .eq("id", withdrawalId)
      .select()
      .single();

    if (error) throw error;
    return normalizeWithdrawalRow(data);
  }
}
