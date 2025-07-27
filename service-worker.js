// Define a name for the cache
const CACHE_NAME = 'my-pwa-cache-v1';

// List the files and assets to be cached
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// --- INSTALL EVENT ---
// This event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install event fired.');
    // waitUntil() ensures that the service worker will not install until the code inside has successfully completed.
    event.waitUntil(
        // Open the cache by name.
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell...');
                // Add all the specified assets to the cache.
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('[Service Worker] Failed to cache assets during install:', err);
            })
    );
});

// --- ACTIVATE EVENT ---
// This event is fired when the service worker is activated.
// It's a good place to clean up old caches.
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate event fired.');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // If a cache is found that is not our current cache, delete it.
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Activation complete!');
            // Take control of the page immediately.
            return self.clients.claim();
        })
    );
});

// --- FETCH EVENT ---
// This event is fired for every network request made by the page.
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        // Try to find a matching response in the cache.
        caches.match(event.request)
            .then((response) => {
                // If a cached response is found, return it.
                if (response) {
                    // console.log('[Service Worker] Serving from cache:', event.request.url);
                    return response;
                }

                // If no cached response is found, fetch it from the network.
                // console.log('[Service Worker] Fetching from network:', event.request.url);
                return fetch(event.request).then((networkResponse) => {
                    // Check if we received a valid response.
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
                    // We need one for the browser to consume and one to place in the cache.
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            // Put the new response in the cache.
                            cache.put(event.request, responseToCache);
                        });

                    return networkResponse;
                }).catch(error => {
                    // This catch block handles network failures.
                    console.error('[Service Worker] Fetch failed:', error);
                    // You could return a custom offline page here if you had one cached.
                    // For example: return caches.match('/offline.html');
                });
            })
    );
});
