import { NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { FraudDetectionService } from "@/services/admin/fraud-detection.service";

export async function GET() {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const fraud = new FraudDetectionService(services.supabase);
    const alerts = await fraud.getAlerts(40);

    return NextResponse.json({ alerts });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
