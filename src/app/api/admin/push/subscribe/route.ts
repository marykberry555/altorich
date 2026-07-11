import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, getServiceClientOrThrow } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/errors";
import { AdminPushSubscriptionService } from "@/services/admin/admin-notification.service";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});

/** Prepare Admin App for Web Push — stores subscription when VAPID is configured. */
export async function POST(req: Request) {
  try {
    const user = await requireAdmin();
    const body = schema.parse(await req.json());
    const supabase = await getServiceClientOrThrow();
    const push = new AdminPushSubscriptionService(supabase);

    await push.upsert({
      adminUserId: user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: req.headers.get("user-agent") ?? undefined
    });

    return NextResponse.json({
      ok: true,
      pushEnabled: Boolean(process.env.ADMIN_VAPID_PUBLIC_KEY && process.env.ADMIN_VAPID_PRIVATE_KEY)
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.ADMIN_VAPID_PUBLIC_KEY && process.env.ADMIN_VAPID_PRIVATE_KEY),
    publicKey: process.env.ADMIN_VAPID_PUBLIC_KEY ?? null
  });
}
