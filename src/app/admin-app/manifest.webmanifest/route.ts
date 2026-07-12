import { NextResponse } from "next/server";
import { ADMIN_APP_HOME, ADMIN_APP_INSTALL } from "@/lib/admin-app/constants";

export async function GET() {
  const manifest = {
    name: "Alto Rich Admin",
    short_name: "Admin",
    description: "Alto Rich operations console for administrators.",
    start_url: ADMIN_APP_INSTALL,
    scope: `${ADMIN_APP_HOME}/`,
    id: ADMIN_APP_HOME,
    display: "standalone",
    orientation: "any",
    background_color: "#09090b",
    theme_color: "#09090b",
    lang: "en-NG",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/admin-app/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/admin-app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/admin-app/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [
      { name: "Dashboard", url: ADMIN_APP_HOME },
      { name: "Deposits", url: `${ADMIN_APP_HOME}/deposits` },
      { name: "Withdrawals", url: `${ADMIN_APP_HOME}/payouts` },
      { name: "Members", url: `${ADMIN_APP_HOME}/members` }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
