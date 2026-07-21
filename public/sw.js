/* AltoRich member SW kill-switch.
 * Older installs registered a root SW that broke phones after deploys
 * (chunk mismatch → endless "Updating Alto Rich" refresh loop).
 * This worker uninstalls itself and clears caches on activate.
 * Do NOT navigate clients (that caused blink loops) and do NOT add a fetch handler.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch {
        /* ignore */
      }
      try {
        await self.clients.claim();
      } catch {
        /* ignore */
      }
    })()
  );
});
