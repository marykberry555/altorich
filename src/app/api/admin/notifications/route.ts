import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminServices } from "@/lib/services";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { AdminNotificationService } from "@/services/admin/admin-notification.service";

export async function GET(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const unreadOnly = request.nextUrl.searchParams.get("unread") === "1";
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 40);
    const notifications = new AdminNotificationService(services.supabase);
    const [items, unreadCount] = await Promise.all([
      notifications.list(limit, unreadOnly),
      notifications.unreadCount()
    ]);

    return NextResponse.json({ items, unreadCount });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

const readSchema = z.object({
  ids: z.array(z.string().uuid()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const body = readSchema.parse(await request.json().catch(() => ({})));
    const notifications = new AdminNotificationService(services.supabase);

    if (body.ids?.length) {
      await notifications.markRead(body.ids);
    } else {
      const unread = await notifications.list(200, true);
      await notifications.markRead(unread.map((n) => n.id));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
