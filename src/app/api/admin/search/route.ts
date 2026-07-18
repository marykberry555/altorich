import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { AdminSearchService } from "@/services/admin/admin-search.service";

export async function GET(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const q = request.nextUrl.searchParams.get("q") ?? "";
    const search = new AdminSearchService(services.supabase);
    const results = await search.search(q);

    return NextResponse.json({ results });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
