import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { getServiceClientOrThrow } from "@/lib/auth/session";
import { AuthService } from "@/services/auth/auth.service";
import { applySessionToCookies } from "@/lib/auth/apply-session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const supabase = await getServiceClientOrThrow();
    const auth = new AuthService(supabase);
    const result = await auth.adminLogin(body);
    await applySessionToCookies(result.session);

    const redirect = result.mustChangePassword ? "/auth/change-password?admin=1" : "/admin";
    return NextResponse.json({ ok: true, redirect });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
