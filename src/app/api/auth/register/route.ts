import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { getAuthService } from "@/lib/auth/service";

const schema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3).max(24),
  email: z.string().email(),
  phone: z.string().min(10),
  pin: z.string().length(6),
  referralCode: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const auth = await getAuthService();
    const result = await auth.register(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
