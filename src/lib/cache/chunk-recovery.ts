export const BUILD_ID_STORAGE_KEY = "altorich:build-id";
export const CHUNK_RECOVERY_FLAG = "altorich:chunk-recovery-attempted";

const CHUNK_ERROR_PATTERN =
  /Loading chunk [\d]+ failed|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i;

export function isChunkLoadFailure(message: string) {
  return CHUNK_ERROR_PATTERN.test(message);
}

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

  const url = new URL(window.location.href);
  url.searchParams.set("_cb", String(Date.now()));
  window.location.replace(url.toString());
  return true;
}

export function syncStoredBuildId(buildId: string) {
  if (typeof window === "undefined" || !buildId || buildId === "development") return;

  const stored = localStorage.getItem(BUILD_ID_STORAGE_KEY);
  if (stored && stored !== buildId) {
    localStorage.setItem(BUILD_ID_STORAGE_KEY, buildId);
    void clearRuntimeCaches().finally(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("_cb", String(Date.now()));
      window.location.replace(url.toString());
    });
    return;
  }

  localStorage.setItem(BUILD_ID_STORAGE_KEY, buildId);
}
