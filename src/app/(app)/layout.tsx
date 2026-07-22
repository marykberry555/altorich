import { getSessionUser } from "@/lib/auth/session";
import { getUserServices } from "@/lib/services";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SessionInactivityGuard } from "@/components/auth/SessionInactivityGuard";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const services = await getUserServices();

  let fullName = "Member";
  let username: string | null = null;
  let avatarUrl: string | null = null;

  if (user) {
    fullName = user.email?.split("@")[0] ?? "Member";
  }

  if (user && services) {
    const { data: profile, error: profileError } = await services.supabase
      .from("profiles")
      .select("full_name, avatar_url, username")
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
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <DashboardShell fullName={fullName} username={username} avatarUrl={avatarUrl}>
      <SessionInactivityGuard />
      {children}
    </DashboardShell>
  );
}
