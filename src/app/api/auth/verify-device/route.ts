import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { getAuthService } from "@/lib/auth/service";
import { authJsonResponse } from "@/lib/auth/apply-session";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";
import { getServiceClientOrThrow } from "@/lib/auth/session";
import { userIsAdmin } from "@/lib/auth/admin-role";
import { captureLoginActivity } from "@/lib/auth/capture-login-activity";
import { clientIpFromHeaders, geoFromRequestHeaders } from "@/lib/auth/user-agent";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(64),
  deviceFingerprint: z.string().min(3, "Device verification is required. Refresh and try again."),
  userAgent: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const auth = await getAuthService();
    const geo = geoFromRequestHeaders(req.headers);
    const result = await auth.verifyDeviceOtp({
      email: body.email,
      code: body.code,
      deviceFingerprint: body.deviceFingerprint,
      userAgent: body.userAgent ?? req.headers.get("user-agent") ?? "",
      ipAddress: clientIpFromHeaders(req.headers) ?? null,
      country: geo.country ?? null
    });

    await captureLoginActivity(req, result.userId);

    const supabase = await getServiceClientOrThrow();
    const isAdmin = await userIsAdmin(supabase, result.userId);
    const redirect = resolvePostLoginRedirect({
      isAdmin,
      mustChangePin: result.mustChangePin,
      mustChangePassword: result.mustChangePassword
    });

    return authJsonResponse({ ok: true, redirect, isAdmin }, result.session);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
