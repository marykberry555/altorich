import { NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { COMPANY } from "@/lib/company";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const dashboard = await services.referrals.getDashboard(user.id, COMPANY.siteUrl);
    const vipLevels = await services.referrals.listVipLevels();

    return NextResponse.json({ dashboard, vipLevels });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
