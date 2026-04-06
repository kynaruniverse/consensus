self.addEventListener('fetch', (event) => {
  // Basic pass-through for MVP - needed for PWA "Install" prompt
  event.respondWith(fetch(event.request));
});
