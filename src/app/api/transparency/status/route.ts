import { NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { TransparencyService } from "@/services/transparency/transparency.service";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function probeHealth() {
  let databaseOk = false;
  let authOk = false;

  if (isServiceRoleConfigured()) {
    try {
      const supabase = await createServiceClient();
      if (supabase) {
        const { error: dbError } = await supabase.from("profiles").select("id").limit(1);
        databaseOk = !dbError;
        const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        authOk = !authError;
      }
    } catch {
      // degraded
    }
  }

  return {
    apiOk: isSupabaseConfigured(),
    databaseOk,
    authOk
  };
}

export async function GET() {
  try {
    const health = await probeHealth();
    const services = await getServiceRoleServices();

    if (!services) {
      return NextResponse.json({
        overall: health.apiOk ? "operational" : "degraded",
        lastUpdated: new Date().toISOString(),
        services: []
      });
    }

    const transparency = new TransparencyService(services.supabase);
    const status = await transparency.getSystemStatus(health);
    return NextResponse.json(status, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" }
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
