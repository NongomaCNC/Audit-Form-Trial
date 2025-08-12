/**
 * Service Worker for Field Data Capture PWA
 *
 * Caching Strategy: Cache First for app shell, Network First for data.
 * This ensures the app loads instantly from cache while always trying to get fresh data if available.
 */

const CACHE_NAME = 'field-data-cache-v1';
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js'
];

// --- INSTALL: Cache the application shell ---
self.addEventListener('install', event => {
    console.log('[SW] Install event');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                return cache.addAll(APP_SHELL_URLS);
            })
            .catch(error => {
                console.error('[SW] Failed to cache app shell:', error);
            })
    );
});

// --- ACTIVATE: Clean up old caches ---
self.addEventListener('activate', event => {
    console.log('[SW] Activate event');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control of the page immediately
});

// --- FETCH: Serve from cache or network ---
self.addEventListener('fetch', event => {
    // For navigation requests (e.g., loading the page), use a cache-first strategy.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request);
                })
        );
        return;
    }

    // For other requests (scripts, images, etc.), also use cache-first.
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Return from cache if found
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Otherwise, fetch from network, cache it, and return it
                return fetch(event.request).then(networkResponse => {
                    // Check if we received a valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                        return networkResponse;
                    }
                    
                    // IMPORTANT: Clone the response. A response is a stream
                    // and because we want the browser to consume the response
                    // as well as the cache consuming the response, we need
                    // to clone it so we have two streams.
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return networkResponse;
                }).catch(error => {
                    console.error('[SW] Fetch failed; returning offline page instead.', error);
                    // Optionally, return a fallback page/image if fetch fails
                });
            })
    );
});

// --- SYNC: Background synchronization ---
// This event is triggered by the browser when connectivity is restored.
// You would need to register a sync event from your main app script.
// For this example, we'll rely on the online event listener in the main script
// to trigger the sync process, as 'sync' is not yet universally supported.
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Sync event triggered for tag:', event.tag);
    // Here you would typically call a function to process the sync queue
    // event.waitUntil(processSyncQueue());
  }
});
