import { getSessionUser } from "@/lib/auth/session";
import { getUserServices } from "@/lib/services";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SessionInactivityGuard } from "@/components/auth/SessionInactivityGuard";
import { LiveNowProvider } from "@/lib/hooks/use-live-now";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const services = await getUserServices();

  let fullName = "Member";
  let email: string | undefined;
  let avatarUrl: string | null = null;

  if (user) {
    email = user.email ?? undefined;
    fullName = user.email?.split("@")[0] ?? "Member";
  }

  if (user && services) {
    const { data: profile, error: profileError } = await services.supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      const { logQueryFailure } = await import("@/lib/supabase/safe-query");
      logQueryFailure(
        { route: "/app", component: "AppLayout", fn: "profiles.select", userId: user.id },
        profileError
      );
    }

    if (profile?.full_name) fullName = profile.full_name;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <LiveNowProvider>
      <DashboardShell fullName={fullName} email={email} avatarUrl={avatarUrl}>
        <SessionInactivityGuard />
        {children}
      </DashboardShell>
    </LiveNowProvider>
  );
}
