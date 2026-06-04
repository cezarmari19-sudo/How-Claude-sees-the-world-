const CACHE_NAME = 'claude-vision-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(e.request)
          .then(response => {
            // Cache new requests dynamically
            if (
              response.status === 200 &&
              response.type === 'basic'
            ) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(e.request, clone));
            }
            return response;
          })
          .catch(() => caches.match('/index.html'));
      })
  );
});

// Background sync — check for updates
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});