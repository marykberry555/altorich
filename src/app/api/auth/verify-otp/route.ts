import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { getAuthService } from "@/lib/auth/service";
import { applySessionToCookies } from "@/lib/auth/apply-session";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const auth = await getAuthService();
    const result = await auth.verifyRegistrationOtp(body.email, body.code);
    await applySessionToCookies(result.session);
    return NextResponse.json({ ok: true, redirect: "/dashboard" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
