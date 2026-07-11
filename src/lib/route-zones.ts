/** Member app + admin ops — no marketing widgets (chat, social proof). */
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
  "/auth"
];

export function isAppRoute(pathname: string) {
  return APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Public marketing site — Smartsupp and social proof allowed. */
export function isMarketingRoute(pathname: string) {
  return !isAppRoute(pathname);
}
