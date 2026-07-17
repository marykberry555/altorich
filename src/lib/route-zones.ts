/** Member, admin, and auth surfaces — Live Activity must never appear here. */
export const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/wallet",
  "/portfolio",
  "/deposits",
  "/withdrawals",
  "/notifications",
  "/settings",
  "/profile",
  "/team",
  "/activities",
  "/vip",
  "/investments",
  "/hard",
  "/auth",
  "/admin-app",
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/app",
  "/offline",
  "/dev"
];

export function isAppRoute(pathname: string) {
  return APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Public marketing site — social proof allowed when the visitor is signed out. */
export function isMarketingRoute(pathname: string) {
  return !isAppRoute(pathname);
}

/** Explicit allow-list style helper for documentation / tests. */
export function isLiveActivityPath(pathname: string) {
  return isMarketingRoute(pathname);
}
