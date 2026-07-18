import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { logger } from "@/lib/logger";
import { HARD_OPS_HOME } from "@/lib/hard-ops";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const reviewer = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await context.params;
    const body = await request.json();
    const status = body.status as string;

    if (status === "approved") {
      const deposit = await services.deposits.approve(id, reviewer.id);
      await services.audit.log({
        actorId: reviewer.id,
        action: "deposit.approved",
        entityType: "deposit",
        entityId: id,
        metadata: { amount: deposit.amount }
      });
      return NextResponse.json(deposit);
    }

    if (status === "rejected") {
      const deposit = await services.deposits.reject(
        id,
        reviewer.id,
        String(body.rejectionReason ?? "Not approved")
      );
      await services.audit.log({
        actorId: reviewer.id,
        action: "deposit.rejected",
        entityType: "deposit",
        entityId: id
      });
      return NextResponse.json(deposit);
    }

    throw Errors.badRequest("Invalid status.");
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const reviewer = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await context.params;
    const formData = await request.formData();
    const status = String(formData.get("status"));

    if (status === "approved") {
      await services.deposits.approve(id, reviewer.id);
      await services.audit.log({
        actorId: reviewer.id,
        action: "deposit.approved",
        entityType: "deposit",
        entityId: id
      });
    } else if (status === "rejected") {
      await services.deposits.reject(
        id,
        reviewer.id,
        String(formData.get("rejectionReason") || "Not approved")
      );
      await services.audit.log({
        actorId: reviewer.id,
        action: "deposit.rejected",
        entityType: "deposit",
        entityId: id
      });
    }

    logger.info("Deposit reviewed via form", { depositId: id, status, reviewerId: reviewer.id });
  } catch (error) {
    logger.error("Deposit review failed", {
      message: error instanceof Error ? error.message : String(error)
    });
    return apiErrorResponse(error);
  }

  redirect(HARD_OPS_HOME);
}
