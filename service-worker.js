// Define a name for the cache
const CACHE_NAME = 'field-data-cache-v1';

// List all the files that need to be cached for the app to work offline
const FILES_TO_CACHE = [
  './', // This caches the root URL, which serves index.html
  './index.html',
  './manifest.json',
  './xlsx.full.min.js', // The locally downloaded script
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// The 'install' event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  // We wait until the cache is opened and all our files are added to it.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// The 'activate' event is fired when the service worker is activated.
// It's a good place to clean up old caches.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  // Remove outdated caches
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// The 'fetch' event intercepts all network requests made by the app.
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Fetch', event.request.url);
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // 1. Try to find the response in the cache.
      return cache.match(event.request).then((response) => {
        // If it's in the cache, return it (this makes it work offline).
        if (response) {
          console.log(`[Service Worker] Returning from cache: ${event.request.url}`);
          return response;
        }
        
        // 2. If it's not in the cache, fetch it from the network.
        console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
        return fetch(event.request);
      });
    })
  );
});
