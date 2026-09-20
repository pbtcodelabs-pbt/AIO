// توجہ فرمائیں — Service Worker
// آفلائن سپورٹ: ایپ ایک بار کھلنے کے بعد بغیر انٹرنیٹ کے بھی چلے گی۔

const CACHE_NAME = 'tawajjo-farmayen-v4';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// نصب ہوتے وقت: بنیادی فائلیں کیش کر لیں
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// فعال ہوتے وقت: پرانے ورژن کا کیش صاف کر دیں
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// درخواست کا جواب: پہلے کیش، نہ ملے تو نیٹ ورک سے لے کر کیش میں محفوظ کر لیں
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // انٹرنیٹ نہ ہو اور کیش میں بھی نہ ہو تو انڈیکس واپس دے دیں
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
