import { NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

export async function GET() {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const metrics = await services.analytics.getAdminMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
