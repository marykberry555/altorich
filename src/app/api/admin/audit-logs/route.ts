import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

export async function GET(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 100);
    const action = request.nextUrl.searchParams.get("action") ?? undefined;
    const entityType = request.nextUrl.searchParams.get("entityType") ?? undefined;

    const logs = await services.audit.list({ limit, action, entityType });
    return NextResponse.json(logs);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
