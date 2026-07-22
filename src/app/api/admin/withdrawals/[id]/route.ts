import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireFinanceAdmin } from "@/lib/auth/finance-auth";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { logger } from "@/lib/logger";
import { logFinancialAction } from "@/lib/finance/financial-audit";
import { HARD_OPS_HOME } from "@/lib/hard-ops";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const reviewer = await requireFinanceAdmin("withdrawal.review");
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await context.params;
    const body = await request.json();
    const status = body.status as string;
    const { data: prior } = await services.supabase.from("withdrawals").select("*").eq("id", id).maybeSingle();

    if (status === "approved") {
      const withdrawal = await services.withdrawals.approve(id, reviewer.id);
      await logFinancialAction(services.audit, {
        actorId: reviewer.id,
        action: "withdrawal.approved",
        entityType: "withdrawal",
        entityId: id,
        reference: withdrawal.settlement_reference ?? id,
        previousState: { status: prior?.status ?? null, amount: prior?.amount ?? null },
        newState: { status: withdrawal.status, amount: Number(withdrawal.amount) }
      });
      return NextResponse.json(withdrawal);
    }

    if (status === "processing") {
      const withdrawal = await services.withdrawals.startProcessing(id, reviewer.id);
      await logFinancialAction(services.audit, {
        actorId: reviewer.id,
        action: "withdrawal.processing",
        entityType: "withdrawal",
        entityId: id,
        reference: withdrawal.settlement_reference ?? id,
        previousState: { status: prior?.status ?? null },
        newState: { status: withdrawal.status }
      });
      return NextResponse.json(withdrawal);
    }

    if (status === "paid") {
      const withdrawal = await services.withdrawals.markPaid(id, reviewer.id);
      await logFinancialAction(services.audit, {
        actorId: reviewer.id,
        action: "withdrawal.paid",
        entityType: "withdrawal",
        entityId: id,
        reference: withdrawal.settlement_reference ?? id,
        previousState: {
          status: prior?.status ?? null,
          amount: prior?.amount ?? null,
          wallet_transaction_id: prior?.wallet_transaction_id ?? null
        },
        newState: {
          status: withdrawal.status,
          amount: Number(withdrawal.amount),
          wallet_transaction_id: withdrawal.wallet_transaction_id,
          reference: withdrawal.settlement_reference
        }
      });
      return NextResponse.json(withdrawal);
    }

    if (status === "skip") {
      const withdrawal = await services.withdrawals.skip(id, reviewer.id);
      await logFinancialAction(services.audit, {
        actorId: reviewer.id,
        action: "withdrawal.skipped",
        entityType: "withdrawal",
        entityId: id,
        reference: withdrawal.settlement_reference ?? id,
        previousState: { status: prior?.status ?? null },
        newState: { status: withdrawal.status, queue_number: withdrawal.queue_number }
      });
      return NextResponse.json(withdrawal);
    }

    if (status === "rejected") {
      const withdrawal = await services.withdrawals.reject(
        id,
        reviewer.id,
        String(body.rejectionReason ?? "Not approved")
      );
      await logFinancialAction(services.audit, {
        actorId: reviewer.id,
        action: "withdrawal.rejected",
        entityType: "withdrawal",
        entityId: id,
        reference: withdrawal.settlement_reference ?? id,
        previousState: { status: prior?.status ?? null, amount: prior?.amount ?? null },
        newState: { status: withdrawal.status }
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
    const reviewer = await requireFinanceAdmin("withdrawal.review");
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await context.params;
    const formData = await request.formData();
    const status = String(formData.get("status"));
    const { data: prior } = await services.supabase.from("withdrawals").select("*").eq("id", id).maybeSingle();

    if (status === "approved" || status === "paid") {
      const withdrawal = await services.withdrawals.markPaid(id, reviewer.id);
      await logFinancialAction(services.audit, {
        actorId: reviewer.id,
        action: "withdrawal.paid",
        entityType: "withdrawal",
        entityId: id,
        reference: withdrawal.settlement_reference ?? id,
        previousState: { status: prior?.status ?? null, amount: prior?.amount ?? null },
        newState: {
          status: withdrawal.status,
          wallet_transaction_id: withdrawal.wallet_transaction_id,
          reference: withdrawal.settlement_reference
        }
      });
    } else if (status === "rejected") {
      const withdrawal = await services.withdrawals.reject(
        id,
        reviewer.id,
        String(formData.get("rejectionReason") || "Not approved")
      );
      await logFinancialAction(services.audit, {
        actorId: reviewer.id,
        action: "withdrawal.rejected",
        entityType: "withdrawal",
        entityId: id,
        reference: withdrawal.settlement_reference ?? id,
        previousState: { status: prior?.status ?? null },
        newState: { status: withdrawal.status }
      });
    }

    logger.info("Withdrawal reviewed via form", { withdrawalId: id, status });
  } catch (error) {
    logger.error("Withdrawal review failed", {
      message: error instanceof Error ? error.message : String(error)
    });
    return apiErrorResponse(error, { route: "/api/admin/withdrawals/[id]" });
  }

  redirect(HARD_OPS_HOME);
}
