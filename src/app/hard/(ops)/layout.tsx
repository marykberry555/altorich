import { redirect } from "next/navigation";
import { hasAdminRole } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { SessionInactivityGuard } from "@/components/auth/SessionInactivityGuard";
import { HARD_OPS_HOME } from "@/lib/hard-ops";

export default async function HardOpsLayout({ children }: { children: React.ReactNode }) {
  const allowed = await hasAdminRole();
  if (!allowed) redirect(`/auth/login?redirect=${HARD_OPS_HOME}`);

  return (
    <>
      <SessionInactivityGuard />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
