import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { HARD_OPS_HOME } from "@/lib/hard-ops";

export async function POST(request: NextRequest) {
  try {
    const reviewer = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const formData = await request.formData();
    const announcement = String(formData.get("globalAnnouncement") ?? "");
    const withdrawalWindows = String(formData.get("withdrawalWindows") ?? "");

    if (announcement) {
      await services.settings.updateAnnouncement(announcement, reviewer.id);
    }

    if (withdrawalWindows) {
      await services.supabase.from("settings").upsert({
        key: "withdrawal_windows",
        value: { description: withdrawalWindows },
        updated_by: reviewer.id,
        updated_at: new Date().toISOString()
      });
    }

    const trustedDeviceDays = Number(formData.get("trustedDeviceDays") ?? 0);
    if (trustedDeviceDays >= 7 && trustedDeviceDays <= 365) {
      await services.settings.updateAuthSettings({ trusted_device_days: trustedDeviceDays }, reviewer.id);
    }

    await services.audit.log({
      actorId: reviewer.id,
      action: "platform_settings.updated",
      entityType: "settings",
      metadata: { keys: ["announcements", "withdrawal_windows", "auth_settings"] }
    });
  } catch (error) {
    return apiErrorResponse(error);
  }

  redirect(`${HARD_OPS_HOME}/settings`);
}
