import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { WalletService, REFERRAL_WALLET_CURRENCY } from "@/services/wallet/wallet.service";
import { SettingsService } from "@/services/admin/settings.service";
import { NotificationService } from "@/services/notification/notification.service";
import {
  mergeReferralProgramConfig,
  resolvePackageCommissionRate,
  type ReferralProgramConfig
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
    if (!referral || String(referral.status) !== "pending") return null;

    const referrerId = String(referral.referrer_id);
    const referralId = String(referral.id);
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
    const tx = await this.wallet.creditReferralCommission(refWallet.id, commission, referralId, {
      investment_id: investmentId,
      referred_user_id: referredUserId,
      package_tier: planTier,
      commission_rate: rate
    });

    await this.supabase
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
      .eq("id", referralId);

    await this.supabase.from("referral_rewards").insert({
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
      const tx = await this.wallet.creditReferralCommission(refWallet.id, earned.milestone_bonus, `milestone-${earned.level}`, {
        milestone_level: earned.level,
        reward_type: "milestone"
      });

      await this.supabase.from("referral_rewards").insert({
        referrer_id: referrerId,
        referral_id: null,
        reward_type: "milestone",
        amount: earned.milestone_bonus,
        status: "available",
        wallet_transaction_id: tx.id,
        metadata: { vip_level: earned.level, label: earned.label } as Json
      });
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
    const inviteLink = `${siteUrl.replace(/\/$/, "")}/auth/register?ref=${inviteCode}`;
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
      ? await this.supabase.from("profiles").select("id, full_name").in("id", referredIds)
      : { data: [] };

    const nameById = new Map((referredProfiles ?? []).map((p) => [p.id, p.full_name]));

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
    const payoutGap = Math.max(0, config.min_payout_threshold - availableBalance);

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
      canRequestPayout: config.enabled && availableBalance >= config.min_payout_threshold,
      payoutGap,
      recentReferrals: (referrals ?? []).slice(0, 10).map((r) => ({
        id: r.id as string,
        referredName: nameById.get(r.referred_id as string) ?? "Member",
        status: String(r.status),
        investmentAmount: r.investment_amount != null ? Number(r.investment_amount) : null,
        packageTier: r.package_tier as string | null,
        commissionAmount: Number(r.commission_amount ?? 0),
        createdAt: r.created_at as string,
        verifiedAt: r.verified_at as string | null
      })),
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
      throw new AppError(`Minimum referral payout is ₦${config.min_payout_threshold.toLocaleString("en-NG")}.`, 400, "BELOW_MINIMUM");
    }

    const { data: payout, error } = await this.supabase
      .from("referral_payouts")
      .insert({
        user_id: userId,
        amount: input.amount,
        status: "pending",
        bank_name: input.bankName,
        account_name: input.accountName,
        account_number: input.accountNumber,
        bank_account_id: input.bankAccountId ?? null
      })
      .select()
      .single();

    if (error) throw error;

    const payoutId = String(payout.id);
    const tx = await this.wallet.debitReferralPayout(refWallet.id, input.amount, payoutId);

    await this.supabase.from("referral_payouts").update({ wallet_transaction_id: tx.id }).eq("id", payoutId);

    await this.notifications.notifyEvent("referral.payout_requested", userId, {
      amount: input.amount,
      payout_id: payoutId
    });

    return payout;
  }

  async listPendingPayouts() {
    const { data, error } = await this.supabase
      .from("referral_payouts")
      .select("*")
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: true });

    if (error) throw error;
    const rows = data ?? [];
    const userIds = [...new Set(rows.map((r) => String(r.user_id)))];
    const { data: profiles } = userIds.length
      ? await this.supabase.from("profiles").select("id, full_name, phone").in("id", userIds)
      : { data: [] };

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return rows.map((row) => ({
      ...row,
      profiles: profileMap.get(String(row.user_id)) ?? undefined
    }));
  }

  async reviewPayout(
    payoutId: string,
    action: "approve" | "reject" | "paid",
    reviewerId: string,
    rejectionReason?: string
  ) {
    const { data: payout, error } = await this.supabase.from("referral_payouts").select("*").eq("id", payoutId).single();
    if (error || !payout) throw Errors.notFound("Referral payout");

    const statusMap = { approve: "approved", reject: "rejected", paid: "paid" } as const;
    const nextStatus = statusMap[action];

    if (action === "reject") {
      const refWallet = await this.getReferralWallet(payout.user_id as string);
      await this.wallet.creditReferralCommission(
        refWallet.id,
        Number(payout.amount),
        `ref-payout-reversal-${payoutId}`,
        { reversal_of: payoutId, reason: rejectionReason ?? "rejected" }
      );
    }

    if (action === "paid" && payout.wallet_transaction_id) {
      await this.wallet.completeReferralPayoutDebit(payout.wallet_transaction_id as string);
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
      { amount: payout.amount, payout_id: payoutId, reason: rejectionReason }
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
