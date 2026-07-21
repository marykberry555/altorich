import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { logAdminAction } from "@/lib/auth/admin-audit";
import { paymentRailsPatchSchema } from "@/lib/payments/payment-rails";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const [resolved, live] = await Promise.all([
      services.paymentRails.getResolved(),
      services.paymentRails.getLiveState()
    ]);

    return NextResponse.json({ resolved, live });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const reviewer = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = paymentRailsPatchSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid payment rails payload.");

    const before = await services.paymentRails.getLiveState();
    const resolved = await services.paymentRails.updateLiveState(parsed.data, reviewer.id);
    const after = await services.paymentRails.getLiveState();

    await logAdminAction(services.audit, request, {
      actorId: reviewer.id,
      action: "settings.payment_rails_updated",
      entityType: "settings",
      entityId: "payment_rails",
      before: before as Record<string, unknown>,
      after: after as Record<string, unknown>,
      metadata: { reason: parsed.data.lastChangeReason ?? null }
    });

    return NextResponse.json({ ok: true, resolved, live: after });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
