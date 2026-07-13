const CACHE_NAME = 'gi-setlist-v6-pwa';
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
    const { request } = event;
    // Solo cacheamos GET. Nunca interceptamos escrituras (POST/PUT/DELETE).
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    // Las respuestas de /api/ son datos que cambian: NUNCA cachear (servir datos
    // viejos tras estar offline causaba canciones/setlists desactualizados).
    if (url.pathname.startsWith('/api/')) return; // network-only para la API

    // Cache-First para los bundles hasheados de CRA (/static/js|css|media): el
    // nombre de archivo lleva hash de contenido, así que son INMUTABLES — si
    // están en caché, servirlos sin tocar la red hace la recarga casi
    // instantánea. Un deploy nuevo cambia el hash → es otra URL → se descarga.
    if (url.origin === self.location.origin && url.pathname.startsWith('/static/')) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
                    }
                    return response;
                });
            })
        );
        return;
    }

    event.respondWith(
        // Network-First para el resto (index.html, iconos): red primero para no
        // servir un shell viejo, caché como fallback offline.
        fetch(request)
            .then(response => {
                if (response && response.status === 200 && url.origin === self.location.origin) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
                }
                return response;
            })
            .catch(() => caches.match(request))
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
