import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { getAuthService } from "@/lib/auth/service";
import { applySessionToCookies } from "@/lib/auth/apply-session";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";
import { getServiceClientOrThrow } from "@/lib/auth/session";
import { userIsAdmin } from "@/lib/auth/admin-role";
import { captureLoginActivity } from "@/lib/auth/capture-login-activity";
import { recordSecurityEvent } from "@/lib/auth/record-security-event";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  username: z.string().min(3),
  pin: z.string().length(6),
  deviceFingerprint: z.string().min(3),
  userAgent: z.string().optional(),
  intent: z.enum(["ops", "admin-app"]).optional()
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`auth:login:${ip}`, 20, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter ?? 60) } }
      );
    }

    const body = schema.parse(await req.json());
    const userLimited = rateLimit(`auth:login:user:${body.username.toLowerCase()}`, 10, 15 * 60_000);
    if (!userLimited.ok) {
      return NextResponse.json(
        { error: "Too many login attempts for this account. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(userLimited.retryAfter ?? 60) } }
      );
    }

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

    const supabase = await getServiceClientOrThrow();
    const isAdmin = await userIsAdmin(supabase, result.userId);

    if (body.intent && !isAdmin) {
      throw new AppError("Administrator access required.", 403, "FORBIDDEN");
    }

    await applySessionToCookies(result.session);
    await captureLoginActivity(req, result.userId);

    const redirect = resolvePostLoginRedirect({
      isAdmin,
      mustChangePin: result.mustChangePin,
      mustChangePassword: result.mustChangePassword,
      intent: body.intent
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
      /* ignore secondary logging failures */
    }
    return apiErrorResponse(error);
  }
}
