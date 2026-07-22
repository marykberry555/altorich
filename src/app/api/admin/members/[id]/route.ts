import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/admin-audit";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

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

    const [loginActivity, auditLogs, vipLevels] = await Promise.all([
      services.supabase
        .from("login_activity")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
      services.supabase
        .from("audit_logs")
        .select("*")
        .or(`entity_id.eq.${id},actor_id.eq.${id}`)
        .order("created_at", { ascending: false })
        .limit(30),
      services.supabase.from("vip_levels").select("*").order("level", { ascending: true })
    ]);

    return NextResponse.json({
      ...detail,
      loginActivity: loginActivity.data ?? [],
      auditLogs: auditLogs.data ?? [],
      vipLevels: vipLevels.data ?? []
    });
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
    const { data: before } = await services.supabase
      .from("profiles")
      .select("id, username, full_name, account_status, phone")
      .eq("id", id)
      .single();
    const profile = await services.members.setAccountStatus(id, body.accountStatus);

    await logAdminAction(services.audit, request, {
      actorId: admin.id,
      action: "member.status_updated",
      entityType: "profile",
      entityId: id,
      before: (before ?? {}) as Record<string, unknown>,
      after: profile as Record<string, unknown>,
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
