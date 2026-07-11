/* AltoRich production service worker — static + navigation caching, no sensitive API cache */
const CACHE_VERSION = "altorich-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  "/offline",
  "/site.webmanifest",
  "/icons/android-chrome-192x192.png",
  "/icons/android-chrome-512x512.png",
  "/brand/icon-light.webp",
  "/brand/logo-light.webp"
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
        Promise.all(keys.filter((key) => key.startsWith("altorich-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE).map((key) => caches.delete(key)))
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

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".woff2")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (shouldBypassCache(url)) return;

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
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
});
