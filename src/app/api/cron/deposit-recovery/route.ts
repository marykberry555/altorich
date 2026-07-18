import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function authorizeCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Resume stuck deposit approval workflows (claimed / wallet_credited / …). */
export async function POST(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const services = await getServiceRoleServices();
  if (!services) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  try {
    const results = await services.deposits.recoverStuckApprovals(5, 50);
    const ok = results.filter((r) => r.ok).length;
    const failed = results.length - ok;

    logger.info("Deposit workflow recovery cron complete", {
      attempted: results.length,
      ok,
      failed
    });

    return NextResponse.json({ ok: true, attempted: results.length, recovered: ok, failed, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Deposit workflow recovery cron failed", { message });
    return NextResponse.json({ error: "Cron failed", detail: message }, { status: 500 });
  }
}
