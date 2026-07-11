import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const services = await getServiceRoleServices();
    if (!services) throw new Error("Service unavailable");

    const account = await services.fundingAccounts.setPreferred(id);

    await services.audit.log({
      actorId: admin.id,
      action: "funding_account.preferred",
      entityType: "funding_account",
      entityId: account.id
    });

    return NextResponse.json({ account });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
