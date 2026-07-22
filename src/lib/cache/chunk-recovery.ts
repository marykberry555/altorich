export const BUILD_ID_STORAGE_KEY = "altorich:build-id";
export const CHUNK_RECOVERY_FLAG = "altorich:chunk-recovery-attempted";
export const SW_PURGE_FLAG = "altorich:sw-purge-v2";
export const RECOVERY_CHANNEL = "altorich:runtime-recovery";

const CHUNK_ERROR_PATTERN =
  /Loading chunk [\d]+ failed|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i;

/** Legacy cache prefixes from earlier SW strategies that cached HTML / Next runtime. */
const LEGACY_CACHE_PREFIXES = [
  "altorich-html-",
  "altorich-pages-",
  "altorich-runtime-",
  "workbox-precache"
];

/** Hidden longer than this before resume → treat as long-lived background tab. */
export const LONG_BACKGROUND_MS = 30 * 60 * 1000;

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

/**
 * After a healthy boot with the current build, allow future deploys in this
 * tab session to recover again (multi-deploy / multi-tab longevity).
 */
export function markHealthyBoot(buildId: string) {
  syncStoredBuildId(buildId);
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RECOVERY_FLAG);
  } catch {
    /* ignore */
  }
}

export function getStoredBuildId() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(BUILD_ID_STORAGE_KEY);
  } catch {
    return null;
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
 * Nuclear clear — only for confirmed chunk-load recovery.
 * Do NOT call on every page load (races chunk fetching and causes error boundaries).
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
 * Safe boot cleanup:
 * - Always drop known-legacy cache names only
 * - Unregister root SW at most once per browser (flagged), not every navigation
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

  let alreadyPurged = false;
  try {
    alreadyPurged = localStorage.getItem(SW_PURGE_FLAG) === "1";
  } catch {
    alreadyPurged = false;
  }

  if (alreadyPurged || !("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map(async (registration) => {
      try {
        const scopePath = new URL(registration.scope).pathname;
        if (scopePath.startsWith("/admin-app")) return;
        await registration.unregister();
      } catch {
        /* ignore */
      }
    })
  );

  try {
    localStorage.setItem(SW_PURGE_FLAG, "1");
  } catch {
    /* ignore */
  }
}

/**
 * One automatic recovery per tab session (flag cleared after healthy boot).
 * Soft-lands on a stable route after clearing stale runtime artifacts.
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
    /* continue */
  }

  const target = safeRecoveryHref(window.location.pathname);
  broadcastRecovery(target);
  window.location.replace(target);
  return true;
}

/**
 * Silent soft refresh when we know the open document is stale
 * (bfcache restore or long-lived background tab after a deploy).
 * Never shows an error boundary — just lands on a stable route.
 */
export async function softRefreshIfDeployStale(clientBuildId: string, opts?: { force?: boolean }) {
  if (typeof window === "undefined") return false;
  if (!clientBuildId || clientBuildId === "development") return false;
  if (chunkRecoveryAlreadyTried() && !opts?.force) return false;

  const serverBuildId = await probeServerBuildId();
  if (!serverBuildId || serverBuildId === clientBuildId) return false;

  try {
    sessionStorage.setItem(CHUNK_RECOVERY_FLAG, "1");
  } catch {
    /* ignore */
  }

  try {
    await clearRuntimeCaches();
  } catch {
    /* continue */
  }

  const target = safeRecoveryHref(window.location.pathname);
  broadcastRecovery(target);
  window.location.replace(target);
  return true;
}

export async function probeServerBuildId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`/api/build-id?_=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const body = (await res.json()) as { buildId?: string };
    return typeof body.buildId === "string" && body.buildId ? body.buildId : null;
  } catch {
    return null;
  }
}

function broadcastRecovery(target: string) {
  try {
    const channel = new BroadcastChannel(RECOVERY_CHANNEL);
    channel.postMessage({ type: "soft-refresh", target, at: Date.now() });
    channel.close();
  } catch {
    /* Safari private / unsupported — ignore */
  }
}

/** Routes that reload in-place after runtime recovery (must stay aligned with middleware protectedRoutes). */
const IN_APP_RECOVERY_PREFIXES = [
  "/dashboard",
  "/wallet",
  "/portfolio",
  "/investments",
  "/deposits",
  "/withdrawals",
  "/profile",
  "/team",
  "/vip",
  "/activities",
  "/settings",
  "/notifications",
  "/security",
  "/privacy",
  "/documents",
  "/announcements",
  "/learn",
  "/contact",
  "/admin-app",
  "/hard"
] as const;

function isInAppRecoveryPath(pathname: string) {
  return IN_APP_RECOVERY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Reload the current route after cache clear; only fall back when the path is unsafe. */
export function safeRecoveryHref(pathname: string) {
  if (pathname.startsWith("/auth")) return "/auth/login";
  if (isInAppRecoveryPath(pathname)) return pathname;
  return "/";
}

/**
 * Track deploy build id quietly. Never auto-reload solely on mismatch.
 */
export function syncStoredBuildId(buildId: string) {
  if (typeof window === "undefined" || !buildId || buildId === "development") return;
  try {
    localStorage.setItem(BUILD_ID_STORAGE_KEY, buildId);
  } catch {
    /* ignore */
  }
}
