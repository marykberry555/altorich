import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { formatPayoutScheduleMessage, resolvePayoutQueue } from "@/lib/payout/schedule";
import { getPublicServices, getServiceRoleServices } from "@/lib/services";
import { getSessionUser, hasAdminRole, requireSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";

const withdrawalSchema = z.object({
  amount: z.number().positive(),
  bankName: z.string().min(2),
  accountName: z.string().min(2),
  accountNumber: z.string().min(8),
  note: z.string().max(500).optional()
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
    const services = await getPublicServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = withdrawalSchema.safeParse({ ...body, amount: Number(body.amount) });
    if (!parsed.success) {
      throw Errors.badRequest("Complete payout destination details are required.");
    }

    const user = await requireSessionUser();

    await services.profile.upsertPayoutBankAccount(user.id, {
      bankName: parsed.data.bankName,
      accountName: parsed.data.accountName,
      accountNumber: parsed.data.accountNumber
    });

    const withdrawal = await services.withdrawals.create({
      userId: user.id,
      amount: parsed.data.amount,
      bankName: parsed.data.bankName,
      accountName: parsed.data.accountName,
      accountNumber: parsed.data.accountNumber,
      note: parsed.data.note ?? null,
      requestType: "manual"
    });

    if (!withdrawal) {
      throw Errors.badRequest("Unable to create payout request.");
    }

    const queue = resolvePayoutQueue();
    logger.info("Withdrawal created", { withdrawalId: withdrawal.id, userId: user.id });

    return NextResponse.json(
      {
        ...withdrawal,
        scheduleMessage: formatPayoutScheduleMessage(queue.scheduledAt)
      },
      { status: 201 }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
