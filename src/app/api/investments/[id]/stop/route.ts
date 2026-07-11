import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";
import { apiErrorResponse, Errors } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const investment = await services.investments.requestStop(id, user.id);
    return NextResponse.json(investment);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
