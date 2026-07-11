import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

const statusSchema = z.object({
  accountStatus: z.enum(["active", "paused", "disabled", "deactivated"])
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await params;
    const detail = await services.members.getMemberDetail(id);
    return NextResponse.json(detail);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

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
    const failed = results.find((r) => !r.ok);

    await services.audit.log({
      actorId: admin.id,
      action: "member.deleted",
      entityType: "profile",
      entityId: id,
      metadata: { results }
    });

    if (failed) {
      return NextResponse.json({ error: failed.error ?? "Delete failed", results }, { status: 422 });
    }

    return NextResponse.json({ results });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
