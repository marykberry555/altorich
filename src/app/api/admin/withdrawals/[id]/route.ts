import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";

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
      const withdrawal = await services.withdrawals.approve(id, reviewer.id);
      await services.audit.log({
        actorId: reviewer.id,
        action: "withdrawal.approved",
        entityType: "withdrawal",
        entityId: id,
        metadata: { amount: withdrawal.amount }
      });
      return NextResponse.json(withdrawal);
    }

    if (status === "rejected") {
      const withdrawal = await services.withdrawals.reject(
        id,
        reviewer.id,
        String(body.rejectionReason ?? "Not approved")
      );
      await services.audit.log({
        actorId: reviewer.id,
        action: "withdrawal.rejected",
        entityType: "withdrawal",
        entityId: id
      });
      return NextResponse.json(withdrawal);
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
      await services.withdrawals.approve(id, reviewer.id);
      await services.audit.log({
        actorId: reviewer.id,
        action: "withdrawal.approved",
        entityType: "withdrawal",
        entityId: id
      });
    } else if (status === "rejected") {
      await services.withdrawals.reject(
        id,
        reviewer.id,
        String(formData.get("rejectionReason") || "Not approved")
      );
      await services.audit.log({
        actorId: reviewer.id,
        action: "withdrawal.rejected",
        entityType: "withdrawal",
        entityId: id
      });
    }

    logger.info("Withdrawal reviewed via form", { withdrawalId: id, status });
    redirect("/admin");
  } catch (error) {
    logger.error("Withdrawal review failed", {
      message: error instanceof Error ? error.message : String(error)
    });
    redirect("/admin");
  }
}
