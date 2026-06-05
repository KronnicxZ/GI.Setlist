const CACHE_NAME = 'gi-setlist-v5-pwa';
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

    event.respondWith(
        // Network-First para assets estáticos: red primero, caché como fallback.
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
