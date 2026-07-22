import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireFinanceAdmin } from "@/lib/auth/finance-auth";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  action: z.enum(["fund", "debit"]),
  amount: z.number().positive(),
  note: z.string().optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = enforceRateLimit(request, "adminFinanceAction");
    if (limited) return limited;

    const admin = await requireFinanceAdmin("member.wallet_adjust");
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await params;
    const body = schema.parse(await request.json());
    const signedAmount = body.action === "fund" ? body.amount : -body.amount;
    const result = await services.members.adjustWallet(id, signedAmount, body.note);

    await services.audit.log({
      actorId: admin.id,
      action: body.action === "fund" ? "member.wallet_funded" : "member.wallet_debited",
      entityType: "profile",
      entityId: id,
      metadata: {
        amount: body.amount,
        note: body.note,
        balance: result.balance,
        investment_id: result.investment?.id ?? null,
        invested_amount: result.investment?.amount ?? null,
        reference: result.reference
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
