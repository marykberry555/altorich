import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { loadPublicPaymentRailsSnapshot } from "@/lib/payments/load-public-rails";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await loadPublicPaymentRailsSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
