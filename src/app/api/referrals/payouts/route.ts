import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireFinancialUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { accountNumberSchema } from "@/lib/validation/schemas";

const payoutSchema = z.object({
  amount: z.number().positive(),
  bankName: z.string().min(2),
  accountName: z.string().min(2).optional(),
  accountNumber: accountNumberSchema,
  bankAccountId: z.string().uuid().optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireFinancialUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = payoutSchema.safeParse({ ...body, amount: Number(body.amount) });
    if (!parsed.success) throw Errors.badRequest("Invalid referral withdrawal request.");

    const payout = await services.referrals.requestPayout(user.id, {
      ...parsed.data,
      accountName: await services.profile.getRegisteredFullName(user.id)
    });

    const payoutId = String((payout as { id?: string }).id ?? "");
    await services.audit.log({
      actorId: user.id,
      action: "referral.payout_requested",
      entityType: "referral_payout",
      entityId: payoutId,
      metadata: {
        amount: parsed.data.amount,
        settlement_reference: (payout as { settlementReference?: string }).settlementReference ?? null
      }
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
