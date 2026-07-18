import type { Metadata, Viewport } from "next";
import { ADMIN_APP_MANIFEST } from "@/lib/admin-app/constants";
import { AdminThemeRoot } from "@/components/admin-app/AdminThemeRoot";
import "./admin-app.css";

export const metadata: Metadata = {
  title: "Alto Rich Admin",
  description: "Alto Rich operations console for administrators.",
  manifest: ADMIN_APP_MANIFEST,
  applicationName: "Alto Rich Admin",
  appleWebApp: {
    capable: true,
    title: "Alto Rich Admin",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: "/admin-app/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/admin-app/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/admin-app/icon-192.png", sizes: "192x192", type: "image/png" }]
  },
  other: {
    "mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }
  ],
  colorScheme: "light dark"
};

export default function AdminAppRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminThemeRoot>{children}</AdminThemeRoot>;
}
