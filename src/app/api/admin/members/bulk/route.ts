import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

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
    const failed = results.filter((r) => !r.ok);

    await services.audit.log({
      actorId: admin.id,
      action: "members.bulk_deleted",
      entityType: "profile",
      metadata: { ids, results }
    });

    if (failed.length > 0) {
      const okCount = results.length - failed.length;
      return NextResponse.json(
        {
          error:
            failed.length === results.length
              ? failed.map((f) => f.error ?? "Delete failed").join("; ")
              : `Deleted ${okCount}, failed ${failed.length}: ${failed.map((f) => f.error ?? "Delete failed").join("; ")}`,
          results
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
