const CACHE_NAME = 'puntos-v2';
const urlsToCache = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json'];

self.addEventListener('install', event => {
  // Forzar activación inmediata del nuevo SW
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  // Limpiar caches antiguos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Tomar control inmediatamente
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request) // Network First: Intenta red primero (ideal para desarrollo)
      .catch(() => caches.match(event.request)) // Si falla red, usa cache
  );
});