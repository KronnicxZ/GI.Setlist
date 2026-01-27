const CACHE_NAME = 'gi-setlist-v4-pwa';
const urlsToCache = [
    '/',
    '/index.html',
    '/favicon.png',
    '/gi-logo.png',
    '/icon-192.png',
    '/icon-512.png',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
    // Forzar que el nuevo service worker tome control inmediatamente
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        // Estrategia Network-First: intentar red primero, caché como fallback
        fetch(event.request)
            .then(response => {
                // Si la respuesta es válida, clonarla y guardarla en caché
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Si falla la red, intentar obtener del caché
                return caches.match(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Tomar control de todas las páginas inmediatamente
            return self.clients.claim();
        })
    );
});
