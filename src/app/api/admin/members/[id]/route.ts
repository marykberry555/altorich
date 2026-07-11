import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

const statusSchema = z.object({
  accountStatus: z.enum(["active", "paused", "disabled", "deactivated"])
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await params;
    const body = statusSchema.parse(await request.json());
    const profile = await services.members.setAccountStatus(id, body.accountStatus);

    await services.audit.log({
      actorId: admin.id,
      action: "member.status_updated",
      entityType: "profile",
      entityId: id,
      metadata: { accountStatus: body.accountStatus }
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await params;
    const results = await services.members.deleteMembers([id]);

    await services.audit.log({
      actorId: admin.id,
      action: "member.deleted",
      entityType: "profile",
      entityId: id,
      metadata: { results }
    });

    return NextResponse.json({ results });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
