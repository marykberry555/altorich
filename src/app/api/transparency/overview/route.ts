import { NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { TransparencyService } from "@/services/transparency/transparency.service";
import { apiErrorResponse } from "@/lib/errors/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services = await getServiceRoleServices();
    if (!services) {
      return NextResponse.json({
        live: false,
        lastUpdated: new Date().toISOString(),
        settlementStatus: "Unavailable",
        todayDeposits: null,
        todayDepositsAmount: null,
        todayWithdrawals: null,
        todayWithdrawalsAmount: null,
        depositsApprovedToday: null,
        withdrawalsProcessedToday: null,
        pendingDeposits: null,
        pendingWithdrawals: null,
        averageDepositApprovalMinutes: null,
        averageWithdrawalProcessingMinutes: null,
        averageSupportResponseMinutes: null,
        platformAvailabilityPercent: null
      });
    }

    const transparency = new TransparencyService(services.supabase);
    const overview = await transparency.getOverview();
    return NextResponse.json(overview, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" }
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
