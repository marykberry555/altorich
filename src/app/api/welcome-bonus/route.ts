import { NextRequest, NextResponse } from "next/server";
import { getUserServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const services = await getUserServices();
    if (!services) throw Errors.notConfigured();
    const view = await services.welcomeBonus.getMemberView(user.id);
    return NextResponse.json(view);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const services = await getUserServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json().catch(() => ({}));
    const result = await services.welcomeBonus.requestWithdrawal({
      userId: user.id,
      bankName: String(body.bankName ?? ""),
      accountName: String(body.accountName ?? ""),
      accountNumber: String(body.accountNumber ?? ""),
      bankAccountId: body.bankAccountId ? String(body.bankAccountId) : null
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
