/* AltoRich service worker — static assets only. Never cache HTML or Next.js runtime. */
const BUILD_ID = "JV74xAmR8tnWmGBFnvKBK";
const CACHE_PREFIX = "altorich-static-";
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;

/** Paths that must always hit the network (never SW cache). */
const NETWORK_ONLY =
  /\/(_next\/|api\/|auth\/|dashboard|wallet|portfolio|investments|deposits|withdrawals|profile|hard\/)/;

/** Offline-safe static assets only. */
const CACHEABLE_STATIC = /\.(png|jpe?g|webp|gif|ico|svg|woff2?|ttf|otf)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(["/offline"]).catch(() => undefined))
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
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept HTML, manifests, SW, or Next.js bundles.
  if (
    NETWORK_ONLY.test(url.pathname) ||
    url.pathname === "/sw.js" ||
    url.pathname === "/site.webmanifest" ||
    request.mode === "navigate" ||
    request.headers.get("accept")?.includes("text/html")
  ) {
    return;
  }

  if (!CACHEABLE_STATIC.test(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
  );
});
