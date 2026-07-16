/* ==========================================================================
   AIO POS — Service Worker (آف لائن سپورٹ + آٹو اپڈیٹ)
   ---------------------------------------------------------------------
   جب بھی آپ ایپ میں کوئی تبدیلی کر کے دوبارہ اپلوڈ کریں،
   نیچے دیا ہوا CACHE_VERSION نمبر ضرور بڑھا دیں (v1 -> v2 -> v3 ...)
   ورنہ صارف کے فون پر پرانا کیش دکھتا رہے گا۔
   ========================================================================== */

const CACHE_VERSION = 'v4';
const CACHE_NAME = `aio-pos-${CACHE_VERSION}`;

// ---------- ایپ شیل: وہ فائلیں جو آف لائن کام کرنے کے لیے ضروری ہیں ----------
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

// ---------- انسٹال: ایپ شیل کو کیش میں محفوظ کریں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()) // نیا ورژن فوراً تیار ہو جائے (activate کا انتظار نہ کرے)
  );
});

// ---------- ایکٹیویٹ: پرانے (پچھلے ورژن کے) کیشز صاف کریں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('aio-pos-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------- فیچ: مختلف قسم کی درخواستوں کے لیے مختلف حکمت عملی ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // صرف GET درخواستیں ہینڈل کریں
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // ---------- 1) خود ایپ کی نیویگیشن (پیج کھلنا) — Network First، ناکامی پر Cache سے ----------
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', resClone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ---------- 2) اسی ویب سائٹ کی فائلیں (same-origin) — Cache First ----------
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        });
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ---------- 3) گوگل فونٹس وغیرہ (cross-origin) — Stale While Revalidate ----------
  // مطلب: فوراً کیش سے دکھائیں (اگر موجود ہو)، اور پس منظر میں نیا ورژن لے کر کیش اپڈیٹ کر دیں۔
  // آف لائن ہونے کی صورت میں body میں پہلے سے موجود system font (var(--font)) استعمال ہو جاتا ہے۔
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// ---------- صفحے سے پیغام آنے پر (نیا اپڈیٹ ابھی لاگو کریں) ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
