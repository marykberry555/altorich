import { getSessionUser } from "@/lib/auth/session";
import { getUserServices } from "@/lib/services";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SessionInactivityGuard } from "@/components/auth/SessionInactivityGuard";

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
    const { data: profile } = await services.supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
    if (profile?.full_name) fullName = profile.full_name;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <DashboardShell fullName={fullName} email={email} avatarUrl={avatarUrl}>
      <SessionInactivityGuard />
      {children}
    </DashboardShell>
  );
}
