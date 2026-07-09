import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { getAuthService } from "@/lib/auth/service";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const auth = await getAuthService();
    await auth.requestPinRecovery(body.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
