// ========================================================================
// 🔄 AIO POS — Service Worker (Offline Support + Auto Update)
// ========================================================================
const CACHE_VERSION = 'AIO040';
const CACHE_NAME = `aio-pos-cache-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ---------- انسٹال: نئے ورژن کی فائلیں کیش کریں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// ---------- ایکٹیویٹ: پرانے ورژن کے کیشز صاف کریں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---------- فیچ: نیٹ ورک پہلے، ناکامی پر کیش سے دیں (آف لائن سپورٹ) ----------
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});

// ---------- نیا ورژن فوراً ایکٹیو کرنے کا پیغام (اپڈیٹ ٹوسٹ سے) ----------
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
