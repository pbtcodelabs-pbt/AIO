// ---------- AIO POS — Service Worker ----------
// جب بھی ایپ میں نیا فیچر/فکس آئے تو یہ ورژن نمبر بڑھا دیں (مثلاً v21 → v22)۔
// یہی وہ سگنل ہے جس سے پرانے صارفین کے فون پر "نیا ورژن دستیاب ہے" کا پیغام آتا ہے۔
const CACHE_VERSION = 'aio-pos-v21';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ---------- انسٹال: بنیادی فائلیں کیش کریں، فوراً ایکٹیویٹ ہونے کے لیے تیار رہیں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // ---------- نیا ورکر فوراً "installed" حالت میں چلا جائے (ابھی کنٹرول نہیں لیتا — وہ SKIP_WAITING پیغام پر ہوگا) ----------
});

// ---------- ایکٹیویٹ: پرانے ورژن کے کیش صاف کر دیں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ---------- صفحہ سے "ابھی اپڈیٹ کریں" دبانے پر یہ پیغام آتا ہے ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------- فیچ حکمت عملی ----------
// HTML/manifest: پہلے نیٹ ورک آزمائیں (تازہ ترین ورژن ملے)، آف لائن ہو تو کیش سے دکھائیں۔
// باقی سب (فونٹس، CDN وغیرہ): پہلے کیش، نہ ملے تو نیٹ ورک — اور نیٹ ورک سے ملنے پر کیش تازہ کر دیں۔
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isNavigation = req.mode === 'navigate' || req.url.endsWith('index.html') || req.url.endsWith('manifest.json');

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
