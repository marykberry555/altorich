import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { LoginActivityService } from "@/services/admin/login-activity.service";

export async function GET(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
    const activity = new LoginActivityService(services.supabase);
    const rows = await activity.listRecent(limit);

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = await services.supabase
      .from("profiles")
      .select("id, full_name, username")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return NextResponse.json(
      rows.map((row) => ({
        ...row,
        member_name: profileMap.get(row.user_id)?.full_name ?? profileMap.get(row.user_id)?.username ?? "Member"
      }))
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
