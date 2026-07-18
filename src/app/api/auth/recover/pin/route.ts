import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { getAuthService } from "@/lib/auth/service";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`auth:recover:${ip}`, 8, 60 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many recovery attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter ?? 60) } }
      );
    }

    const body = schema.parse(await req.json());
    const auth = await getAuthService();
    await auth.requestPinRecovery(body.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
