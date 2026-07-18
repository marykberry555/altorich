import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { accountNumberSchema } from "@/lib/validation/schemas";
import {
  accountNamesMatch,
  ACCOUNT_NAME_MISMATCH_MESSAGE
} from "@/lib/validation/account-name";

const resolveSchema = z.object({
  accountNumber: accountNumberSchema,
  /** Optional name returned by an external bank lookup when available. */
  resolvedAccountName: z.string().min(2).optional()
});

/**
 * Resolves the account-holder name for a NUBAN.
 * Until a live bank-name enquiry provider is wired, resolution uses the member's
 * registered full name (withdrawals are identity-locked to that name).
 */
export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = resolveSchema.parse(await request.json());
    const registeredName = await services.profile.getRegisteredFullName(user.id);
    const resolvedName = body.resolvedAccountName?.trim() || registeredName;

    if (!accountNamesMatch(registeredName, resolvedName)) {
      throw Errors.badRequest(ACCOUNT_NAME_MISMATCH_MESSAGE);
    }

    return NextResponse.json({
      accountNumber: body.accountNumber,
      accountName: registeredName,
      registeredFullName: registeredName,
      matched: true
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
