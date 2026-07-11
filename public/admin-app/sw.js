/* Alto Rich Admin App service worker */
const OFFLINE_URL = "/admin-app/offline.html";
const CACHE = "alto-admin-app-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/admin-app/icon-192.png", "/admin-app/icon-512.png"])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith("/admin-app")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "admin-ops-sync") {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const payload = event.data.payload ?? {};
    event.waitUntil(
      self.registration.showNotification(payload.title ?? "Alto Rich Admin", {
        body: payload.body ?? "",
        icon: "/admin-app/icon-192.png",
        badge: "/admin-app/icon-192.png",
        data: payload
      })
    );
  }
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? { title: "Alto Rich Admin", body: "New operational event" };
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Alto Rich Admin", {
      body: payload.body ?? "",
      icon: "/admin-app/icon-192.png",
      badge: "/admin-app/icon-192.png",
      data: payload
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? "/admin-app"));
});
