import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
    const notifications = await services.notifications.listForUser(user.id, limit);

    return NextResponse.json(notifications);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
