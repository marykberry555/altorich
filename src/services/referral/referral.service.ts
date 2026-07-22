import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { assertValidAccountNumber, normalizeAccountNumber } from "@/lib/validation/identity";
import { WalletService, REFERRAL_WALLET_CURRENCY } from "@/services/wallet/wallet.service";
import { SettingsService } from "@/services/admin/settings.service";
import { NotificationService } from "@/services/notification/notification.service";
import { evaluateReferralPayoutEligibility, referralSettlementBatchForCreatedAt } from "@/lib/referral/settlement";
import {
  batchNumberForPosition,
  buildQueuedScheduleMessage,
  estimateSettlementProcessingAt,
  formatSettlementEtaShort,
  memberQueueStatusLabel,
  mergeSettlementQueueConfig,
  SETTLEMENT_QUEUE_SETTINGS_KEY,
  type SettlementQueueConfig
} from "@/lib/payout/settlement-queue";
import { nextSettlementReference } from "@/lib/payout/settlement-reference";
import type { ReferralProgramConfig } from "@/lib/referral/config";
import {
  mergeReferralProgramConfig,
  resolvePackageCommissionRate
} from "@/lib/referral/config";
import type {
  ReferralActivityRow,
  ReferralDashboard,
  ReferralRewardRow,
  VipLevelConfig
} from "@/lib/referral/types";
import { normalizeReferralVipLevels } from "@/lib/referral/vip-display";

export type { ReferralDashboard, ReferralActivityRow, ReferralRewardRow, VipLevelConfig };

type Client = SupabaseClient<Database>;

export class ReferralService {
  private readonly wallet: WalletService;
  private readonly settings: SettingsService;
  private readonly notifications: NotificationService;

  constructor(private readonly supabase: Client) {
    this.wallet = new WalletService(supabase);
    this.settings = new SettingsService(supabase);
    this.notifications = new NotificationService(supabase);
  }

  async getProgramConfig(): Promise<ReferralProgramConfig> {
    const raw = await this.settings.get<Partial<ReferralProgramConfig>>("referral_program");
    return mergeReferralProgramConfig(raw);
  }

  private async getSettlementQueueConfig(): Promise<SettlementQueueConfig> {
    const raw = await this.settings.get<Partial<SettlementQueueConfig>>(SETTLEMENT_QUEUE_SETTINGS_KEY);
    return mergeSettlementQueueConfig(raw);
  }

  private async countOpenReferralPayouts() {
    const { count, error } = await this.supabase
      .from("referral_payouts")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "processing", "approved"]);
    if (error) throw error;
    return count ?? 0;
  }

  buildReferralQueueView(payout: {
    id: string;
    status: string;
    queue_number?: number | null;
    settlement_reference?: string | null;
    estimated_processing_at?: string | null;
    created_at?: string;
  }, config: SettlementQueueConfig, position: number) {
    const estimatedAt = payout.estimated_processing_at
      ? new Date(payout.estimated_processing_at)
      : estimateSettlementProcessingAt({ queuePosition: position, config });
    return {
      payoutId: payout.id,
      settlementReference: payout.settlement_reference ?? null,
      queuePosition: position,
      queueNumber: payout.queue_number ?? position,
      batchNumber: batchNumberForPosition(position, config.batch_size),
      estimatedProcessingAt: estimatedAt.toISOString(),
      estimatedProcessingLabel: formatSettlementEtaShort(estimatedAt),
      status: payout.status,
      statusLabel: memberQueueStatusLabel({ status: payout.status }),
      paused: config.paused,
      scheduleMessage: buildQueuedScheduleMessage({
        queuePosition: position,
        estimatedAt,
        settlementReference: payout.settlement_reference
      })
    };
  }

  async updateProgramConfig(updates: Partial<ReferralProgramConfig>, updatedBy?: string) {
    const current = await this.getProgramConfig();
    const { error } = await this.supabase.from("settings").upsert({
      key: "referral_program",
      value: { ...current, ...updates, commission_by_package: { ...current.commission_by_package, ...(updates.commission_by_package ?? {}) } },
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString()
    } as Database["public"]["Tables"]["settings"]["Insert"]);
    if (error) throw error;
  }

  async listVipLevels(): Promise<VipLevelConfig[]> {
    const config = await this.getProgramConfig();
    const { data, error } = await this.supabase.from("vip_levels").select("*").order("level", { ascending: true });
    if (error) throw error;

    const raw = (data ?? []).map((row) => ({
      level: Number(row.level),
      label: String(row.label),
      min_members: Number(row.min_members),
      commission_percent: Number((row as { commission_percent?: number }).commission_percent),
      milestone_bonus: Number((row as { milestone_bonus?: number }).milestone_bonus ?? 0),
      perks: Array.isArray(row.perks) ? (row.perks as string[]) : []
    }));

    return normalizeReferralVipLevels(raw, config);
  }

  async updateVipLevel(level: number, updates: Partial<VipLevelConfig>, updatedBy?: string) {
    const { error } = await this.supabase
      .from("vip_levels")
      .update({
        label: updates.label,
        min_members: updates.min_members,
        commission_percent: updates.commission_percent,
        milestone_bonus: updates.milestone_bonus,
        perks: updates.perks as Json
      } as Database["public"]["Tables"]["vip_levels"]["Update"])
      .eq("level", level);
    if (error) throw error;

    await this.supabase.from("audit_logs").insert({
      actor_id: updatedBy ?? null,
      action: "vip_level.updated",
      entity_type: "vip_level",
      entity_id: null,
      metadata: { level, ...updates } as Json
    });
  }

  async getReferralWallet(userId: string) {
    return this.wallet.getWalletByUserId(userId, REFERRAL_WALLET_CURRENCY);
  }

  async ensureReferralWallet(userId: string) {
    try {
      return await this.getReferralWallet(userId);
    } catch {
      const { data, error } = await this.supabase
        .from("wallets")
        .insert({ user_id: userId, currency: REFERRAL_WALLET_CURRENCY })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  async processFirstInvestmentActivated(
    referredUserId: string,
    investmentId: string,
    amount: number,
    planTier: string
  ) {
    const config = await this.getProgramConfig();
    if (!config.enabled) return null;

    const { count: priorActive } = await this.supabase
      .from("investments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", referredUserId)
      .eq("status", "active")
      .neq("id", investmentId);

    if ((priorActive ?? 0) > 0) return null;

    const { data: referral, error: refError } = await this.supabase
      .from("referrals")
      .select("*")
      .eq("referred_id", referredUserId)
      .maybeSingle();

    if (refError) throw refError;
    // Early exit if still pending without claim RPC (RPC unavailable) — keep old guard.
    if (!referral || !["pending", "qualified"].includes(String(referral.status))) return null;

    const referrerId = String(referral.referrer_id);
    const referralId = String(referral.id);

    // Row lock + pending→qualified claim (exactly-once commission).
    const { data: claimPayload } = await this.supabase.rpc(
      "claim_referral_for_commission" as never,
      { p_referral_id: referralId } as never
    );
    if (claimPayload && typeof claimPayload === "object") {
      const payload = claimPayload as { claimed?: boolean; already_processed?: boolean };
      if (payload.already_processed) return null;
      if (payload.claimed === false) return null;
    }

    const vipLevels = await this.listVipLevels();
    const { data: referrerProfile } = await this.supabase
      .from("profiles")
      .select("vip_level, full_name")
      .eq("id", referrerId)
      .single();

    const vipLevel = Number(referrerProfile?.vip_level ?? 0);
    const vipConfig = vipLevels.find((v) => v.level === vipLevel) ?? vipLevels[0];
    const rate = resolvePackageCommissionRate(planTier, config, vipConfig);
    const commission = Math.round((amount * rate) / 100);

    if (commission <= 0) return null;

    const refWallet = await this.ensureReferralWallet(referrerId);
    // Stable ledger ref REF-CR-{referralId} — duplicate jobs reuse the same credit.
    const tx = await this.wallet.creditReferralCommission(refWallet.id, commission, referralId, {
      investment_id: investmentId,
      referred_user_id: referredUserId,
      package_tier: planTier,
      commission_rate: rate
    });

    const { data: claimedReferral } = await this.supabase
      .from("referrals")
      .update({
        status: "verified",
        first_investment_id: investmentId,
        investment_amount: amount,
        package_tier: planTier,
        commission_rate: rate,
        commission_amount: commission,
        wallet_transaction_id: tx.id,
        verified_at: new Date().toISOString(),
        qualified_at: new Date().toISOString()
      } as Database["public"]["Tables"]["referrals"]["Update"])
      .eq("id", referralId)
      .in("status", ["pending", "qualified"])
      .select("id")
      .maybeSingle();

    // If another worker already verified, unique reward index still prevents duplicates.
    if (!claimedReferral) return { referralId, commission, rate };

    const { error: rewardError } = await this.supabase.from("referral_rewards").insert({
      referrer_id: referrerId,
      referral_id: referralId,
      reward_type: "commission",
      amount: commission,
      status: "available",
      wallet_transaction_id: tx.id,
      metadata: {
        investment_id: investmentId,
        package_tier: planTier,
        commission_rate: rate
      } as Json
    });

    if (rewardError && rewardError.code !== "23505") throw rewardError;

    await this.notifications.notifyEvent("referral.verified", referrerId, {
      amount: commission,
      referred_user_id: referredUserId,
      package_tier: planTier
    });

    await this.syncVipProgression(referrerId, vipLevels, config);

    return { referralId, commission, rate };
  }

  private async syncVipProgression(referrerId: string, vipLevels: VipLevelConfig[], config: ReferralProgramConfig) {
    const verifiedCount = await this.countVerifiedReferrals(referrerId);
    const sorted = [...vipLevels].sort((a, b) => b.level - a.level);
    const earned = sorted.find((v) => verifiedCount >= v.min_members) ?? vipLevels[0];

    const { data: profile } = await this.supabase.from("profiles").select("vip_level").eq("id", referrerId).single();
    const currentLevel = Number(profile?.vip_level ?? 0);

    if (earned.level <= currentLevel) return;

    await this.supabase.from("profiles").update({ vip_level: earned.level }).eq("id", referrerId);

    if (config.milestone_bonuses_enabled && earned.milestone_bonus > 0) {
      const refWallet = await this.ensureReferralWallet(referrerId);
      const milestoneRef = `milestone-${referrerId}-L${earned.level}`;
      const tx = await this.wallet.creditReferralCommission(refWallet.id, earned.milestone_bonus, milestoneRef, {
        milestone_level: earned.level,
        reward_type: "milestone"
      });

      const { error: milestoneErr } = await this.supabase.from("referral_rewards").insert({
        referrer_id: referrerId,
        referral_id: null,
        reward_type: "milestone",
        amount: earned.milestone_bonus,
        status: "available",
        wallet_transaction_id: tx.id,
        metadata: { vip_level: earned.level, label: earned.label } as Json
      });
      if (milestoneErr && milestoneErr.code !== "23505") throw milestoneErr;
    }

    await this.notifications.notifyEvent("vip.level_up", referrerId, {
      level: earned.level,
      label: earned.label,
      commission_percent: earned.commission_percent,
      milestone_bonus: earned.milestone_bonus
    });
  }

  async countVerifiedReferrals(referrerId: string) {
    const { count, error } = await this.supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", referrerId)
      .in("status", ["verified", "qualified", "paid"]);

    if (error) throw error;
    return count ?? 0;
  }

  async getDashboard(userId: string, siteUrl: string): Promise<ReferralDashboard> {
    const config = await this.getProgramConfig();
    const vipLevels = await this.listVipLevels();

    const { data: profile } = await this.supabase
      .from("profiles")
      .select("invite_code, vip_level")
      .eq("id", userId)
      .single();

    const inviteCode = profile?.invite_code ?? "";
    const inviteLink = `${siteUrl.replace(/\/$/, "")}/r/${inviteCode}`;
    const vipLevel = Number(profile?.vip_level ?? 0);
    const currentVip = vipLevels.find((v) => v.level === vipLevel) ?? vipLevels[0];
    const nextVip = vipLevels.find((v) => v.level === vipLevel + 1) ?? null;

    const { data: referrals } = await this.supabase
      .from("referrals")
      .select("id, status, commission_amount, investment_amount, package_tier, created_at, verified_at, referred_id")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    const referredIds = (referrals ?? []).map((r) => r.referred_id as string);
    const { data: referredProfiles } = referredIds.length
      ? await this.supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", referredIds)
      : { data: [] };

    const profileById = new Map(
      (referredProfiles ?? []).map((p) => [
        p.id,
        {
          fullName: p.full_name,
          username: p.username as string | null,
          avatarUrl: p.avatar_url as string | null
        }
      ])
    );

    const verified = (referrals ?? []).filter((r) => ["verified", "qualified", "paid"].includes(String(r.status)));
    const pending = (referrals ?? []).filter((r) => r.status === "pending");

    const refWallet = await this.ensureReferralWallet(userId);
    const balance = await this.wallet.getBalance(refWallet.id);

    const { data: rewards } = await this.supabase
      .from("referral_rewards")
      .select("*")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const lifetimeRewards = (rewards ?? []).reduce((s, r) => s + Number(r.amount), 0);

    const { data: payouts } = await this.supabase
      .from("referral_payouts")
      .select("amount, status")
      .eq("user_id", userId);

    const alreadyPaid = (payouts ?? [])
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + Number(p.amount), 0);

    const pendingPayoutHold = (payouts ?? [])
      .filter((p) => ["pending", "processing", "approved"].includes(String(p.status)))
      .reduce((s, p) => s + Number(p.amount), 0);

    const availableBalance = Math.max(0, balance - pendingPayoutHold);
    const verifiedCount = verified.length;
    const totalInvestmentGenerated = verified.reduce((s, r) => s + Number(r.investment_amount ?? 0), 0);

    const requiredForNext = nextVip?.min_members ?? verifiedCount;
    const eligibility = evaluateReferralPayoutEligibility({
      availableBalance,
      minPayoutThreshold: config.min_payout_threshold,
      programEnabled: config.enabled
    });

    return {
      inviteCode,
      inviteLink,
      totalReferrals: referrals?.length ?? 0,
      verifiedInvestors: verifiedCount,
      pendingReferrals: pending.length,
      totalInvestmentGenerated,
      currentCommissionRate: currentVip.commission_percent,
      vipLevel,
      vipLabel: currentVip.label,
      nextVipLevel: nextVip,
      verifiedForNextLevel: verifiedCount,
      requiredForNextLevel: requiredForNext,
      referralWalletBalance: availableBalance,
      pendingRewards: pending.length,
      lifetimeRewards,
      alreadyPaid,
      minPayoutThreshold: config.min_payout_threshold,
      canRequestPayout: eligibility.canRequestPayout,
      payoutGap: eligibility.payoutGap,
      nextSettlementAt: eligibility.nextSettlementAt.toISOString(),
      settlementWindowOpen: eligibility.settlementWindowOpen,
      meetsPayoutThreshold: eligibility.meetsThreshold,
      eligibilityStatus: eligibility.eligibilityStatus,
      eligibilityMessage: eligibility.eligibilityMessage,
      recentReferrals: (referrals ?? []).slice(0, 10).map((r) => {
        const profile = profileById.get(r.referred_id as string);
        return {
          id: r.id as string,
          referredName: profile?.fullName ?? "Member",
          username: profile?.username ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
          status: String(r.status),
          investmentAmount: r.investment_amount != null ? Number(r.investment_amount) : null,
          packageTier: r.package_tier as string | null,
          commissionAmount: Number(r.commission_amount ?? 0),
          createdAt: r.created_at as string,
          verifiedAt: r.verified_at as string | null
        };
      }),
      recentRewards: (rewards ?? []).slice(0, 10).map((r) => ({
        id: r.id as string,
        rewardType: String(r.reward_type),
        amount: Number(r.amount),
        status: String(r.status),
        createdAt: r.created_at as string,
        metadata: (r.metadata as Record<string, unknown>) ?? {}
      })),
      programEnabled: config.enabled
    };
  }

  async requestPayout(
    userId: string,
    input: { amount: number; bankName: string; accountName: string; accountNumber: string; bankAccountId?: string }
  ) {
    const accountNumber = normalizeAccountNumber(input.accountNumber);
    assertValidAccountNumber(accountNumber);

    const config = await this.getProgramConfig();
    if (!config.enabled) throw Errors.badRequest("Referral programme is currently unavailable.");

    const refWallet = await this.ensureReferralWallet(userId);
    const balance = await this.wallet.getBalance(refWallet.id);

    const { data: payouts } = await this.supabase
      .from("referral_payouts")
      .select("amount, status")
      .eq("user_id", userId)
      .in("status", ["pending", "processing", "approved"]);

    const pendingHold = (payouts ?? []).reduce((s, p) => s + Number(p.amount), 0);
    const availableBalance = Math.max(0, balance - pendingHold);

    if (input.amount > availableBalance) {
      throw new AppError("Insufficient referral wallet balance.", 400, "INSUFFICIENT_BALANCE");
    }
    if (input.amount < config.min_payout_threshold) {
      throw new AppError(`Minimum referral withdrawal is ₦${config.min_payout_threshold.toLocaleString("en-NG")}.`, 400, "BELOW_MINIMUM");
    }

    const eligibility = evaluateReferralPayoutEligibility({
      availableBalance,
      minPayoutThreshold: config.min_payout_threshold,
      programEnabled: config.enabled
    });

    if (!eligibility.settlementWindowOpen) {
      throw new AppError(
        "Referral withdrawals open every Monday from 9:00 AM. Your rewards remain available until then.",
        403,
        "SETTLEMENT_WINDOW_CLOSED"
      );
    }

    if (!eligibility.meetsThreshold) {
      throw new AppError(eligibility.eligibilityMessage, 400, "BELOW_MINIMUM");
    }

    const configQueue = await this.getSettlementQueueConfig();
    const openAhead = await this.countOpenReferralPayouts();
    const queuePosition = openAhead + 1;
    const estimatedAt = estimateSettlementProcessingAt({
      queuePosition,
      config: configQueue
    });
    const batchNumber = batchNumberForPosition(queuePosition, configQueue.batch_size);
    const settlementReference = await nextSettlementReference(this.supabase);
    const queuedAt = new Date().toISOString();

    const { data: payout, error } = await this.supabase
      .from("referral_payouts")
      .insert({
        user_id: userId,
        amount: input.amount,
        status: "pending",
        bank_name: input.bankName,
        account_name: input.accountName,
        account_number: accountNumber,
        bank_account_id: input.bankAccountId ?? null,
        settlement_reference: settlementReference,
        queue_number: queuePosition,
        batch_number: batchNumber,
        estimated_processing_at: estimatedAt.toISOString(),
        queued_at: queuedAt
      })
      .select()
      .single();

    if (error) throw error;

    const payoutId = String(payout.id);
    const tx = await this.wallet.debitReferralPayout(refWallet.id, input.amount, payoutId);

    await this.supabase.from("referral_payouts").update({ wallet_transaction_id: tx.id }).eq("id", payoutId);

    const queueView = this.buildReferralQueueView(
      {
        id: payoutId,
        status: String(payout.status),
        queue_number: queuePosition,
        settlement_reference: settlementReference,
        estimated_processing_at: estimatedAt.toISOString()
      },
      configQueue,
      queuePosition
    );

    await this.notifications.notifyEvent("referral.payout_requested", userId, {
      amount: input.amount,
      payout_id: payoutId,
      settlement_reference: settlementReference,
      schedule_message: queueView.scheduleMessage,
      queue_position: queuePosition
    });

    return { ...payout, queueView, settlementReference, scheduleMessage: queueView.scheduleMessage };
  }

  async listPendingPayouts() {
    return this.listPayouts(["pending", "processing"]);
  }

  async listPayouts(statuses?: string[]) {
    let query = this.supabase.from("referral_payouts").select("*").order("created_at", { ascending: false }).limit(100);

    if (statuses?.length) {
      query = query.in("status", statuses);
    }

    const { data, error } = await query;

    if (error) throw error;
    const rows = data ?? [];
    const userIds = [...new Set(rows.map((r) => String(r.user_id)))];
    const { data: profiles } = userIds.length
      ? await this.supabase.from("profiles").select("id, full_name, phone").in("id", userIds)
      : { data: [] };

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return rows.map((row) => ({
      ...row,
      profiles: profileMap.get(String(row.user_id)) ?? undefined,
      settlement_batch: referralSettlementBatchForCreatedAt(String(row.created_at)),
      settlement_reference: (row as { settlement_reference?: string | null }).settlement_reference ?? null,
      queue_number: (row as { queue_number?: number | null }).queue_number ?? null,
      estimated_processing_at: (row as { estimated_processing_at?: string | null }).estimated_processing_at ?? null
    }));
  }

  async reviewPayout(
    payoutId: string,
    action: "approve" | "reject" | "paid",
    reviewerId: string,
    rejectionReason?: string
  ) {
    const { data: payout, error } = await this.supabase.from("referral_payouts").select("*").eq("id", payoutId).single();
    if (error || !payout) throw Errors.notFound("Referral withdrawal");

    const statusMap = { approve: "approved", reject: "rejected", paid: "paid" } as const;
    const nextStatus = statusMap[action];

    if (action === "paid") {
      const { data: claimPayload, error: rpcError } = await this.supabase.rpc(
        "claim_referral_payout_for_paid" as never,
        { p_payout_id: payoutId, p_reviewer_id: reviewerId } as never
      );

      let claimed = true;
      if (!rpcError && claimPayload && typeof claimPayload === "object") {
        const payload = claimPayload as { claimed?: boolean; payout?: Record<string, unknown> };
        claimed = Boolean(payload.claimed);
        if (payload.payout) {
          Object.assign(payout, payload.payout);
        }
        if (!claimed && String(payout.status) === "paid") {
          return payout;
        }
      } else if (String(payout.status) === "paid") {
        return payout;
      }

      if (!claimed && String(payout.status) !== "processing") {
        throw new AppError("Referral withdrawal is not payable", 409, "INVALID_STATUS");
      }

      if (payout.wallet_transaction_id) {
        await this.wallet.completeReferralPayoutDebit(payout.wallet_transaction_id as string, {
          reviewed_by: reviewerId,
          settlement_reference: (payout as { settlement_reference?: string | null }).settlement_reference ?? null
        });
      }

      const { data: updated, error: updateError } = await this.supabase
        .from("referral_payouts")
        .update({
          status: "paid",
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", payoutId)
        .in("status", ["pending", "processing", "approved"])
        .select()
        .maybeSingle();

      if (updateError) throw updateError;
      if (!updated) {
        const { data: current } = await this.supabase.from("referral_payouts").select("*").eq("id", payoutId).single();
        if (current?.status === "paid") return current;
        throw new AppError("Referral withdrawal is no longer payable", 409, "INVALID_STATUS");
      }

      await this.notifications.notifyEvent("referral.payout_approved", payout.user_id as string, {
        amount: payout.amount,
        payout_id: payoutId,
        settlement_reference: (payout as { settlement_reference?: string | null }).settlement_reference ?? null
      });

      return updated;
    }

    if (action === "reject") {
      const refWallet = await this.getReferralWallet(payout.user_id as string);
      await this.wallet.creditReferralCommission(
        refWallet.id,
        Number(payout.amount),
        `ref-payout-reversal-${payoutId}`,
        {
          reversal_of: payoutId,
          reason: rejectionReason ?? "rejected",
          ledger_event: "referral_withdrawal_rejected",
          ledger_label: "Referral Withdrawal Rejected"
        }
      );
    }

    if (action === "approve" && payout.wallet_transaction_id) {
      const { data: existing } = await this.supabase
        .from("wallet_transactions")
        .select("metadata")
        .eq("id", payout.wallet_transaction_id as string)
        .maybeSingle();
      const metadata = {
        ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
        ledger_event: "referral_withdrawal_approved",
        ledger_label: "Referral Withdrawal Approved"
      };
      await this.supabase
        .from("wallet_transactions")
        .update({ metadata })
        .eq("id", payout.wallet_transaction_id as string);
    }

    const { data: updated, error: updateError } = await this.supabase
      .from("referral_payouts")
      .update({
        status: nextStatus,
        rejection_reason: action === "reject" ? rejectionReason ?? "Rejected by admin" : null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", payoutId)
      .select()
      .single();

    if (updateError) throw updateError;

    await this.notifications.notifyEvent(
      action === "reject" ? "referral.payout_rejected" : "referral.payout_approved",
      payout.user_id as string,
      {
        amount: payout.amount,
        payout_id: payoutId,
        reason: rejectionReason,
        settlement_reference: (payout as { settlement_reference?: string | null }).settlement_reference ?? null
      }
    );

    return updated;
  }

  async getAdminAnalytics() {
    const { count: totalReferrals } = await this.supabase.from("referrals").select("id", { count: "exact", head: true });
    const { count: verifiedReferrals } = await this.supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .in("status", ["verified", "qualified", "paid"]);

    const { data: topReferrers } = await this.supabase
      .from("referrals")
      .select("referrer_id, commission_amount")
      .in("status", ["verified", "qualified", "paid"]);

    const totals = new Map<string, number>();
    for (const row of topReferrers ?? []) {
      const id = row.referrer_id as string;
      totals.set(id, (totals.get(id) ?? 0) + Number(row.commission_amount ?? 0));
    }

    const leaderboard = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([referrerId, total]) => ({ referrerId, total }));

    const referrerIds = leaderboard.map((l) => l.referrerId);
    const { data: profiles } = referrerIds.length
      ? await this.supabase.from("profiles").select("id, full_name, invite_code").in("id", referrerIds)
      : { data: [] };

    return {
      totalReferrals: totalReferrals ?? 0,
      verifiedReferrals: verifiedReferrals ?? 0,
      topReferrers: leaderboard.map((l) => ({
        ...l,
        name: profiles?.find((p) => p.id === l.referrerId)?.full_name ?? "Member",
        inviteCode: profiles?.find((p) => p.id === l.referrerId)?.invite_code ?? ""
      }))
    };
  }
}
