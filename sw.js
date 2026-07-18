// havadurumu81 — minimal service worker (sadece "ana ekrana ekle" kurulabilirliği + statik dosya cache'i için)
// Hava durumu API isteklerine asla dokunmaz, her zaman canlı veri çeker.

var CACHE = "hd81-v1";
var ASSETS = ["/style.css", "/script.js", "/data.js"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  if (e.request.url.indexOf("open-meteo.com") !== -1) return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return cached || fetch(e.request);
    })
  );
});
