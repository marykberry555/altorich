import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

const profileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  preferredPackageSlug: z.enum(["starter", "growth", "premium", "elite"]).optional(),
  notificationPreferences: z
    .object({
      in_app: z.boolean().optional(),
      email: z.boolean().optional(),
      sms: z.boolean().optional()
    })
    .optional()
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const profile = await services.profile.getProfile(user.id);
    const bankAccounts = await services.profile.listBankAccounts(user.id);

    return NextResponse.json({ profile, bankAccounts });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid profile data.");

    let profile = await services.profile.updateProfile(user.id, {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      preferredPackageSlug: parsed.data.preferredPackageSlug
    });

    if (parsed.data.notificationPreferences) {
      profile = await services.profile.updateNotificationPreferences(
        user.id,
        parsed.data.notificationPreferences
      );
    }

    await services.notifications.notifyEvent("profile.updated", user.id, {});

    return NextResponse.json(profile);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
