import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    logger.warn("Auth callback error", { error, errorDescription });
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription ?? error)}`);
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        logger.warn("Session exchange failed", { error: exchangeError.message });
        return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
