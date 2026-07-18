import { NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { LiveMetricsService } from "@/services/admin/live-metrics.service";

export async function GET() {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const live = new LiveMetricsService(services.supabase);
    const metrics = await live.getLiveMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
