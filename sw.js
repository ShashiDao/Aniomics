// This file allows your site to be installed as an app
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Logic for offline support can go here later
});
