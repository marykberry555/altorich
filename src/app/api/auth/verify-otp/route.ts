import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { getAuthService } from "@/lib/auth/service";
import { authJsonResponse } from "@/lib/auth/apply-session";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`auth:otp:${ip}`, 20, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many verification attempts. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter ?? 60) } }
      );
    }

    const body = schema.parse(await req.json());
    const emailLimited = rateLimit(`auth:otp:email:${body.email.toLowerCase()}`, 10, 15 * 60_000);
    if (!emailLimited.ok) {
      return NextResponse.json(
        { error: "Too many verification attempts for this email." },
        { status: 429, headers: { "Retry-After": String(emailLimited.retryAfter ?? 60) } }
      );
    }

    const auth = await getAuthService();
    const result = await auth.verifyRegistrationOtp(body.email, body.code);
    return authJsonResponse({ ok: true, redirect: "/dashboard" }, result.session);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
