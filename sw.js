// ==========================================================================
// AIO POS & ERP — Service Worker
// یہ فائل index.html کو آف لائن کام کرنے کے قابل بناتی ہے۔
//
// اہم: ہر بار جب آپ index.html کا نیا ورژن (نیا AIO نمبر) اپلوڈ کریں،
// نیچے CACHE_VERSION کا نمبر ایک بڑھا دیں (v1 → v2 → v3 ...)۔
// یہی وہ واحد چیز ہے جو ایپ کو بتاتی ہے کہ نیا ورژن آ گیا ہے، تاکہ
// "🔄 New update available" کا بینر صحیح وقت پر نظر آئے۔ اگر یہ نمبر
// نہ بدلا جائے تو براؤزر یہ نہیں سمجھ پائے گا کہ اپڈیٹ آیا ہے۔
// ==========================================================================
const CACHE_VERSION = 'v3';
const CACHE_NAME = 'aio-pos-cache-' + CACHE_VERSION;

// ---------- انسٹال ہوتے ہی ایپ کی بنیادی فائل کیش کر لیں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['./', './index.html']))
  );
});

// ---------- ایکٹیویٹ ہوتے ہی پرانے ورژن کی کیش صاف کر دیں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// ---------- ایپ سے "SKIP_WAITING" پیغام ملنے پر نیا ورژن فوراً فعال کر دیں
//            (index.html کے "Update Now" بٹن سے یہ پیغام بھیجا جاتا ہے) ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// ---------- ہر درخواست کے لیے: پہلے انٹرنیٹ سے تازہ ترین کاپی لانے کی کوشش کریں
//            (تاکہ آن لائن ہونے پر ہمیشہ نیا ورژن ملے)، اور اسے کیش میں محفوظ کر لیں۔
//            اگر انٹرنیٹ نہ ہو (آف لائن) تو کیش سے دکھا دیں۔ ----------
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
