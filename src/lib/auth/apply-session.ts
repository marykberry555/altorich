import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function applySessionToCookies(session: Session) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });
  if (error) throw error;
}
