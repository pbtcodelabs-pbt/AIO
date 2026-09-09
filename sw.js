// ---------- 🏷️ صدام فروٹ منڈی — Service Worker ----------
// یہ نمبر HTML فائل کے APP_BUILD_VERSION جیسا نہیں ہوتا (وہ اردو میں ہے، یہ ہمیشہ انگریزی/ASCII میں رہے گا) —
// صرف کیش کا نام بدلنے کے لیے استعمال ہوتا ہے تاکہ پرانی فائلیں خودکار صاف ہو کر نئی لوڈ ہو جائیں۔
// ہر نئی ڈیلیوری پر یہ نمبر لازمی بدلیں (فائل کے نام جیسا ہی رکھیں) ----------
const CACHE_VERSION = 'FM9SEPWE0458PM';
const CACHE_NAME = 'saddam-fruit-mandi-' + CACHE_VERSION;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './favicon-32.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './JameelNooriNastaleeq-Regular.ttf',
  './JameelNooriNastaleeq-Kasheeda.ttf',
  // ---------- 🆕 صدام کی ہدایت (FM8SEPTU4): 3 نئے فونٹ — fonts/ فولڈر میں ---------- -->
  './fonts/PTSimpleBoldRuled.ttf',
  './fonts/ThuluthAlsmt.ttf',
  './fonts/JameelKhushkhati.ttf',
  // ---------- 🐛 صدام کی ہدایت (FM6SEPSU4): PDMS_Multan_Regular.ttf یہاں سے ہٹا دیا — یہ فائل ریپو میں
  // موجود ہی نہیں تھی، ہر install پر ناکام رہتی تھی، ہٹانے سے precache تیز اور صاف ہو گیا ---------- -->
  // ---------- 🐛 صدام کی ہدایت: "پرنٹ (A4)" بٹن انٹرنیٹ نہ ہونے پر کام کرے، اس لیے jsPDF بھی پہلے سے کیش ----------
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// ---------- انسٹال — نیا ورژن آتے ہی سب ضروری فائلیں پیشگی کیش کر لیں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('Precache failed for', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ---------- ایکٹیویٹ — پرانے ورژن کے کیش خودکار صاف کر دیں ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ---------- فیچ — اسی اوریجن کی فائلیں: پہلے کیش، نہ ملے تو نیٹ ورک (اور نیٹ ورک سے ملنے پر خودکار کیش اپڈیٹ) ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // ---------- 🐛 صدام کی ہدایت: مخصوص، محفوظ CDN فائلیں (jsPDF، گوگل فونٹس) بھی کیش ہوں —
  // باقی سب (Firestore کالز وغیرہ) ہمیشہ کی طرح براہ راست نیٹ ورک پر ہی رہیں ---------- -->
  const CACHEABLE_CROSS_ORIGIN_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
  if (url.origin !== self.location.origin) {
    if (CACHEABLE_CROSS_ORIGIN_HOSTS.includes(url.hostname)) {
      event.respondWith(
        caches.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            return res;
          }).catch(() => cached);
        })
      );
    }
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
