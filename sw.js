// ============================================================================
// AIO028 — Service Worker (آف لائن سپورٹ + خودکار اپڈیٹ کا نظام)
// ============================================================================
// ورژن نمبر بدلنے سے ہی نیا کیش بنے گا اور صارفین کو اپڈیٹ ٹوسٹ نظر آئے گا۔
// ہر نیا ورژن (AIO029, AIO030...) ریلیز کرتے وقت CACHE_VERSION ضرور بڑھائیں۔
const CACHE_VERSION = 'aio028-v1';
const CACHE_NAME = `aio-pos-${CACHE_VERSION}`;

// ---------- ایپ شیل — یہ فائلیں انسٹال کے وقت پہلے سے کیش ہو جائیں گی ----------
const APP_SHELL = [
  './',
  './index.html',
];

// ---------- انسٹال: نئی کیش بنائیں اور ایپ شیل محفوظ کریں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        // اگر کوئی فائل کیش نہ ہو سکے تب بھی انسٹال ناکام نہ ہو
        console.warn('SW: app shell cache میں کچھ فائلیں محفوظ نہیں ہو سکیں', err);
      });
    })
  );
  // نوٹ: خودکار skipWaiting() یہاں نہیں کیا — صارف کو "ابھی اپڈیٹ کریں" ٹوسٹ کے
  // ذریعے خود فیصلہ کرنے دیا جاتا ہے (index.html میں موجود applyPwaUpdate سے)
});

// ---------- ایکٹیویشن: پرانی کیشز صاف کریں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('aio-pos-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ---------- صفحہ سے پیغام: "ابھی اپڈیٹ کریں" دبانے پر فوری فعال ہو جائیں ----------
self.addEventListener('message', (event) => {
  if(event.data === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

// ---------- فیچ: Network-first, cache fallback ----------
// (یہ ایپ اکثر اپڈیٹ ہوتی ہے، اس لیے پہلے تازہ نیٹ ورک کاپی کی کوشش، ناکامی پر
// آف لائن حالت میں کیش شدہ کاپی دکھائیں تاکہ دکان کا بلنگ کبھی نہ رکے)
self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return; // POST وغیرہ کو نظر انداز کریں

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // کامیاب جواب کو کیش میں تازہ رکھیں
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return networkResponse;
      })
      .catch(() => {
        // نیٹ ورک ناکام (آف لائن) — کیش سے دیں، ورنہ index.html (SPA fallback)
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
