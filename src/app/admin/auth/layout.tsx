import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Alto Rich admin operations authentication.",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark"
};

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
