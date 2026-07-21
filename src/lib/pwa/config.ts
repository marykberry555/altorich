export const PWA = {
  name: "Alto Rich",
  shortName: "Alto Rich",
  description: "",
  startUrl: "/app",
  scope: "/",
  display: "standalone" as const,
  orientation: "portrait-primary" as const,
  themeColor: "#064e3b",
  backgroundColor: "#f8f7f5",
  version: "1.0.0",
  cacheVersion: "altorich-disabled",
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
  { name: "Invest", url: "/investments", description: "Browse investment portfolios" }
] as const;
