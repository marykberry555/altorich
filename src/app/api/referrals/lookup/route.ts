import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { resolveReferralCode } from "@/lib/referral/resolve";
import { REFERRAL_INVALID_MESSAGE } from "@/lib/referral/attribution";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code") ?? request.nextUrl.searchParams.get("ref");
    if (!code?.trim()) {
      throw new AppError(REFERRAL_INVALID_MESSAGE, 400, "REFERRAL_INVALID");
    }
    const resolved = await resolveReferralCode(code);
    return NextResponse.json({
      ok: true,
      code: resolved.code,
      referrerName: resolved.referrerName
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
