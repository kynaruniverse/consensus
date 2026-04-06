const CACHE_NAME = 'spitfact-v1';

// Basic install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Basic fetch event (Required for PWA installation)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
