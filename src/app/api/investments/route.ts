import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { logger } from "@/lib/logger";

const purchaseSchema = z.object({
  planId: z.string().uuid(),
  amount: z.number().positive()
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const investments = await services.investments.listUserInvestments(user.id);
    const portfolio = await services.investments.getPortfolioSummary(user.id);

    return NextResponse.json({ investments, portfolio });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = purchaseSchema.safeParse({ ...body, amount: Number(body.amount) });
    if (!parsed.success) {
      throw Errors.badRequest("Invalid investment purchase payload.");
    }

    const idempotencyKey =
      request.headers.get("idempotency-key")?.trim() ||
      (typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "") ||
      "";

    if (idempotencyKey) {
      const existing = await services.investments
        .listUserInvestments(user.id)
        .then((rows) =>
          rows.find((row) => {
            const meta = (row as { reference?: string | null }).reference;
            return meta === `IDEM-${idempotencyKey}`.slice(0, 120);
          })
        )
        .catch(() => null);
      if (existing) {
        return NextResponse.json(existing, { status: 200 });
      }
    }

    const investment = await services.investments.purchasePlan(
      user.id,
      parsed.data.planId,
      parsed.data.amount,
      idempotencyKey ? `IDEM-${idempotencyKey}`.slice(0, 120) : undefined
    );

    await services.audit.log({
      actorId: user.id,
      action: "investment.purchased",
      entityType: "investment",
      entityId: investment.id,
      metadata: { amount: parsed.data.amount, planId: parsed.data.planId, idempotencyKey: idempotencyKey || null }
    });

    logger.info("Investment purchased", { investmentId: investment.id, userId: user.id });
    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
