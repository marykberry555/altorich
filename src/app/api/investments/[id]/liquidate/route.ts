import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";
import { apiErrorResponse, Errors } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  reason: z.string().min(3).max(500),
  comments: z.string().max(2000).optional()
});

/** Member requests capital liquidation for an active investment. */
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = schema.parse(await request.json());
    const result = await services.liquidations.request({
      investmentId: id,
      userId: user.id,
      reason: body.reason,
      comments: body.comments
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
