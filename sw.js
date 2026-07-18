// Bu service worker artık kullanılmıyor. Önceden kayıtlı olan tarayıcılarda
// kendini güncelleyip eski önbelleği temizler ve kaydını siler, böylece
// site her zaman sunucudaki en güncel sürümü gösterir.
self.addEventListener("install", function (e) {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll(); })
      .then(function (clientsList) {
        clientsList.forEach(function (client) { client.navigate(client.url); });
      })
  );
});
