import { NextResponse } from "next/server";
import { requireFinancialUser } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireFinancialUser();
    const { id } = await params;
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const investment = await services.investments.requestStop(id, user.id);
    return NextResponse.json(investment);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
