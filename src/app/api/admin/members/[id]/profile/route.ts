import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/admin-audit";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { accountNumberSchema, phoneSchema } from "@/lib/validation/schemas";
import { memberLocationSchema } from "@/lib/location/validation";
import type { Database } from "@/types/database";

const profileUpdateSchema = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    identityVerifiedConfirm: z.boolean().optional(),
    nameChangeReason: z.string().max(500).optional(),
    phone: phoneSchema.optional(),
    email: z.string().email().optional(),
    locationStateCode: z.string().min(2).max(8).optional(),
    locationCityArea: z.string().min(2).max(64).optional(),
    accountStatus: z.enum(["active", "paused", "disabled", "deactivated"]).optional(),
    kycStatus: z.enum(["pending", "approved", "rejected", "requires_update"]).optional(),
    bankName: z.string().min(2).max(120).optional(),
    accountNumber: accountNumberSchema.optional()
  })
  .superRefine((data, ctx) => {
    const hasState = data.locationStateCode !== undefined;
    const hasCity = data.locationCityArea !== undefined;
    if (hasState !== hasCity) {
      ctx.addIssue({
        code: "custom",
        message: "State and city / area must be provided together."
      });
      return;
    }
    if (hasState && hasCity) {
      const loc = memberLocationSchema.safeParse({
        locationStateCode: data.locationStateCode,
        locationCityArea: data.locationCityArea
      });
      if (!loc.success) {
        for (const issue of loc.error.issues) {
          ctx.addIssue({ ...issue, path: issue.path });
        }
      }
    }
    const hasBankName = data.bankName !== undefined;
    const hasAccountNumber = data.accountNumber !== undefined;
    if (hasBankName !== hasAccountNumber) {
      ctx.addIssue({
        code: "custom",
        message: "Bank name and account number must be provided together."
      });
    }
  });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id: memberId } = await params;
    const body = profileUpdateSchema.parse(await request.json());

    const { PROFILE_SAFE_COLUMNS, toPublicProfile } = await import("@/lib/security/profile-safe");
    const { data: beforeProfile, error: beforeError } = await services.supabase
      .from("profiles")
      .select(PROFILE_SAFE_COLUMNS)
      .eq("id", memberId)
      .single();
    if (beforeError || !beforeProfile) throw Errors.notFound("Member");

    const bankAccounts = await services.profile.listBankAccounts(memberId);
    const primaryBank = bankAccounts.find((a) => a.is_default) ?? bankAccounts[0] ?? null;

    const fieldChanges: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];
    const profileUpdates: Database["public"]["Tables"]["profiles"]["Update"] = {};

    if (body.fullName !== undefined) {
      const nextName = body.fullName.trim();
      if (nextName !== (beforeProfile.full_name ?? "").trim()) {
        if (!body.identityVerifiedConfirm) {
          throw Errors.badRequest(
            "Changing a member's name requires prior identity verification. Ensure valid identification has been reviewed before continuing."
          );
        }
        profileUpdates.full_name = nextName;
        fieldChanges.push({
          field: "full_name",
          oldValue: beforeProfile.full_name,
          newValue: nextName
        });
      }
    }

    if (body.phone !== undefined && body.phone !== beforeProfile.phone) {
      profileUpdates.phone = body.phone;
      fieldChanges.push({ field: "phone", oldValue: beforeProfile.phone, newValue: body.phone });
    }

    if (body.locationStateCode !== undefined && body.locationStateCode !== beforeProfile.location_state_code) {
      profileUpdates.location_state_code = body.locationStateCode;
      fieldChanges.push({
        field: "location_state_code",
        oldValue: beforeProfile.location_state_code,
        newValue: body.locationStateCode
      });
    }

    if (body.locationCityArea !== undefined && body.locationCityArea !== beforeProfile.location_city_area) {
      profileUpdates.location_city_area = body.locationCityArea;
      fieldChanges.push({
        field: "location_city_area",
        oldValue: beforeProfile.location_city_area,
        newValue: body.locationCityArea
      });
    }

    if (body.accountStatus !== undefined && body.accountStatus !== beforeProfile.account_status) {
      profileUpdates.account_status = body.accountStatus;
      fieldChanges.push({
        field: "account_status",
        oldValue: beforeProfile.account_status,
        newValue: body.accountStatus
      });
    }

    if (body.kycStatus !== undefined && body.kycStatus !== beforeProfile.kyc_status) {
      profileUpdates.kyc_status = body.kycStatus;
      profileUpdates.kyc_reviewed_at = new Date().toISOString();
      fieldChanges.push({
        field: "kyc_status",
        oldValue: beforeProfile.kyc_status,
        newValue: body.kycStatus
      });
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateError } = await services.supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", memberId);
      if (updateError) throw updateError;
    }

    if (body.email !== undefined) {
      const { data: authUser } = await services.supabase.auth.admin.getUserById(memberId);
      const previousEmail = authUser.user?.email ?? null;
      if (body.email !== previousEmail) {
        const { error: emailError } = await services.supabase.auth.admin.updateUserById(memberId, {
          email: body.email
        });
        if (emailError) throw emailError;
        fieldChanges.push({ field: "email", oldValue: previousEmail, newValue: body.email });
        await services.supabase.from("trusted_devices").delete().eq("user_id", memberId);
      }
    }

    if (body.bankName !== undefined && body.accountNumber !== undefined) {
      const saved = await services.profile.upsertPayoutBankAccount(memberId, {
        bankName: body.bankName,
        accountNumber: body.accountNumber
      });
      if ((primaryBank?.bank_name ?? "") !== body.bankName) {
        fieldChanges.push({
          field: "bank_name",
          oldValue: primaryBank?.bank_name ?? null,
          newValue: body.bankName
        });
      }
      if ((primaryBank?.account_number ?? "") !== body.accountNumber) {
        fieldChanges.push({
          field: "bank_account_number",
          oldValue: primaryBank?.account_number ?? null,
          newValue: body.accountNumber
        });
      }
      if ((primaryBank?.account_name ?? "") !== (saved.account_name ?? "")) {
        fieldChanges.push({
          field: "bank_account_name",
          oldValue: primaryBank?.account_name ?? null,
          newValue: saved.account_name
        });
      }
    } else if (profileUpdates.full_name) {
      await services.supabase
        .from("bank_accounts")
        .update({ account_name: String(profileUpdates.full_name) })
        .eq("user_id", memberId);
    }

    if (fieldChanges.length === 0) {
      return NextResponse.json({ ok: true, changes: [] });
    }

    const { data: afterProfile } = await services.supabase
      .from("profiles")
      .select(PROFILE_SAFE_COLUMNS)
      .eq("id", memberId)
      .single();

    for (const change of fieldChanges) {
      await logAdminAction(services.audit, request, {
        actorId: admin.id,
        action: "member.profile_field_updated",
        entityType: "profile",
        entityId: memberId,
        before: toPublicProfile(beforeProfile as Record<string, unknown>) as Record<string, unknown>,
        after: toPublicProfile((afterProfile ?? {}) as Record<string, unknown>) as Record<string, unknown>,
        metadata: {
          administrator: admin.id,
          member: memberId,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          timestamp: new Date().toISOString(),
          reason: change.field === "full_name" ? body.nameChangeReason?.trim() || null : null
        }
      });
    }

    const { AdminNotificationService } = await import("@/services/admin/admin-notification.service");
    const memberLabel = String(afterProfile?.full_name ?? beforeProfile.full_name ?? "Member");
    await new AdminNotificationService(services.supabase).create({
      eventType: "admin.profile_updated",
      title: "Identity / profile updated by admin",
      body: `${memberLabel}\nFields: ${fieldChanges.map((c) => c.field).join(", ")}`,
      entityType: "profile",
      entityId: memberId,
      metadata: {
        priority: "information",
        user_id: memberId,
        fields: fieldChanges.map((c) => c.field),
        administrator: admin.id
      }
    });

    return NextResponse.json({
      ok: true,
      profile: afterProfile,
      changes: fieldChanges
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
