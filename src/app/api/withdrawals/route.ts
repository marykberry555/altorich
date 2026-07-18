import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPublicServices, getServiceRoleServices } from "@/lib/services";
import { getSessionUser, hasAdminRole, requireSessionUser } from "@/lib/auth/session";
import { AppError, Errors, isAppError } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { logger } from "@/lib/logger";
import { accountNumberSchema } from "@/lib/validation/schemas";
import { COMPANY } from "@/lib/company";

const withdrawalSchema = z.object({
  amount: z.number().positive(),
  bankName: z.string().min(2),
  accountName: z.string().min(2).optional(),
  accountNumber: accountNumberSchema,
  note: z.string().max(500).optional()
});

function mapWithdrawalError(error: unknown): never {
  if (isAppError(error)) throw error;

  const message = error instanceof Error ? error.message : String(error);
  logger.error("Withdrawal create failed", { message });

  if (/row-level security|permission denied|42501/i.test(message)) {
    throw new AppError(
      "Unable to create withdrawal request due to a permissions error. Please contact support.",
      500,
      "WITHDRAWAL_PERMISSION",
      "Unable to create withdrawal request. Please contact support if the problem continues."
    );
  }

  if (/insufficient/i.test(message)) {
    throw Errors.badRequest("Insufficient available balance.");
  }

  throw new AppError(
    message,
    500,
    "WITHDRAWAL_FAILED",
    `Unable to create withdrawal request. Please contact support at ${COMPANY.supportEmail} if the problem continues.`
  );
}

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
    // Service role required: member INSERT on withdrawals was removed for security.
    // Authenticated members create withdrawals only through this API.
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = withdrawalSchema.safeParse({ ...body, amount: Number(body.amount) });
    if (!parsed.success) {
      throw Errors.badRequest("Please add your bank account first and enter a valid withdrawal amount.");
    }

    if (!Number.isFinite(parsed.data.amount) || parsed.data.amount <= 0) {
      throw Errors.badRequest("Enter a valid withdrawal amount.");
    }

    const accountName = await services.profile.getRegisteredFullName(user.id);

    const idempotencyKey =
      request.headers.get("idempotency-key")?.trim() ||
      (typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "") ||
      "";

    if (idempotencyKey) {
      const marker = `IDEM-${idempotencyKey}`.slice(0, 80);
      const existing = await services.withdrawals
        .listForUser(user.id, 30)
        .then((rows) =>
          rows.find((row) => {
            const note = row.note?.trim() ?? "";
            const key = (row as { idempotency_key?: string | null }).idempotency_key;
            return key === idempotencyKey || note === marker || note.startsWith(`${marker}|`);
          })
        )
        .catch(() => null);
      if (existing) {
        const queueView = await services.withdrawals.buildQueueView(existing);
        return NextResponse.json(
          {
            ...existing,
            queueView,
            scheduleMessage: queueView.scheduleMessage
          },
          { status: 200 }
        );
      }
    }

    try {
      await services.profile.upsertPayoutBankAccount(user.id, {
        bankName: parsed.data.bankName,
        accountNumber: parsed.data.accountNumber
      });
    } catch (error) {
      mapWithdrawalError(error);
    }

    const userNote = parsed.data.note?.trim() || "";
    const note = idempotencyKey
      ? `${`IDEM-${idempotencyKey}`.slice(0, 80)}${userNote ? `|${userNote}` : ""}`.slice(0, 500)
      : userNote || null;

    let withdrawal;
    try {
      withdrawal = await services.withdrawals.create({
        userId: user.id,
        amount: parsed.data.amount,
        bankName: parsed.data.bankName,
        accountName,
        accountNumber: parsed.data.accountNumber,
        note,
        idempotencyKey: idempotencyKey || null,
        requestType: "manual"
      });
    } catch (error) {
      mapWithdrawalError(error);
    }

    if (!withdrawal) {
      throw Errors.badRequest("Unable to create withdrawal request.");
    }

    const queueView =
      "queueView" in withdrawal && withdrawal.queueView
        ? withdrawal.queueView
        : await services.withdrawals.buildQueueView(withdrawal);

    logger.info("Withdrawal created", {
      withdrawalId: withdrawal.id,
      userId: user.id,
      idempotencyKey: idempotencyKey || null,
      queuePosition: queueView.queuePosition
    });

    return NextResponse.json(
      {
        ...withdrawal,
        queueView,
        scheduleMessage: queueView.scheduleMessage
      },
      { status: 201 }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
