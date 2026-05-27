const CACHE_NAME = 'worthain-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch (no caching for now, just to satisfy PWA requirements)
  event.respondWith(fetch(event.request));
});
