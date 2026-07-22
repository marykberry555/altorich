import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireFinanceAdmin } from "@/lib/auth/finance-auth";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { logger } from "@/lib/logger";
import { logFinancialAction } from "@/lib/finance/financial-audit";
import { HARD_OPS_HOME } from "@/lib/hard-ops";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { withApiRouteHandler, type RouteContext } from "@/lib/api/route-handler";

async function patchDeposit(request: NextRequest, context: RouteContext) {
  const limited = enforceRateLimit(request, "adminFinanceAction");
  if (limited) return limited;

  const reviewer = await requireFinanceAdmin("deposit.review");
  const services = await getServiceRoleServices();
  if (!services) throw Errors.notConfigured();

  const { id } = await context.params;
  if (!id) throw Errors.badRequest("Deposit id required.");
  const body = await request.json();
  const status = body.status as string;

  if (status === "approved") {
    const { data: prior } = await services.supabase.from("deposits").select("status, amount").eq("id", id).maybeSingle();
    const deposit = await services.deposits.approve(id, reviewer.id);
    await logFinancialAction(services.audit, {
      actorId: reviewer.id,
      action: "deposit.approved",
      entityType: "deposit",
      entityId: id,
      reference: `DEP-${id}`,
      previousState: { status: prior?.status ?? null, amount: prior?.amount ?? null },
      newState: {
        status: deposit.status,
        amount: Number(deposit.amount),
        wallet_transaction_id: deposit.wallet_transaction_id
      },
      metadata: { amount: deposit.amount, idempotent: prior?.status !== "pending" }
    });
    return NextResponse.json(deposit);
  }

  if (status === "rejected") {
    const { data: prior } = await services.supabase.from("deposits").select("status, amount").eq("id", id).maybeSingle();
    const deposit = await services.deposits.reject(
      id,
      reviewer.id,
      String(body.rejectionReason ?? "Not approved")
    );
    await logFinancialAction(services.audit, {
      actorId: reviewer.id,
      action: "deposit.rejected",
      entityType: "deposit",
      entityId: id,
      reference: id,
      previousState: { status: prior?.status ?? null, amount: prior?.amount ?? null },
      newState: { status: deposit.status, amount: Number(deposit.amount) }
    });
    return NextResponse.json(deposit);
  }

  throw Errors.badRequest("Invalid status.");
}

async function postDeposit(request: NextRequest, context: RouteContext) {
  const limited = enforceRateLimit(request, "adminFinanceAction");
  if (limited) return limited;

  try {
    const reviewer = await requireFinanceAdmin("deposit.review");
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await context.params;
    if (!id) throw Errors.badRequest("Deposit id required.");
    const formData = await request.formData();
    const status = String(formData.get("status"));

    if (status === "approved") {
      const { data: prior } = await services.supabase.from("deposits").select("status, amount").eq("id", id).maybeSingle();
      const deposit = await services.deposits.approve(id, reviewer.id);
      await logFinancialAction(services.audit, {
        actorId: reviewer.id,
        action: "deposit.approved",
        entityType: "deposit",
        entityId: id,
        reference: `DEP-${id}`,
        previousState: { status: prior?.status ?? null, amount: prior?.amount ?? null },
        newState: {
          status: deposit.status,
          amount: Number(deposit.amount),
          wallet_transaction_id: deposit.wallet_transaction_id
        }
      });
    } else if (status === "rejected") {
      const { data: prior } = await services.supabase.from("deposits").select("status, amount").eq("id", id).maybeSingle();
      const deposit = await services.deposits.reject(
        id,
        reviewer.id,
        String(formData.get("rejectionReason") || "Not approved")
      );
      await logFinancialAction(services.audit, {
        actorId: reviewer.id,
        action: "deposit.rejected",
        entityType: "deposit",
        entityId: id,
        reference: id,
        previousState: { status: prior?.status ?? null, amount: prior?.amount ?? null },
        newState: { status: deposit.status, amount: Number(deposit.amount) }
      });
    }

    logger.info("Deposit reviewed via form", { depositId: id, status, reviewerId: reviewer.id });

    const wantsJson =
      request.headers.get("accept")?.includes("application/json") ||
      request.headers.get("x-altorich-client") === "admin-app" ||
      request.headers.get("x-requested-with") === "fetch";

    if (wantsJson) {
      return NextResponse.json({ ok: true });
    }
  } catch (error) {
    logger.error("Deposit review failed", {
      message: error instanceof Error ? error.message : String(error)
    });
    return apiErrorResponse(error, { route: "/api/deposits/[id]" });
  }

  redirect(HARD_OPS_HOME);
}

export const PATCH = withApiRouteHandler(patchDeposit, "/api/deposits/[id]");
export const POST = withApiRouteHandler(postDeposit, "/api/deposits/[id]");
