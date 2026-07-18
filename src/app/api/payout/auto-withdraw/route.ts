import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

const autoPayoutSchema = z.object({
  enabled: z.boolean()
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const profile = await services.profile.getProfile(user.id);
    return NextResponse.json({ enabled: Boolean(profile.auto_weekly_payout) });
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
    const parsed = autoPayoutSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid auto withdrawal setting.");

    const profile = await services.profile.setAutoWeeklyPayout(user.id, parsed.data.enabled);

    await services.notifications.notifyEvent(
      parsed.data.enabled ? "withdrawal.auto_scheduled" : "profile.updated",
      user.id,
      { auto_weekly_payout: parsed.data.enabled }
    );

    return NextResponse.json({ enabled: Boolean(profile.auto_weekly_payout) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
