import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { AppError, Errors } from "@/lib/errors";

export async function applySessionToCookies(session: Session | null | undefined) {
  if (!session?.access_token || !session.refresh_token) {
    throw new AppError("Sign-in did not return a session.", 500, "SESSION_MISSING");
  }

  const supabase = await createClient();
  if (!supabase) throw Errors.notConfigured();

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });
  if (error) throw new AppError(error.message, 500, "SESSION_ERROR");
}
