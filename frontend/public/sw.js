const cacheName = 'app-cache-v1';
const staticAssets = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.png',
];

self.addEventListener('install', async (e) => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
    return self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || fetch(e.request);
        })
    );
});

