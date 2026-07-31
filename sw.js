// ==============================================================
// AIO POS — Service Worker (آف لائن سپورٹ + خودکار اپڈیٹ)
// ==============================================================
// جب بھی index.html میں کوئی بڑی تبدیلی کر کے GitHub پر دوبارہ اپلوڈ کریں،
// نیچے CACHE_VERSION کا نمبر بڑھا دیں (مثلاً v3 → v4) — ورنہ صارفین کو
// پرانی cached کاپی ہی نظر آتی رہے گی۔
const CACHE_VERSION = 'aio-pos-v1';
const CACHE_NAME = CACHE_VERSION;

// یہ فائلیں پہلی بار کھلتے ہی آف لائن استعمال کے لیے محفوظ کر لی جائیں گی
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

// ---------- INSTALL: نیا ورژن انسٹال ہوتے ہی بنیادی فائلیں کیش کریں (فوری فعال نہیں ہوتا — صارف کے "Update" بٹن کا انتظار) ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// ---------- ACTIVATE: پرانے ورژن کی کیش صاف کریں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------- FETCH: پہلے نیٹ ورک آزمائیں (تازہ ترین ورژن ملے)، ناکامی پر کیش سے دکھائیں (آف لائن سپورٹ) ----------
self.addEventListener('fetch', (event) => {
  // صرف GET request ہی ہینڈل کریں — POST/PUT وغیرہ کو چھوڑ دیں
  if(event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // کامیاب نیٹ ورک جواب کو بھی کیش میں تازہ کر دیں تاکہ اگلی بار آف لائن بھی یہی نیا ورژن ملے
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return networkResponse;
      })
      .catch(() =>
        // نیٹ ورک ناکام (آف لائن) — کیش سے دیں، اور اگر وہ بھی نہ ملے تو index.html (سنگل پیج ایپ) واپس دیں
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});

// ---------- صفحے سے "SKIP_WAITING" پیغام ملنے پر نیا ورژن فوراً فعال کریں ----------
self.addEventListener('message', (event) => {
  if(event.data === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
