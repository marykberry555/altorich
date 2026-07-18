import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

export async function GET() {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();
    const pending = await services.liquidations.listPending();
    return NextResponse.json(pending);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
