import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();
    const snapshot = await services.financialOps.getHealthSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "recover_deposits") {
      const results = await services.deposits.recoverStuckApprovals(
        Number(body.olderThanMinutes ?? 5),
        Number(body.limit ?? 25)
      );
      return NextResponse.json({ ok: true, results });
    }

    if (action === "resolve_event") {
      const eventId = String(body.eventId ?? "");
      if (!eventId) throw Errors.badRequest("eventId required");
      await services.financialOps.resolveEvent(eventId);
      return NextResponse.json({ ok: true });
    }

    throw Errors.badRequest("Unknown action");
  } catch (error) {
    return apiErrorResponse(error);
  }
}
