export const BUILD_ID_STORAGE_KEY = "altorich:build-id";
export const CHUNK_RECOVERY_FLAG = "altorich:chunk-recovery-attempted";

const CHUNK_ERROR_PATTERN =
  /Loading chunk [\d]+ failed|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i;

/** Legacy cache prefixes from earlier SW strategies that cached HTML / Next runtime. */
const LEGACY_CACHE_PREFIXES = ["altorich-html-", "altorich-pages-", "altorich-runtime-", "workbox-precache"];

export function isChunkLoadFailure(message: string) {
  return CHUNK_ERROR_PATTERN.test(message);
}

/** Remove leftover recovery cache-bust params from the visible URL (no reload). */
export function stripCacheBustParam() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has("_cb")) return;

  url.searchParams.delete("_cb");
  const search = url.searchParams.toString();
  const next = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
  window.history.replaceState(null, "", next || "/");
}

function hardReloadWithoutCacheBust() {
  const url = new URL(window.location.href);
  url.searchParams.delete("_cb");
  const search = url.searchParams.toString();
  const clean = `${url.pathname}${search ? `?${search}` : ""}${url.hash}` || "/";
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}` || "/";

  if (clean !== current) {
    window.location.replace(clean);
    return;
  }

  window.location.reload();
}

/**
 * Nuclear clear — only for confirmed chunk-load / BUILD_ID mismatch recovery.
 * Do NOT call on every page load (that races admin/member SW registration).
 */
export async function clearRuntimeCaches() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
}

/**
 * Safe boot cleanup: remove known-legacy caches only.
 * Leaves current `altorich-static-*` and admin-app SWs intact.
 */
export async function clearLegacyRuntimeArtifacts() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => LEGACY_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)))
        .map((key) => caches.delete(key))
    );
  }
}

export async function recoverFromChunkFailure(reason?: string) {
  if (typeof window === "undefined") return false;
  if (!reason || !isChunkLoadFailure(reason)) return false;
  if (sessionStorage.getItem(CHUNK_RECOVERY_FLAG)) return false;

  sessionStorage.setItem(CHUNK_RECOVERY_FLAG, "1");

  try {
    await clearRuntimeCaches();
  } catch {
    // Continue to hard reload even if cache cleanup fails.
  }

  hardReloadWithoutCacheBust();
  return true;
}

export function syncStoredBuildId(buildId: string) {
  if (typeof window === "undefined" || !buildId || buildId === "development") return;

  const stored = localStorage.getItem(BUILD_ID_STORAGE_KEY);
  if (stored && stored !== buildId) {
    localStorage.setItem(BUILD_ID_STORAGE_KEY, buildId);
    void clearRuntimeCaches().finally(() => {
      hardReloadWithoutCacheBust();
    });
    return;
  }

  localStorage.setItem(BUILD_ID_STORAGE_KEY, buildId);
}
