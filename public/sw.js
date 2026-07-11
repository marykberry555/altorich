/* AltoRich production service worker — static + navigation caching, no sensitive API cache */
const CACHE_VERSION = "altorich-v4";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  "/offline",
  "/site.webmanifest",
  "/icons/android-chrome-192x192.png",
  "/icons/android-chrome-512x512.png"
];

const NEVER_CACHE = ["/api/", "/auth/callback", "/hard/auth"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("altorich-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function shouldBypassCache(url) {
  if (url.origin !== self.location.origin) return true;
  if (NEVER_CACHE.some((path) => url.pathname.startsWith(path))) return true;
  if (url.pathname.startsWith("/_next/webpack-hmr")) return true;
  return false;
}

function isNextStaticAsset(pathname) {
  return pathname.startsWith("/_next/static/");
}

function isOtherStaticAsset(pathname) {
  return (
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".woff2")
  );
}

async function networkFirstNextStatic(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? Response.error();
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (shouldBypassCache(url)) return;

  if (isNextStaticAsset(url.pathname)) {
    event.respondWith(networkFirstNextStatic(request));
    return;
  }

  if (isOtherStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match("/offline");
          return offline ?? Response.error();
        })
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith("altorich-")).map((key) => caches.delete(key)))
      )
    );
  }
});
