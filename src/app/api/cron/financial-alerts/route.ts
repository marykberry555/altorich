import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { FinancialAlertService } from "@/services/admin/financial-alert.service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function authorizeCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Evaluate financial health and notify admins on critical conditions. */
export async function POST(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const services = await getServiceRoleServices();
  if (!services) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  try {
    const alerts = new FinancialAlertService(services.supabase);
    const result = await alerts.evaluateAndNotify();
    logger.info("Financial alerts cron complete", {
      drafts: result.drafts,
      sent: result.sent.filter((s) => s.notificationId).length
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Financial alerts cron failed", {
      message,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
