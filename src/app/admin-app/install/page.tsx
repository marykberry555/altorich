import type { Metadata } from "next";
import { AdminAppPwaProvider } from "@/components/admin-app/AdminAppPwaProvider";
import { AdminInstallPageContent } from "@/components/admin-app/AdminInstallPageContent";
import { ADMIN_APP_INSTALL } from "@/lib/admin-app/constants";

export const metadata: Metadata = {
  title: "Install Alto Rich Admin",
  description: "Install the Alto Rich admin operations console on your device."
};

export default function AdminAppInstallPage() {
  return (
    <AdminAppPwaProvider>
      <AdminInstallPageContent />
    </AdminAppPwaProvider>
  );
}
