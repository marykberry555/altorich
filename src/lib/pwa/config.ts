import { COMPANY } from "@/lib/company";

export const PWA = {
  name: COMPANY.brand,
  shortName: COMPANY.brand,
  description: `${COMPANY.brand} — premium cooperative wealth and investment platform for Nigeria.`,
  startUrl: "/app",
  scope: "/",
  display: "standalone" as const,
  orientation: "portrait-primary" as const,
  themeColor: "#064e3b",
  backgroundColor: "#f8f7f5",
  version: "1.0.0",
  cacheVersion: "altorich-v1",
  installDismissKey: "altorich_pwa_install_dismiss",
  installNeverKey: "altorich_pwa_install_never",
  installVisitKey: "altorich_pwa_visit_count"
} as const;

/** Marketing homepage — logo in member app navigates here. */
export const MARKETING_HOME = "/";

export const APP_SHORTCUTS = [
  { name: "Dashboard", url: "/dashboard", description: "View your portfolio overview" },
  { name: "Wallet", url: "/wallet", description: "Check wallet balance" },
  { name: "Deposit", url: "/deposits", description: "Fund your account" },
  { name: "Invest", url: "/investments", description: "Browse investment plans" }
] as const;
