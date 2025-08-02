// Define a versioned cache name.
const CACHE_NAME = 'field-data-cache-v1';

// List the core files (the "app shell") to be cached.
const assetsToCache = [
  '/', // This represents the main index.html file
  'index.html',
  'manifest.json',
  'icon-192x192.png',
  'icon-512x512.png',
  'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// 1. Install the service worker and cache the app shell.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell...');
        return cache.addAll(assetsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache app shell.', error);
      })
  );
});

// 2. Activate the service worker and clean up old caches.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. Intercept network requests and serve from cache first.
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the response is in the cache, return it.
        if (response) {
          // console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        // If the response is not in the cache, fetch it from the network.
        // console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request);
      })
      .catch(error => {
        console.error('Service Worker: Error fetching data.', error);
      })
  );
});
