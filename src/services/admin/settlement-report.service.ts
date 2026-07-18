import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { lagosDayBounds, lagosDayKey, lagosWeekBounds } from "@/lib/finance/lagos-window";

type Client = SupabaseClient<Database>;

export type SettlementReportPeriod = "day" | "week";

export type SettlementReportLine = {
  kind: "withdrawal" | "referral_payout";
  id: string;
  user_id: string;
  member_name: string | null;
  amount: number;
  status: string;
  settlement_reference: string | null;
  bank_name: string | null;
  account_number: string | null;
  paid_at: string | null;
  queued_at: string | null;
  wait_minutes: number | null;
};

export type SettlementReport = {
  period: SettlementReportPeriod;
  timezone: "Africa/Lagos";
  dayKey: string;
  weekStartKey?: string;
  weekEndKey?: string;
  startIso: string;
  endIso: string;
  summary: {
    withdrawalsPaid: number;
    withdrawalsAmount: number;
    referralPayoutsPaid: number;
    referralAmount: number;
    totalPaid: number;
    totalAmount: number;
    avgWaitMinutes: number | null;
    uniqueMembers: number;
  };
  lines: SettlementReportLine[];
};

function waitMinutes(queuedAt: string | null, paidAt: string | null): number | null {
  if (!queuedAt || !paidAt) return null;
  const ms = new Date(paidAt).getTime() - new Date(queuedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.round(ms / 60_000);
}

export class SettlementReportService {
  constructor(private readonly supabase: Client) {}

  async build(period: SettlementReportPeriod, dayKey = lagosDayKey()): Promise<SettlementReport> {
    const bounds =
      period === "week"
        ? (() => {
            const w = lagosWeekBounds(dayKey);
            return {
              startIso: w.startIso,
              endIso: w.endIso,
              dayKey,
              weekStartKey: w.weekStartKey,
              weekEndKey: w.weekEndKey
            };
          })()
        : (() => {
            const d = lagosDayBounds(dayKey);
            return { startIso: d.startIso, endIso: d.endIso, dayKey };
          })();

    const [withdrawalsRes, referralRes] = await Promise.all([
      this.supabase
        .from("withdrawals")
        .select(
          "id, user_id, amount, status, settlement_reference, bank_name, account_number, paid_at, queued_at, created_at"
        )
        .eq("status", "paid")
        .gte("paid_at", bounds.startIso)
        .lte("paid_at", bounds.endIso)
        .order("paid_at", { ascending: true })
        .limit(2000),
      this.supabase
        .from("referral_payouts")
        .select("id, user_id, amount, status, settlement_reference, paid_at, created_at, reviewed_at")
        .eq("status", "paid")
        .gte("paid_at", bounds.startIso)
        .lte("paid_at", bounds.endIso)
        .order("paid_at", { ascending: true })
        .limit(2000)
    ]);

    if (withdrawalsRes.error) throw withdrawalsRes.error;
    if (referralRes.error) throw referralRes.error;

    type ReferralPaidRow = {
      id: string;
      user_id: string;
      amount: number | string;
      status: string;
      settlement_reference: string | null;
      paid_at: string | null;
      created_at: string;
      reviewed_at: string | null;
    };

    const withdrawalRows = withdrawalsRes.data ?? [];
    const referralRows = (referralRes.data ?? []) as unknown as ReferralPaidRow[];

    const userIds = [
      ...new Set([
        ...withdrawalRows.map((r) => r.user_id),
        ...referralRows.map((r) => r.user_id)
      ])
    ];
    const nameById = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await this.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      for (const p of profiles ?? []) nameById.set(p.id, p.full_name);
    }

    const lines: SettlementReportLine[] = [
      ...withdrawalRows.map((r) => ({
        kind: "withdrawal" as const,
        id: r.id,
        user_id: r.user_id,
        member_name: nameById.get(r.user_id) ?? null,
        amount: Number(r.amount),
        status: r.status,
        settlement_reference: r.settlement_reference,
        bank_name: r.bank_name,
        account_number: r.account_number,
        paid_at: r.paid_at,
        queued_at: r.queued_at,
        wait_minutes: waitMinutes(r.queued_at ?? r.created_at, r.paid_at)
      })),
      ...referralRows.map((r) => ({
        kind: "referral_payout" as const,
        id: r.id,
        user_id: r.user_id,
        member_name: nameById.get(r.user_id) ?? null,
        amount: Number(r.amount),
        status: r.status,
        settlement_reference: r.settlement_reference ?? null,
        bank_name: null,
        account_number: null,
        paid_at: r.paid_at,
        queued_at: r.created_at,
        wait_minutes: waitMinutes(r.created_at, r.paid_at)
      }))
    ].sort((a, b) => String(a.paid_at).localeCompare(String(b.paid_at)));

    const waits = lines.map((l) => l.wait_minutes).filter((n): n is number => n != null);
    const withdrawals = lines.filter((l) => l.kind === "withdrawal");
    const referrals = lines.filter((l) => l.kind === "referral_payout");
    const withdrawalsAmount = withdrawals.reduce((s, l) => s + l.amount, 0);
    const referralAmount = referrals.reduce((s, l) => s + l.amount, 0);

    return {
      period,
      timezone: "Africa/Lagos" as const,
      dayKey: bounds.dayKey,
      weekStartKey: "weekStartKey" in bounds ? String(bounds.weekStartKey) : undefined,
      weekEndKey: "weekEndKey" in bounds ? String(bounds.weekEndKey) : undefined,
      startIso: bounds.startIso,
      endIso: bounds.endIso,
      summary: {
        withdrawalsPaid: withdrawals.length,
        withdrawalsAmount,
        referralPayoutsPaid: referrals.length,
        referralAmount,
        totalPaid: lines.length,
        totalAmount: withdrawalsAmount + referralAmount,
        avgWaitMinutes:
          waits.length > 0 ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : null,
        uniqueMembers: new Set(lines.map((l) => l.user_id)).size
      },
      lines
    };
  }
}
