// ======================================================================
// 🔄 AIO POS — Service Worker (آف لائن سپورٹ + خودکار اپڈیٹ)
// ہر نئی فائل نمبر کے ساتھ CACHE_NAME بھی بدل دیں (نیچے v43 کو v44 وغیرہ کر دیں)
// تاکہ صارف کے فون پر پرانا ورژن کیش سے نہ چپکا رہے۔
// ======================================================================
const CACHE_NAME = 'AIO0811SU187';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];
// ---------- سست انٹرنیٹ پر سفید اسکرین کا علاج: اپنی فائلوں کے لیے نیٹ ورک کو صرف اتنی دیر دیں،
// پھر فون میں محفوظ کاپی سے فوراً کھولیں — تازہ فائل پیچھے خاموشی سے آتی رہے اور اگلی بار کام آئے ----------
const NET_TIMEOUT_MS = 3500;

// ---------- انسٹال: بنیادی فائلیں الگ الگ کیش کریں (ایک ناکام ہو تو باقی متاثر نہ ہوں) ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('Precache failed for', url, err))
        )
      ))
      .then(() => self.skipWaiting())
  );
});

// ---------- ایکٹیویٹ: پرانے کیش صاف کریں — مگر نئے کیش میں index.html نہ ہو تو پہلے پرانی کاپی منتقل کریں
// تاکہ آف لائن/سست نیٹ پر ایپ کبھی خالی نہ کھلے ----------
// 🛡️ ایک ہی ویب سائٹ پر دوسری ایپس بھی ہیں — صرف اسی ایپ کے پرانے کیش مٹائیں، کسی دوسری ایپ کا کبھی نہیں
const isOwnCache = (k) => /^AIO\d/.test(k);
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const cache = await caches.open(CACHE_NAME);
    for (const url of ['./', './index.html']) {
      if (await cache.match(url)) continue;
      for (const k of keys) {
        if (k === CACHE_NAME || !isOwnCache(k)) continue;
        const old = await (await caches.open(k)).match(url);
        if (old) { await cache.put(url, old); break; }
      }
    }
    await Promise.all(keys.filter((k) => isOwnCache(k) && k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function cachedFallback(req) {
  return caches.match(req).then((c) => c || (req.mode === 'navigate' ? (caches.match('./index.html').then((i) => i || caches.match('./'))) : null));
}

self.addEventListener('fetch', (event) => {
  /* ہیلپ ڈیسک (#33): pbtcodelabs-pbt.github.io/help/ کی فائلیں (widget.js) کبھی کیش نہیں — ہر ایپ میں نیا بٹن فوراً */
  try { const _hd = new URL(event.request.url); if (_hd.hostname === 'pbtcodelabs-pbt.github.io' && _hd.pathname.startsWith('/help/')) return; } catch (_e) {}
  const req = event.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  /* AIO0711SA174: Firebase / Google کی ڈیٹا درخواستیں (دکان کا کوڈ، ملازم، فون کی فہرست، لاگ اِن) کبھی کیش نہیں —
     پہلے آف لائن / سست نیٹ پر پرانا جواب مل جاتا تھا اور فون جڑتے ہوئے «دکان نہیں ملی / پن غلط» آتا تھا */
  try { const _h = new URL(req.url).hostname; if (/(^|\.)(firestore|identitytoolkit|securetoken|firebaseio|googleapis)\.com$/.test(_h) && !/^fonts\./.test(_h)) return; } catch (_e) {}

  // ---------- دوسری ویب سائٹس (فونٹس وغیرہ): پہلے جیسا — نیٹ ورک، ناکامی پر کیش ----------
  if (!sameOrigin) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return response;
        })
        .catch(() => caches.match(req).then((c) => c || new Response('', { status: 504, statusText: 'Offline' })))
    );
    return;
  }

  // ---------- اپنی فائلیں: نیٹ ورک اور 3.5 سیکنڈ کی دوڑ — نیٹ جلدی جواب دے تو تازہ، ورنہ محفوظ کاپی ----------
  const network = fetch(req).then((res) => {
    if (res && res.ok) {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
    }
    return res;
  });
  event.waitUntil(network.then(() => {}, () => {})); // پیچھے تازہ کاپی مکمل ڈاؤن لوڈ ہو کر محفوظ ہوتی رہے

  event.respondWith(new Promise((resolve) => {
    let done = false;
    const finish = (r) => { if (!done && r) { done = true; resolve(r); } };
    const timer = setTimeout(() => { cachedFallback(req).then(finish); }, NET_TIMEOUT_MS);
    network
      .then((res) => { clearTimeout(timer); finish(res); })
      .catch(() => {
        clearTimeout(timer);
        cachedFallback(req).then((c) => finish(c || new Response('', { status: 504, statusText: 'Offline' })));
      });
  }));
});

// ---------- "ابھی اپڈیٹ کریں" بٹن سے فوری کنٹرول سنبھالیں ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
