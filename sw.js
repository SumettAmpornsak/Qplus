const CACHE_NAME = "qplus-cache-v4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
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

  if (!req.url.startsWith("http")) return;

  // ✅ ไม่ cache เฉพาะสิ่งที่ทำให้ PWA พัง
  if (
    req.destination === "image" ||          // icon
    req.url.includes("manifest.json")       // manifest
  ) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // ✅ ที่เหลือทำงานเหมือนเดิม (offline ยังอยู่)
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (!res || res.status !== 200) return res;

        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, clone);
        });

        return res;
      })
      .catch(() => caches.match(req))
  );
});