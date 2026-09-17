const CACHE_NAME = 'AIODR18SEPFR1231AM';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

// ---------- ⚠️ اہم درستگی: پہلے cache.addAll() استعمال ہوتا تھا — اس کا اصول یہ ہے کہ اگر ایک بھی فائل
// (مثلاً کوئی آئیکن) نیٹ ورک کی معمولی رکاوٹ سے لوڈ نہ ہو سکے، تو پوری کیشنگ ناکام ہو جاتی ہے۔
// پہلے اس ناکامی کو .catch(()=>{}) سے خاموشی سے چھپا دیا جاتا تھا اور skipWaiting() پھر بھی چل جاتا تھا —
// نتیجہ: ایپ "کامیابی سے انسٹال" ظاہر ہوتی مگر کیشے اندر سے خالی رہ جاتا، اور آف لائن کچھ کام نہ کرتا۔
// اب ہر فائل الگ الگ، آزادانہ طور پر کیش ہوتی ہے — ایک فائل ناکام ہو بھی جائے تو باقی سب محفوظ ہو جاتی ہیں ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        CORE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => console.warn('Cache failed for', asset, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

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
        // ---------- آف لائن: پہلے اسی درخواست کی exact کیش شدہ فائل تلاش کریں —
        // اگر نہ ملے اور یہ صفحہ کھولنے کی درخواست (navigation) ہو، تبھی index.html واپس دیں۔
        // ورنہ (جیسے کوئی ناکام ہونے والی script/font فائل) خالی/ناکام رہنے دیں —
        // ورنہ غلطی سے HTML کسی JS فائل کی جگہ مل کر ایپ الجھا سکتی ہے ----------
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return new Response('', {status: 504, statusText: 'Offline'});
        })
      )
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
