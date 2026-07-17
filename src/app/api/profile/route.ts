import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { phoneSchema } from "@/lib/validation/schemas";
import { memberLocationSchema } from "@/lib/location/validation";

const profileSchema = z
  .object({
    fullName: z.string().min(2).optional(),
    phone: phoneSchema.optional(),
    preferredPackageSlug: z.enum(["starter", "growth", "premium", "elite"]).optional(),
    locationStateCode: z.string().min(2).max(8).optional(),
    locationCityArea: z.string().min(2).max(64).optional(),
    notificationPreferences: z
      .object({
        in_app: z.boolean().optional(),
        email: z.boolean().optional(),
        sms: z.boolean().optional()
      })
      .optional()
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
      preferredPackageSlug: parsed.data.preferredPackageSlug,
      locationStateCode: parsed.data.locationStateCode,
      locationCityArea: parsed.data.locationCityArea
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
