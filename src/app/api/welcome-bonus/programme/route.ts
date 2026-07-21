import { NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { DEFAULT_WELCOME_BONUS_CONFIG } from "@/lib/welcome-bonus/config";
import { buildProgrammeStatus } from "@/lib/welcome-bonus/programme-status";
import { apiErrorResponse } from "@/lib/errors/api-response";

/** Public programme status for slot counter — no auth required. */
export async function GET() {
  try {
    const services = await getServiceRoleServices();
    if (!services) {
      return NextResponse.json(buildProgrammeStatus(DEFAULT_WELCOME_BONUS_CONFIG, 0, true));
    }
    const status = await services.welcomeBonus.getPublicProgrammeStatus();
    return NextResponse.json(status, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" }
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
