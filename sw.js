const CACHE_NAME = "qplus-cache-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => {
        client.postMessage({ type: "READY" });
      });
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // ❌ ข้าม request แปลก ๆ
  if (!req.url.startsWith("http")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }

        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, clone);
        });

        return res;
      })
      .catch(() => caches.match(req))
  );
});