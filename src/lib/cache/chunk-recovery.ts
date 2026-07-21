export const BUILD_ID_STORAGE_KEY = "altorich:build-id";
export const CHUNK_RECOVERY_FLAG = "altorich:chunk-recovery-attempted";

const CHUNK_ERROR_PATTERN =
  /Loading chunk [\d]+ failed|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i;

/** Legacy cache prefixes from earlier SW strategies that cached HTML / Next runtime. */
const LEGACY_CACHE_PREFIXES = [
  "altorich-html-",
  "altorich-pages-",
  "altorich-runtime-",
  "altorich-static-",
  "workbox-precache"
];

export function isChunkLoadFailure(message: string) {
  return CHUNK_ERROR_PATTERN.test(message);
}

export function chunkRecoveryAlreadyTried() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(CHUNK_RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}

/** Remove leftover recovery params from the visible URL (no reload). */
export function stripCacheBustParam() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  let dirty = false;
  for (const key of ["_cb", "_recover"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      dirty = true;
    }
  }
  if (!dirty) return;

  const search = url.searchParams.toString();
  const next = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
  window.history.replaceState(null, "", next || "/");
}

/**
 * Clear member caches + root service workers.
 * Leaves `/admin-app/` scoped workers alone.
 */
export async function clearRuntimeCaches() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(
          (key) =>
            key.startsWith("altorich") ||
            LEGACY_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))
        )
        .map((key) => caches.delete(key))
    );
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(async (registration) => {
        try {
          const scopePath = new URL(registration.scope).pathname;
          // Never touch admin-app push/SW scope.
          if (scopePath.startsWith("/admin-app")) return;
          await registration.unregister();
        } catch {
          /* ignore */
        }
      })
    );
  }
}

/**
 * Boot cleanup for phones/PWAs: drop stale member SWs and legacy caches.
 * Safe to run every load — we no longer register a root SW for the member site.
 */
export async function clearLegacyRuntimeArtifacts() {
  await clearRuntimeCaches();
}

/**
 * One automatic recovery per tab session. Never loops.
 * Returns false when recovery was already attempted (caller must show a stable UI).
 */
export async function recoverFromChunkFailure(reason?: string) {
  if (typeof window === "undefined") return false;
  if (!reason || !isChunkLoadFailure(reason)) return false;
  if (chunkRecoveryAlreadyTried()) return false;

  try {
    sessionStorage.setItem(CHUNK_RECOVERY_FLAG, "1");
  } catch {
    /* private mode — still try once */
  }

  try {
    await clearRuntimeCaches();
  } catch {
    // Continue to hard navigation even if cache cleanup fails.
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("_cb");
  url.searchParams.set("_recover", "1");
  window.location.replace(url.pathname + url.search + url.hash);
  return true;
}

/**
 * Track deploy build id quietly. Never auto-reload — that caused PWA blink loops
 * after every production deploy on phones with a stored previous BUILD_ID.
 */
export function syncStoredBuildId(buildId: string) {
  if (typeof window === "undefined" || !buildId || buildId === "development") return;
  try {
    localStorage.setItem(BUILD_ID_STORAGE_KEY, buildId);
  } catch {
    /* ignore quota / private mode */
  }
}
