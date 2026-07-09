import { NextResponse } from "next/server";
import { requireAdminService } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";
import { currentTickerWindowLagos, SECONDS_IN_WEEK, clamp01 } from "@/lib/roi/time";

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
    const tier = (inv as unknown as { tier?: { weekly_roi_bps?: number } | null }).tier;
    const weeklyBps = Number(tier?.weekly_roi_bps ?? 0);
    const principal = Number(inv.principal_ngn);

    const start = new Date(inv.cycle_started_at);
    const end = new Date(inv.cycle_ends_at);
    const elapsed = (end.getTime() - start.getTime()) / 1000;
    const progress = clamp01(elapsed / SECONDS_IN_WEEK);
    const weeklyInterest = principal * (weeklyBps / 10_000);
    const accrued = weeklyInterest * progress;

    const { data: payout, error: payoutErr } = await supabase
      .from("roi_payouts")
      .insert({
        user_id: inv.user_id,
        investment_id: inv.id,
        amount_ngn: accrued,
        amount_usd: inv.principal_usd ? Number((accrued / Number(inv.exchange_rate_ngn_per_usd ?? 1)).toFixed(2)) : null,
        method: inv.payout_method,
        destination_snapshot: inv.payout_destination,
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
      .eq("id", inv.id);

    results.push({ investment_id: inv.id, payout_id: payout?.id, status: "settled" });
  }

  return NextResponse.json({ ok: true, settled: results.length, results });
}

