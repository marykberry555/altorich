import { NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await params;
    await services.profile.deleteBankAccount(user.id, id);

    return NextResponse.json({ ok: true, message: "Bank account deleted successfully." });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
