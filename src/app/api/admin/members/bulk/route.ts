import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1)
});

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { ids } = schema.parse(await request.json());
    const results = await services.members.deleteMembers(ids);

    await services.audit.log({
      actorId: admin.id,
      action: "members.bulk_deleted",
      entityType: "profile",
      metadata: { ids, results }
    });

    return NextResponse.json({ results });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
