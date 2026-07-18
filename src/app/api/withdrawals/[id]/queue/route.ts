import { NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

type Context = { params: Promise<{ id: string }> };

/** Live queue position + ETA for a member's withdrawal. */
export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await context.params;
    const rows = await services.withdrawals.listForUser(user.id, 100);
    const withdrawal = rows.find((row) => row.id === id);
    if (!withdrawal) throw Errors.notFound("Withdrawal");

    const queueView = await services.withdrawals.buildQueueView(withdrawal);
    return NextResponse.json(queueView);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
