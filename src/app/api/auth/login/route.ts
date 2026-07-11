import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { getAuthService } from "@/lib/auth/service";
import { applySessionToCookies } from "@/lib/auth/apply-session";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";
import { getServiceClientOrThrow } from "@/lib/auth/session";
import { userIsAdmin } from "@/lib/auth/admin-role";
import { captureLoginActivity } from "@/lib/auth/capture-login-activity";
import { recordSecurityEvent } from "@/lib/auth/record-security-event";

const schema = z.object({
  username: z.string().min(3),
  pin: z.string().length(6),
  deviceFingerprint: z.string().min(3),
  userAgent: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const auth = await getAuthService();
    const result = await auth.login({
      username: body.username,
      pin: body.pin,
      deviceFingerprint: body.deviceFingerprint,
      userAgent: body.userAgent ?? req.headers.get("user-agent") ?? ""
    });

    if (result.requiresDeviceOtp) {
      return NextResponse.json({
        requiresDeviceOtp: true,
        email: result.email,
        mustChangePin: result.mustChangePin,
        mustChangePassword: result.mustChangePassword
      });
    }

    await applySessionToCookies(result.session);

    await captureLoginActivity(req, result.userId);

    const supabase = await getServiceClientOrThrow();
    const isAdmin = await userIsAdmin(supabase, result.userId);
    const redirect = resolvePostLoginRedirect({
      isAdmin,
      mustChangePin: result.mustChangePin,
      mustChangePassword: result.mustChangePassword
    });

    return NextResponse.json({ ok: true, redirect, isAdmin });
  } catch (error) {
    try {
      const supabase = await getServiceClientOrThrow();
      await recordSecurityEvent(supabase, {
        eventType: "login.failed",
        request: req,
        metadata: { route: "pin_login", message: error instanceof Error ? error.message : "Login failed" }
      });
    } catch {
      // ignore
    }
    return apiErrorResponse(error);
  }
}
