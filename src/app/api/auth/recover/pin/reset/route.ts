import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { getAuthService } from "@/lib/auth/service";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPin: z.string().length(6)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const auth = await getAuthService();
    await auth.resetPin(body.email, body.code, body.newPin);
    return NextResponse.json({ ok: true, redirect: "/auth/login" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
