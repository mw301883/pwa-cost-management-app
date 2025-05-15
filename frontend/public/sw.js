const cacheName = 'app-cache-v1';

const staticAssets = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.png',
    '/src/main.jsx',
    '/src/App.jsx',
    '/src/pages/DashboardPage.jsx',

];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(staticAssets);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    const cacheWhitelist = [cacheName];
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (!cacheWhitelist.includes(cache)) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(e.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(cacheName).then((cache) => {
                        cache.put(e.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            });
        })
    );
});
