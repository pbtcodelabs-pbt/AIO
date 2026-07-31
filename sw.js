// ========================================================================
// AIO POS — Service Worker
// ورژن نمبر — ہر نئی فائل کے ساتھ یہ نمبر بدلیں (ہوم پیج کے چھوٹے بیج کے نمبر سے میچ ہونا چاہیے)
// ========================================================================
const SW_VERSION   = 'AIO024';
const CACHE_NAME    = 'aio-pos-cache-' + SW_VERSION;
const CORE_ASSETS   = [
  './',
  './index.html',
  './manifest.json'
];

// ---------- انسٹال: نئی کیش بنائیں اور بنیادی فائلیں محفوظ کریں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  // یہاں جان بوجھ کر خودکار skipWaiting() نہیں بلایا جا رہا —
  // صارف کو پہلے "نیا ورژن دستیاب ہے" کا ٹوسٹ نظر آئے، وہ "ابھی اپڈیٹ کریں" دبائے تو ہی نیا ورژن فعال ہو۔
});

// ---------- ایکٹیویٹ: پرانی کیشز صاف کریں، فوراً کنٹرول سنبھالیں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------- انڈیکس/ایپ کا مین صفحہ ہمیشہ پہلے نیٹ ورک سے لانے کی کوشش (تازہ ترین اپڈیٹ ملے)،
// ناکامی پر (آف لائن) کیش سے دکھائیں — باقی ریکویسٹس کیش-فرسٹ (تیز + آف لائن سپورٹ) ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const isNavigation = req.mode === 'navigate' ||
    (req.destination === 'document');

  if(isNavigation){
    event.respondWith(
      fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', resClone));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if(cached) return cached;
      return fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => cached);
    })
  );
});

// ---------- صفحے سے "SKIP_WAITING" پیغام ملے تو نیا ورژن فوراً فعال کریں ----------
self.addEventListener('message', (event) => {
  if(event.data === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
