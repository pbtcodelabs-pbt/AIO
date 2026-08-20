// ======================================================================
// 🔄 AIO POS — Service Worker (آف لائن سپورٹ + خودکار اپڈیٹ)
// ہر نئی فائل نمبر کے ساتھ CACHE_NAME بھی بدل دیں (نیچے v43 کو v44 وغیرہ کر دیں)
// تاکہ صارف کے فون پر پرانا ورژن کیش سے نہ چپکا رہے۔
// ======================================================================
const CACHE_NAME = 'AIO199TH0100PM';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

// ---------- انسٹال: بنیادی فائلیں پہلے سے کیش کر لیں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {}) // ---------- کوئی فائل (مثلاً manifest.json) نہ ملے تو انسٹال ناکام نہ ہو ----------
      .then(() => self.skipWaiting())
  );
});

// ---------- ایکٹیویٹ: پرانے ورژن کے کیش صاف کر دیں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------- فیچ: پہلے نیٹ ورک آزمائیں (تازہ ترین ملے)۔ ناکام ہو تو پہلے وہی مانگی گئی فائل کیش سے دیں —
// صرف اسی وقت index.html پر واپس جائیں جب صفحہ کھولنے کی درخواست ہو (navigation) اور کچھ بھی کیش میں نہ ملے۔
// (پہلے یہ ہر ناکام درخواست پر خاموشی سے index.html دکھا دیتا تھا — چاہے آپ aiotest.html کھول رہے ہوں —
// اسی وجہ سے کبھی کبھار غلط فائل نظر آتی تھی، یہی اصل خرابی تھی) ----------
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached; // ---------- بالکل وہی مانگی گئی فائل مل گئی — یہی واپس دیں ----------
          if (event.request.mode === 'navigate') return caches.match('./index.html'); // ---------- صرف صفحہ کھولنے پر ہی آخری سہارا ----------
          return new Response('', { status: 504, statusText: 'Offline' }); // ---------- دوسری فائلوں کے لیے غلط متبادل کبھی نہ دیں ----------
        })
      )
  );
});

// ---------- "ابھی اپڈیٹ کریں" بٹن سے فوری کنٹرول سنبھالیں ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
