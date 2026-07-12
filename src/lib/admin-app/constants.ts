/** Dedicated installable Admin PWA — separate from member app and /hard web ops. */
export const ADMIN_APP_HOME = "/admin-app";
/** Public install landing — no sign-in required to add the admin PWA. */
export const ADMIN_APP_INSTALL = "/admin-app/install";

export function adminAppPath(segment?: string) {
  if (!segment) return ADMIN_APP_HOME;
  const normalized = segment.startsWith("/") ? segment : `/${segment}`;
  return `${ADMIN_APP_HOME}${normalized}`;
}

export const ADMIN_APP_MANIFEST = "/admin-app/manifest.webmanifest";
export const ADMIN_APP_SW = "/admin-app/sw.js";
