const cacheName = 'app-cache-v1';

const staticAssets = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/manifest-icon-192.maskable.png',
    '/icons/manifest-icon-512.maskable.png',
    '/src/main.jsx',
    '/src/App.jsx',
    '/src/components/Navbar.jsx',
    '/src/components/Footer.jsx',
    '/src/pages/DashboardPage.jsx',
    '/src/pages/AnalysisPage.jsx',
    '/src/pages/BudgetPage.jsx',
    '/src/pages/ReportsPage.jsx',
    '/src/pages/TransactionsPage.jsx',
    'src/helpers/notifyOnSavingsDeficit.js',
    'src/helpers/numInputVerifier.js',
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
    const url = new URL(e.request.url);
    if (url.pathname.startsWith('/api/')) {
        return;
    }
    e.respondWith(
        caches.match(e.request)
            .then((cachedResponse) => {
                return cachedResponse || fetch(e.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(cacheName).then((cache) => {
                            cache.put(e.request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            })
    );
});

self.addEventListener('push', event => {
    let data = {};
    if (event.data) {
        data = event.data.json();
    }

    const title = data.title || 'Oszczędności';
    const options = {
        body: data.body || 'Sprawdź swoje oszczędności!',
        icon: '/icons/manifest-icon-192.maskable.png',
        badge: '/icons/manifest-icon-192.maskable.png',
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (const client of clientList) {
                if (client.url === event.notification.data && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data);
            }
        })
    );
});


