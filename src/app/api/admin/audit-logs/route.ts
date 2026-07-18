import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const sp = request.nextUrl.searchParams;
    const limit = Number(sp.get("limit") ?? 100);
    const offset = Number(sp.get("offset") ?? 0);
    const action = sp.get("action") ?? undefined;
    const entityType = sp.get("entityType") ?? undefined;
    const actorId = sp.get("actorId") ?? undefined;
    const memberId = sp.get("memberId") ?? undefined;
    const settlementReference = sp.get("settlementReference") ?? sp.get("reference") ?? undefined;
    const from = sp.get("from") ?? undefined;
    const to = sp.get("to") ?? undefined;
    const q = sp.get("q") ?? undefined;
    const includeActors = sp.get("includeActors") === "1";

    const logs = await services.audit.list({
      limit,
      offset,
      action,
      entityType,
      actorId,
      memberId,
      settlementReference,
      from,
      to,
      q
    });

    if (!includeActors) {
      return NextResponse.json(logs);
    }

    const { data: adminRoles } = await services.supabase.from("admin_roles").select("user_id");
    const adminIds = [...new Set((adminRoles ?? []).map((r) => r.user_id as string))];
    let actors: Array<{ id: string; full_name: string }> = [];
    if (adminIds.length > 0) {
      const { data: profiles } = await services.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", adminIds)
        .order("full_name", { ascending: true });
      actors = (profiles ?? []).map((p) => ({ id: p.id, full_name: p.full_name }));
    }

    return NextResponse.json({ logs, actors });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
