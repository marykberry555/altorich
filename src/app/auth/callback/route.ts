import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { buildPublicUrl, redirectToPath, safeRedirectPath } from "@/lib/request-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = safeRedirectPath(searchParams.get("redirect"));
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    logger.warn("Auth callback error", { error, errorDescription });
    const loginUrl = buildPublicUrl("/auth/login", request);
    loginUrl.searchParams.set("error", errorDescription ?? error);
    return Response.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        logger.warn("Session exchange failed", { error: exchangeError.message });
        const loginUrl = buildPublicUrl("/auth/login", request);
        loginUrl.searchParams.set("error", exchangeError.message);
        return Response.redirect(loginUrl);
      }
    }
  }

  return redirectToPath(redirect, request);
}
