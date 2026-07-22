import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { logAdminAction } from "@/lib/auth/admin-audit";
import { hashPin } from "@/lib/auth/pin";

const schema = z.object({
  action: z.enum([
    "reset_pin",
    "reset_password",
    "disable_login",
    "enable_login",
    "suspend",
    "unsuspend",
    "change_package",
    "assign_package",
    "update_full_name"
  ]),
  packageSlug: z.string().optional(),
  fullName: z.string().min(2).max(120).optional(),
  identityVerifiedConfirm: z.boolean().optional(),
  reason: z.string().max(500).optional(),
  depositId: z.string().uuid().optional(),
  withdrawalId: z.string().uuid().optional(),
  depositStatus: z.enum(["approved", "rejected"]).optional(),
  withdrawalStatus: z.enum(["approved", "rejected"]).optional(),
  rejectionReason: z.string().optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id: memberId } = await params;
    const body = schema.parse(await request.json());

    const { PROFILE_SAFE_COLUMNS, toPublicProfile } = await import("@/lib/security/profile-safe");
    const { data: beforeProfile } = await services.supabase
      .from("profiles")
      .select(PROFILE_SAFE_COLUMNS)
      .eq("id", memberId)
      .single();
    if (!beforeProfile) throw Errors.notFound("Member");

    let result: Record<string, unknown> = {};

    switch (body.action) {
      case "reset_pin": {
        const tempPin = randomBytes(3).toString("hex").slice(0, 6);
        const pinHash = hashPin(tempPin);
        await services.supabase
          .from("profiles")
          .update({ pin_hash: pinHash, must_change_pin: true })
          .eq("id", memberId);
        result = { mustChangePin: true };
        break;
      }
      case "reset_password": {
        const tempPassword = randomBytes(9).toString("base64url");
        await services.supabase.auth.admin.updateUserById(memberId, { password: tempPassword });
        await services.supabase.from("profiles").update({ must_change_password: true }).eq("id", memberId);
        result = { mustChangePassword: true };
        break;
      }
      case "disable_login":
        await services.members.setAccountStatus(memberId, "disabled");
        result = { accountStatus: "disabled" };
        break;
      case "enable_login":
        await services.members.setAccountStatus(memberId, "active");
        result = { accountStatus: "active" };
        break;
      case "suspend":
        await services.members.setAccountStatus(memberId, "paused");
        result = { accountStatus: "paused" };
        break;
      case "unsuspend":
        await services.members.setAccountStatus(memberId, "active");
        result = { accountStatus: "active" };
        break;
      case "change_package":
      case "assign_package": {
        if (!body.packageSlug) throw Errors.badRequest("Package slug required.");
        await services.supabase
          .from("profiles")
          .update({ preferred_package_slug: body.packageSlug })
          .eq("id", memberId);
        result = { preferredPackageSlug: body.packageSlug };
        break;
      }
      case "update_full_name": {
        if (!body.identityVerifiedConfirm) {
          throw Errors.badRequest(
            "Changing a member's name requires prior identity verification. Ensure valid identification has been reviewed before continuing."
          );
        }
        const newName = body.fullName?.trim() ?? "";
        if (newName.length < 2) throw Errors.badRequest("Full name is required.");
        const oldName = beforeProfile.full_name ?? "";
        const { error: nameError } = await services.supabase
          .from("profiles")
          .update({ full_name: newName })
          .eq("id", memberId);
        if (nameError) throw nameError;
        await services.supabase
          .from("bank_accounts")
          .update({ account_name: newName })
          .eq("user_id", memberId);
        result = {
          administratorId: admin.id,
          memberId,
          oldName,
          newName,
          reason: body.reason?.trim() || null,
          timestamp: new Date().toISOString()
        };
        break;
      }
      default:
        throw Errors.badRequest("Unsupported action.");
    }

    if (body.depositId && body.depositStatus) {
      if (body.depositStatus === "approved") {
        await services.deposits.approve(body.depositId, admin.id);
      } else {
        await services.deposits.reject(body.depositId, admin.id, body.rejectionReason ?? "Not approved");
      }
      result.depositId = body.depositId;
      result.depositStatus = body.depositStatus;
    }

    if (body.withdrawalId && body.withdrawalStatus) {
      if (body.withdrawalStatus === "approved") {
        await services.withdrawals.markPaid(body.withdrawalId, admin.id);
      } else {
        await services.withdrawals.reject(body.withdrawalId, admin.id, body.rejectionReason ?? "Not approved");
      }
      result.withdrawalId = body.withdrawalId;
      result.withdrawalStatus = body.withdrawalStatus;
    }

    const { data: afterProfile } = await services.supabase
      .from("profiles")
      .select(PROFILE_SAFE_COLUMNS)
      .eq("id", memberId)
      .single();

    await logAdminAction(services.audit, request, {
      actorId: admin.id,
      action: body.action === "update_full_name" ? "member.full_name_updated" : `member.${body.action}`,
      entityType: "profile",
      entityId: memberId,
      before: toPublicProfile(beforeProfile as Record<string, unknown>) as Record<string, unknown>,
      after: toPublicProfile((afterProfile ?? {}) as Record<string, unknown>) as Record<string, unknown>,
      metadata:
        body.action === "update_full_name"
          ? {
              administrator: admin.id,
              member: memberId,
              oldName: (result as { oldName?: string }).oldName,
              newName: (result as { newName?: string }).newName,
              timestamp: (result as { timestamp?: string }).timestamp,
              reason: (result as { reason?: string | null }).reason ?? null,
              ...result
            }
          : result
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return apiErrorResponse(error, { route: "/api/admin/members/[id]/actions" });
  }
}
