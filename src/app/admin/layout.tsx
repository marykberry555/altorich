import { redirect } from "next/navigation";
import { hasAdminRole } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { SessionInactivityGuard } from "@/components/auth/SessionInactivityGuard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const allowed = await hasAdminRole();
  if (!allowed) redirect("/hard/auth");

  return (
    <>
      <SessionInactivityGuard />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
