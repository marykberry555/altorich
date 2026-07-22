import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { getServiceClientOrThrow } from "@/lib/auth/session";
import { AuthService } from "@/services/auth/auth.service";
import { authJsonResponse } from "@/lib/auth/apply-session";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";
import { userIsAdmin } from "@/lib/auth/admin-role";
import { captureLoginActivity } from "@/lib/auth/capture-login-activity";
import { recordSecurityEvent } from "@/lib/auth/record-security-event";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  intent: z.enum(["ops", "admin-app"]).optional()
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`auth:sign-in:${ip}`, 20, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter ?? 60) } }
      );
    }

    const body = schema.parse(await req.json());
    if (body.intent === "admin-app" || body.intent === "ops") {
      const adminLimited = rateLimit(`auth:admin-login:${ip}`, 15, 15 * 60_000);
      if (!adminLimited.ok) {
        return NextResponse.json(
          { error: "Too many admin sign-in attempts. Please try again shortly." },
          { status: 429, headers: { "Retry-After": String(adminLimited.retryAfter ?? 60) } }
        );
      }
    }

    const supabase = await getServiceClientOrThrow();
    const auth = new AuthService(supabase);
    const result = await auth.emailPasswordLogin(body);

    const isAdmin = await userIsAdmin(supabase, result.userId);
    if (body.intent && !isAdmin) {
      throw new AppError("Administrator access required.", 403, "FORBIDDEN");
    }

    await captureLoginActivity(req, result.userId);

    const redirect = resolvePostLoginRedirect({
      isAdmin,
      mustChangePin: result.mustChangePin,
      mustChangePassword: result.mustChangePassword,
      intent: body.intent
    });

    return authJsonResponse({ ok: true, redirect, isAdmin }, result.session);
  } catch (error) {
    try {
      const supabase = await getServiceClientOrThrow();
      await recordSecurityEvent(supabase, {
        eventType: "login.failed",
        request: req,
        metadata: { route: "admin_sign_in", message: error instanceof Error ? error.message : "Login failed" }
      });
    } catch {
      // ignore
    }
    return apiErrorResponse(error);
  }
}
