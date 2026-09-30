// sw.js — Service Worker для офлайн-доступа конного клуба
const CACHE_NAME = 'courage-club-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Исключаем динамические сетевые вызовы (Firebase Realtime DB, Auth, Telegram)
  if (
    url.hostname.includes('firebasedatabase.app') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken') ||
    url.hostname.includes('telegram.org')
  ) {
    return;
  }

  // Для скриптов CDN — Cache First (берем из кэша, если нет — качаем)
  if (url.hostname.includes('gstatic.com')) {
    event.respondWith(
      caches.match(req).then(cached => {
        return cached || fetch(req).then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          return res;
        });
      })
    );
    return;
  }

  // Для самой страницы — Network First (сначала сеть для свежести, при офлайне — из кэша)
  event.respondWith(
    fetch(req).then(response => {
      if (response && response.status === 200) {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
      }
      return response;
    }).catch(() => {
      return caches.match(req).then(cached => {
        return cached || caches.match('./index.html') || caches.match('./');
      });
    })
  );
});
