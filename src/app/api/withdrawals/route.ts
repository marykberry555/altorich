import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isWithdrawalWindow } from "@/lib/domain";
import { getPublicServices, getServiceRoleServices } from "@/lib/services";
import { getSessionUser, hasAdminRole, requireSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";

const withdrawalSchema = z.object({
  memberName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  amount: z.number().positive(),
  bankName: z.string().min(2),
  accountName: z.string().min(2),
  accountNumber: z.string().min(8)
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw Errors.unauthorized();

    const isAdmin = await hasAdminRole();
    const services = isAdmin ? await getServiceRoleServices() : await getPublicServices();
    if (!services) throw Errors.notConfigured();

    const withdrawals = isAdmin
      ? await services.withdrawals.listRecent(100)
      : await services.withdrawals.listForUser(user.id, 100);

    return NextResponse.json(withdrawals);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isWithdrawalWindow()) {
      return NextResponse.json(
        { error: "Withdrawal requests open on Mondays and Thursdays from 8:00 AM WAT." },
        { status: 403 }
      );
    }

    const services = await getPublicServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = withdrawalSchema.safeParse({ ...body, amount: Number(body.amount) });
    if (!parsed.success) {
      throw Errors.badRequest("Complete withdrawal bank details are required.");
    }

    const user = await requireSessionUser();

    const withdrawal = await services.withdrawals.create({
      userId: user.id,
      amount: parsed.data.amount,
      bankName: parsed.data.bankName,
      accountName: parsed.data.accountName,
      accountNumber: parsed.data.accountNumber
    });

    logger.info("Withdrawal created", { withdrawalId: withdrawal.id, userId: user.id });
    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
