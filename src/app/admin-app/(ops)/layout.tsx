import { redirect } from "next/navigation";
import { hasAdminRole } from "@/lib/auth/session";
import { AdminAppShell } from "@/components/admin-app/AdminAppShell";
import { AdminAppPwaProvider } from "@/components/admin-app/AdminAppPwaProvider";
import { SessionInactivityGuard } from "@/components/auth/SessionInactivityGuard";

export default async function AdminAppOpsLayout({ children }: { children: React.ReactNode }) {
  let allowed = false;
  try {
    allowed = await hasAdminRole();
  } catch {
    allowed = false;
  }
  if (!allowed) redirect("/admin/auth");

  return (
    <AdminAppPwaProvider>
      <SessionInactivityGuard />
      <AdminAppShell>{children}</AdminAppShell>
    </AdminAppPwaProvider>
  );
}
