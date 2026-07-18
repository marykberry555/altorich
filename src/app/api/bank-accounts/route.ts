import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { accountNumberSchema } from "@/lib/validation/schemas";
import {
  accountNamesMatch,
  ACCOUNT_NAME_MISMATCH_MESSAGE
} from "@/lib/validation/account-name";

const bankSchema = z.object({
  bankName: z.string().min(2),
  accountName: z.string().min(2).optional(),
  accountNumber: accountNumberSchema
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const accounts = await services.profile.listBankAccounts(user.id);
    return NextResponse.json(accounts);
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
    const parsed = bankSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid bank account details.");

    const registeredName = await services.profile.getRegisteredFullName(user.id);
    if (parsed.data.accountName && !accountNamesMatch(registeredName, parsed.data.accountName)) {
      throw Errors.badRequest(ACCOUNT_NAME_MISMATCH_MESSAGE);
    }

    const account = await services.profile.upsertPayoutBankAccount(user.id, {
      bankName: parsed.data.bankName,
      accountNumber: parsed.data.accountNumber
    });

    return NextResponse.json(account, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
