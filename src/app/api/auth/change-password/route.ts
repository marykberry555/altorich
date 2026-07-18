import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { requireSessionUser, getServiceClientOrThrow } from "@/lib/auth/session";
import { getAuthService } from "@/lib/auth/service";
import { userIsAdmin } from "@/lib/auth/admin-role";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";
import { isStrongPassword, WEAK_PASSWORD_MESSAGE } from "@/lib/validation/identity";

const schema = z.object({
  newPassword: z.string().min(8).refine(isStrongPassword, WEAK_PASSWORD_MESSAGE)
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = schema.parse(await req.json());
    const auth = await getAuthService();
    await auth.changePassword(user.id, body.newPassword);

    const supabase = await getServiceClientOrThrow();
    const isAdmin = await userIsAdmin(supabase, user.id);
    const redirect = resolvePostLoginRedirect({ isAdmin, mustChangePin: false, mustChangePassword: false });

    return NextResponse.json({ ok: true, redirect });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
