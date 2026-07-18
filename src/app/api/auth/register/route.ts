import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { getAuthService } from "@/lib/auth/service";
import { phoneSchema } from "@/lib/validation/schemas";
import { memberLocationSchema } from "@/lib/location/validation";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const schema = z
  .object({
    fullName: z.string().min(2),
    username: z.string().min(3).max(24),
    email: z.string().email(),
    phone: phoneSchema,
    pin: z.string().length(6),
    preferredPackage: z.enum(["starter", "growth", "premium", "elite"]),
    referralCode: z.string().min(3).max(32).optional(),
    locationStateCode: z.string().min(2).max(8),
    locationCityArea: z.string().min(2).max(64)
  })
  .superRefine((data, ctx) => {
    const loc = memberLocationSchema.safeParse({
      locationStateCode: data.locationStateCode,
      locationCityArea: data.locationCityArea
    });
    if (!loc.success) {
      for (const issue of loc.error.issues) {
        ctx.addIssue({ ...issue, path: issue.path });
      }
    }
  });

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`auth:register:${ip}`, 8, 60 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter ?? 60) } }
      );
    }

    const body = schema.parse(await req.json());
    const auth = await getAuthService();
    const result = await auth.register(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
