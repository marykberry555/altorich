import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HARD_OPS_HOME } from "@/lib/hard-ops";

/** PWA start URL — login first, dashboard when authenticated. */
export default async function AppStartPage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/auth/login");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    const { data: isAdmin } = await supabase.rpc("has_admin_role");
    if (isAdmin) redirect(HARD_OPS_HOME);
  } catch {
    // fall through to member dashboard
  }

  redirect("/dashboard");
}
