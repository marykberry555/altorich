import { NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { TransparencyService } from "@/services/transparency/transparency.service";
import { apiErrorResponse } from "@/lib/errors/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services = await getServiceRoleServices();
    if (!services) {
      return NextResponse.json({ lastUpdated: new Date().toISOString(), metrics: [] });
    }
    const transparency = new TransparencyService(services.supabase);
    const payload = await transparency.getPlatformMetrics();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
