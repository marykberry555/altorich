import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { getServiceClientOrThrow } from "@/lib/auth/session";
import { AuthService } from "@/services/auth/auth.service";
import { applySessionToCookies } from "@/lib/auth/apply-session";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";
import { userIsAdmin } from "@/lib/auth/admin-role";
import { captureLoginActivity } from "@/lib/auth/capture-login-activity";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  intent: z.enum(["ops", "admin-app"]).optional()
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const supabase = await getServiceClientOrThrow();
    const auth = new AuthService(supabase);
    const result = await auth.emailPasswordLogin(body);

    await applySessionToCookies(result.session);

    await captureLoginActivity(req, result.userId);

    const isAdmin = await userIsAdmin(supabase, result.userId);
    const redirect =
      body.intent === "admin-app" && isAdmin
        ? "/admin-app"
        : resolvePostLoginRedirect({
            isAdmin,
            mustChangePin: result.mustChangePin,
            mustChangePassword: result.mustChangePassword
          });

    return NextResponse.json({ ok: true, redirect, isAdmin });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
