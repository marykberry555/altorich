import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { requireSessionUser } from "@/lib/auth/session";
import { getAuthService } from "@/lib/auth/service";

const schema = z.object({
  currentPin: z.string().length(6).optional(),
  newPin: z.string().length(6),
  forced: z.boolean().optional()
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = schema.parse(await req.json());
    const auth = await getAuthService();

    if (body.forced) {
      await auth.setPin(user.id, body.newPin);
    } else {
      if (!body.currentPin) throw new Error("Current pin is required.");
      await auth.changePin(user.id, body.currentPin, body.newPin);
    }

    return NextResponse.json({ ok: true, redirect: "/dashboard" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
