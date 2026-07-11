/* Alto Rich Admin App service worker — push notification prep */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
  event.waitUntil(
    self.clients.openWindow(event.notification.data?.url ?? "/admin-app")
  );
});
