import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

const payoutSchema = z.object({
  amount: z.number().positive(),
  bankName: z.string().min(2),
  accountName: z.string().min(2),
  accountNumber: z.string().min(8),
  bankAccountId: z.string().uuid().optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = payoutSchema.safeParse({ ...body, amount: Number(body.amount) });
    if (!parsed.success) throw Errors.badRequest("Invalid referral payout request.");

    const payout = await services.referrals.requestPayout(user.id, parsed.data);

    await services.audit.log({
      actorId: user.id,
      action: "referral.payout_requested",
      entityType: "referral_payout",
      entityId: String((payout as { id: string }).id),
      metadata: { amount: parsed.data.amount }
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
