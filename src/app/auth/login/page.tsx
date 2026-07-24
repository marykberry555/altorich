import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthPageFallback } from "@/components/auth/AuthPageFallback";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_APP_HOME } from "@/lib/admin-app/constants";
import { canAccessMemberApp, normalizeAccountStatus } from "@/lib/account-status/policy";

/** PWA / deep-link entry — show login, or continue when already signed in. */
export default async function AuthLoginPage() {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("id", user.id)
        .maybeSingle();
      const status = normalizeAccountStatus(profile?.account_status as string | undefined);
      if (!canAccessMemberApp(status)) {
        await supabase.auth.signOut();
      } else {
        try {
          const { data: isAdmin } = await supabase.rpc("has_admin_role");
          if (isAdmin) redirect(ADMIN_APP_HOME);
        } catch {
          // fall through to member dashboard
        }
        redirect("/dashboard");
      }
    }
  }

  return (
    <Suspense fallback={<AuthPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}
