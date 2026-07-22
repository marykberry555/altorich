import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { requireFinanceAdmin } from "@/lib/auth/finance-auth";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

const updateSchema = z.object({
  batch_size: z.number().int().min(1).max(500).optional(),
  batch_interval_minutes: z.number().int().min(1).max(120).optional(),
  paused: z.boolean().optional(),
  opens_weekday: z.number().int().min(0).max(6).optional(),
  opens_hour: z.number().int().min(0).max(23).optional(),
  opens_minute: z.number().int().min(0).max(59).optional(),
  max_daily_processing_limit: z.number().int().min(1).max(100_000).nullable().optional()
});

export async function GET() {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();
    const dashboard = await services.withdrawals.getSettlementDashboard();
    return NextResponse.json(dashboard);
  } catch (error) {
    return apiErrorResponse(error, { route: "/api/admin/settlement-queue" });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireFinanceAdmin("settlement.queue_config");
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid settlement queue settings.");

    const config = await services.settings.updateSettlementQueueConfig(parsed.data, admin.id);
    await services.audit.log({
      actorId: admin.id,
      action: "settlement_queue.settings_updated",
      entityType: "settings",
      entityId: "settlement_queue",
      metadata: parsed.data
    });

    return NextResponse.json(config);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
