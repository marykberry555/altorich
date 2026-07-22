import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { requireFinanceAdmin } from "@/lib/auth/finance-auth";
import { getServiceRoleServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(["approved", "rejected", "more_info"]),
  adminNote: z.string().max(2000).optional()
});

export async function GET() {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();
    const pending = await services.liquidations.listPending();
    return NextResponse.json(pending);
  } catch (error) {
    return apiErrorResponse(error, { route: "/api/admin/liquidations/[id]" });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const admin = await requireFinanceAdmin("liquidation.review");
    const { id } = await params;
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = schema.parse(await request.json());

    if (body.status === "approved") {
      const result = await services.liquidations.approve(id, admin.id, body.adminNote);
      return NextResponse.json(result);
    }
    if (body.status === "rejected") {
      const result = await services.liquidations.reject(id, admin.id, body.adminNote ?? "");
      return NextResponse.json(result);
    }
    const result = await services.liquidations.requestMoreInfo(id, admin.id, body.adminNote ?? "");
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
