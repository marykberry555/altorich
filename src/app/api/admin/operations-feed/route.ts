import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { OperationsFeedService } from "@/services/admin/operations-feed.service";
import type { OperationsFeedCategory } from "@/lib/admin-ops/types";

export async function GET(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const sp = request.nextUrl.searchParams;
    const limit = Number(sp.get("limit") ?? 50);
    const category = (sp.get("category") ?? "all") as OperationsFeedCategory;
    const q = sp.get("q") ?? undefined;

    const feed = new OperationsFeedService(services.supabase);
    const events = await feed.getFeed({ limit, category, q });

    return NextResponse.json({ events });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
