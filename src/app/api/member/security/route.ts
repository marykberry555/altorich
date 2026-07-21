import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { MemberSecurityService } from "@/services/member/member-security.service";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const snapshot = await new MemberSecurityService(services.supabase).getSnapshot(user.id);
    return NextResponse.json(snapshot);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
