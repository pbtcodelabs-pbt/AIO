// ========================================================================
// AIO POS — Service Worker
// آف لائن سپورٹ + آٹو اپڈیٹ سسٹم (GitHub Pages کے لیے تیار)
// ========================================================================

// ---------- ہر بار جب آپ HTML میں تبدیلی کریں تو یہ ورژن نمبر بدل دیں
//            تاکہ صارفین کے پاس نیا ورژن خودکار پہنچ جائے ----------
const SW_VERSION   = 'v1.0.0-20260806';
const CACHE_NAME    = `aio-pos-${SW_VERSION}`;

// ---------- وہ فائلیں جو ایپ کے چلنے کے لیے ضروری ہیں (App Shell) ----------
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

// ========================================================================
// INSTALL — نیا ورژن انسٹال ہوتے ہی App Shell کو کیش کریں
// ========================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('SW install caching failed:', err))
  );
  // نوٹ: self.skipWaiting() جان بوجھ کر نہیں لگایا —
  // موجودہ index.html میں پہلے سے "ابھی اپڈیٹ کریں" ٹوسٹ کا نظام موجود ہے
  // جو reg.waiting.postMessage({type:'SKIP_WAITING'}) بھیجتا ہے۔
});

// ========================================================================
// ACTIVATE — پرانے ورژن کے کیش خودکار صاف کر دیں
// ========================================================================
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

// ========================================================================
// MESSAGE — "ابھی اپڈیٹ کریں" بٹن دبانے پر نیا ورژن فوراً فعال کریں
// ========================================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ========================================================================
// FETCH — نیٹ ورک اول (تازہ ترین ڈیٹا)، ناکامی پر کیش سے دکھائیں (آف لائن سپورٹ)
// ========================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // صرف GET درخواستیں ہینڈل کریں
  if (request.method !== 'GET') return;

  // بیرونی (cross-origin) درخواستیں (مثلاً Google Fonts) براؤزر پر چھوڑ دیں
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // کامیاب جواب کو تازہ کیش میں محفوظ کریں
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return networkResponse;
      })
      .catch(() =>
        // آف لائن ہونے کی صورت میں کیش سے دکھائیں
        caches.match(request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
