import { NextResponse } from "next/server";
import { requireAdminService } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";
import { currentTickerWindowLagos, SECONDS_IN_WEEK, clamp01 } from "@/lib/roi/time";
import { resolveWeeklyRoiBps } from "@/config/investment-portfolios";

/**
 * Settle any ROI investments whose cycle has ended.
 * This is designed to be called by a scheduler at Monday 10:00.
 */
export async function POST() {
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_ROI_MODE_ENABLED) {
    return NextResponse.json({ error: "ROI mode disabled" }, { status: 404 });
  }

  const { supabase } = await requireAdminService();
  const now = new Date();

  const { data: ended, error } = await supabase
    .from("roi_investments")
    .select("*, tier:roi_tiers(*)")
    .eq("status", "active")
    .lte("cycle_ends_at", now.toISOString());

  if (error) throw error;

  const results: Array<{ investment_id: string; payout_id?: string; status: string }> = [];

  for (const inv of ended ?? []) {
    const row = inv as {
      user_id: string;
      principal_ngn: number;
      principal_usd: number | null;
      exchange_rate_ngn_per_usd: number | null;
      payout_method: string;
      payout_destination: unknown;
      cycle_started_at: string;
      cycle_ends_at: string;
      id: string;
      tier?: { weekly_roi_bps?: number | null; min_ngn?: number | null } | null;
    };
    const principal = Number(row.principal_ngn);
    const weeklyBps = resolveWeeklyRoiBps({
      amountNgn: principal,
      weeklyRoiBps: row.tier?.weekly_roi_bps
    });

    const start = new Date(row.cycle_started_at);
    const end = new Date(row.cycle_ends_at);
    const elapsed = (end.getTime() - start.getTime()) / 1000;
    const progress = clamp01(elapsed / SECONDS_IN_WEEK);
    const weeklyInterest = principal * (weeklyBps / 10_000);
    const accrued = weeklyInterest * progress;

    const { data: payout, error: payoutErr } = await supabase
      .from("roi_payouts")
      .insert({
        user_id: row.user_id,
        investment_id: row.id,
        amount_ngn: accrued,
        amount_usd: row.principal_usd
          ? Number((accrued / Number(row.exchange_rate_ngn_per_usd ?? 1)).toFixed(2))
          : null,
        method: row.payout_method as "bank" | "crypto",
        destination_snapshot: row.payout_destination as never,
        status: "pending"
      })
      .select("*")
      .single();

    if (payoutErr) throw payoutErr;

    await supabase
      .from("roi_investments")
      .update({
        accrued_ngn: 0,
        status: "active",
        cycle_started_at: currentTickerWindowLagos(now).start.toISOString(),
        cycle_ends_at: currentTickerWindowLagos(now).end.toISOString(),
        last_ticker_at: now.toISOString()
      })
      .eq("id", row.id);

    results.push({ investment_id: row.id, payout_id: payout?.id, status: "settled" });
  }

  return NextResponse.json({ ok: true, settled: results.length, results });
}

