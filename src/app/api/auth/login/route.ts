import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { getAuthService } from "@/lib/auth/service";
import { applySessionToCookies } from "@/lib/auth/apply-session";

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
    const redirect = result.mustChangePin
      ? "/auth/change-pin"
      : result.mustChangePassword
        ? "/auth/change-password"
        : "/dashboard";

    return NextResponse.json({ ok: true, redirect });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
