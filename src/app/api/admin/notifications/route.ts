import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminServices, getServiceRoleServices } from "@/lib/services";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { AdminNotificationService } from "@/services/admin/admin-notification.service";
import { AdminPushService } from "@/services/admin/admin-push.service";
import type { AdminNotificationFilter } from "@/lib/admin-app/notification-events";

const FILTERS = new Set<string>([
  "all",
  "registrations",
  "logins",
  "investments",
  "withdrawals",
  "deposits",
  "system",
  "payouts"
]);

export async function GET(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const unreadOnly = request.nextUrl.searchParams.get("unread") === "1";
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 40);
    const filterParam = request.nextUrl.searchParams.get("filter") ?? "all";
    const rawFilter = FILTERS.has(filterParam) ? filterParam : "all";
    const filter = (rawFilter === "payouts" ? "withdrawals" : rawFilter) as AdminNotificationFilter;

    const notifications = new AdminNotificationService(services.supabase);
    const [items, unreadCount] = await Promise.all([
      notifications.list(limit, unreadOnly, filter),
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

const deliverSchema = z.object({
  id: z.string().uuid()
});

/** Idempotent push delivery for realtime-created notifications. */
export async function PUT(request: NextRequest) {
  try {
    await getAdminServices();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = deliverSchema.parse(await request.json());
    const push = new AdminPushService(services.supabase);
    const result = await push.deliverPushForNotificationId(body.id);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
