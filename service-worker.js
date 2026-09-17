const CACHE_NAME = 'ezygo-static-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/config.js',
  '/app.js',
  '/admin.js',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon-32.png',
  '/favicon-64.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-512.png',
  '/splash-logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => caches.match('/index.html')))
  );
});
