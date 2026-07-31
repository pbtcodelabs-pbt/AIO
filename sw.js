// ---------- AIO POS — Service Worker (آف لائن سپورٹ + اپڈیٹ کا نظام) ----------
// نوٹ: جب بھی ایپ میں کوئی بڑی تبدیلی کریں تو نیچے CACHE_VERSION بڑھا دیں،
// تاکہ صارفین کو خودکار "Update" ٹوسٹ نظر آئے (index.html میں یہی نظام پہلے سے موجود ہے)۔
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'aio-pos-cache-' + CACHE_VERSION;

// ---------- شروع میں یہ فائلیں کیش کر لیں تاکہ آف لائن بھی ایپ کھل سکے ----------
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ---------- انسٹال: بنیادی فائلیں کیش میں محفوظ کریں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------- ایکٹیویٹ: پرانے ورژن کی کیشز صاف کر دیں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('aio-pos-cache-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------- فیچ: نیٹ ورک پہلے آزمائیں (تازہ ترین ورژن ملے)، ناکام ہونے پر کیش سے دکھا دیں ----------
self.addEventListener('fetch', (event) => {
  // صرف GET درخواستیں ہینڈل کریں
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // نئی کاپی کیش میں اپڈیٹ کر دیں تاکہ اگلی بار آف لائن بھی چل سکے
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // اگر صفحہ (navigation) مانگا جا رہا تھا اور کیش میں بھی نہیں ملا تو مرکزی صفحہ دکھا دیں
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        })
      )
  );
});

// ---------- SKIP_WAITING پیغام ملنے پر نیا ورژن فوراً فعال کر دیں (index.html کے "Update" بٹن سے آتا ہے) ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
