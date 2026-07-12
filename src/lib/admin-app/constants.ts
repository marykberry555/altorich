/** Dedicated installable Admin PWA — separate from member app and /hard web ops. */
export const ADMIN_APP_HOME = "/admin-app";
/** Canonical admin authentication entry for web + native Android app. */
export const ADMIN_AUTH = "/admin/auth";
/** Public install landing — no sign-in required to add the admin PWA. */
export const ADMIN_APP_INSTALL = "/admin-app/install";
/** Public APK download page for the native Admin Android app. */
export const ADMIN_DOWNLOAD = "/admin/download";
/** Auto-generated release metadata written by android:admin:release. */
export const ADMIN_RELEASE_META = "/downloads/admin-release.json";

export function adminAppPath(segment?: string) {
  if (!segment) return ADMIN_APP_HOME;
  const normalized = segment.startsWith("/") ? segment : `/${segment}`;
  return `${ADMIN_APP_HOME}${normalized}`;
}

export const ADMIN_APP_MANIFEST = "/admin-app/manifest.webmanifest";
export const ADMIN_APP_SW = "/admin-app/sw.js";
