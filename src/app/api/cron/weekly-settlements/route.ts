import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { sendEmail } from "@/lib/email/send";
import { COMPANY } from "@/lib/company";
import { formatNaira } from "@/lib/domain";
import { weeklyInterestForAmount } from "@/lib/packages/tier-config";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function authorizeCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const services = await getServiceRoleServices();
  if (!services) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  const settlements = await services.settlements.processWeeklyMondaySettlements(new Date());
  const promoted = await services.withdrawals.promoteScheduledWithdrawals(new Date());

  const { data: activeInvestments } = await services.supabase
    .from("investments")
    .select("user_id, amount, weekly_roi_bps, stop_requested_at, status")
    .in("status", ["active", "stopping"]);

  const userIds = [...new Set((activeInvestments ?? []).map((r) => String(r.user_id)))];
  let emailsSent = 0;

  if (userIds.length > 0) {
    const { data: authList } = await services.supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailById = new Map(
      (authList?.users ?? []).filter((u) => u.email).map((u) => [u.id, u.email as string])
    );

    const { data: profiles } = await services.supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const nameById = new Map((profiles ?? []).map((p) => [String(p.id), p.full_name]));

    for (const userId of userIds) {
      const email = emailById.get(userId);
      if (!email) continue;

      const inv = (activeInvestments ?? []).find((r) => String(r.user_id) === userId);
      if (!inv) continue;

      const bps = PLATFORM_EARNING.weeklyRoiBps;
      const weeklyDue = weeklyInterestForAmount(Number(inv.amount), bps);
      const stopping = Boolean(inv.stop_requested_at);
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://altorich.com";
      const name = nameById.get(userId) ?? "Member";

      const subject = `${COMPANY.brand} — Monday investment earnings · ${formatNaira(weeklyDue)}`;

      const html = stopping
        ? `<p>Hi ${name},</p>
           <p>You requested to stop your investment. Your guaranteed interest will be paid to your wallet this Monday at 09:00 WAT.</p>
           <p>After credit, <a href="${site}/withdrawals">withdraw from your wallet</a>.</p>
           <p>${COMPANY.legalName}</p>`
        : `<p>Hi ${name},</p>
           <p>Your active investment earns <strong>${formatNaira(weeklyDue)}</strong> this week (guaranteed).</p>
           <p>Earnings auto-reinvest every Monday at 09:00 WAT. To cash out interest instead, <a href="${site}/portfolio">stop your investment</a> before the next cycle.</p>
           <p>${COMPANY.legalName}</p>`;

      const ok = await sendEmail({ to: email, subject, html });
      if (ok) emailsSent += 1;
    }
  }

  logger.info("Monday weekly settlement cron complete", {
    settlements: settlements.length,
    emailsSent
  });

  return NextResponse.json({
    ok: true,
    settlementsProcessed: settlements.length,
    scheduledPayoutsPromoted: promoted,
    emailsSent
  });
}
