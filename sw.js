// ========================================================================
// AIO POS — Service Worker
// ورژن: AIO040 — یہ نمبر ہر نئی فائل کے ساتھ لازمی بڑھایا جائے
// ========================================================================
const CACHE_VERSION = 'AIO040';
const CACHE_NAME = 'aio-pos-cache-' + CACHE_VERSION;

const APP_SHELL = [
  './',
  './index.html'
];

// ---------- انسٹال: نیا کیش بنائیں اور فوراً ایکٹو ہونے کے لیے تیار رہیں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

// ---------- ایکٹیویٹ: پرانے ورژن کے کیش صاف کریں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------- "ابھی اپڈیٹ کریں" بٹن سے پیغام موصول ہونے پر فوراً نیا ورژن فعال کریں ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------- فیچ: صفحہ (HTML) ہمیشہ پہلے نیٹ ورک سے تازہ لانے کی کوشش کریں
// تاکہ نیا اپڈیٹ فوراً نظر آئے — نیٹ ورک ناکام ہو تو کیش سے دکھائیں (آف لائن سپورٹ) ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match('./index.html')))
    );
    return;
  }

  // ---------- باقی درخواستیں: پہلے کیش، ورنہ نیٹ ورک ----------
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
