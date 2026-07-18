import { NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { SecurityCenterService } from "@/services/admin/security-center.service";

export async function GET() {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const { data: admins } = await services.supabase.from("admin_roles").select("user_id");
    const adminUserIds = (admins ?? []).map((a) => a.user_id as string);

    const security = new SecurityCenterService(services.supabase);
    const snapshot = await security.getSnapshot(adminUserIds);

    return NextResponse.json(snapshot);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
