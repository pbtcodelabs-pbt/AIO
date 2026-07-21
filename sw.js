// ---------- AIO POS & ERP — Service Worker ----------
// یہ فائل پہلے موجود تھی مگر ڈیلیٹ ہو چکی تھی اور کوئی کاپی نہیں ملی، اس لیے دوبارہ نئے سرے سے بنائی گئی ہے۔
// ہر نئی ریلیز کے ساتھ CACHE_VERSION کو بڑھایا جائے (مثلاً v206 → v207) تاکہ پرانا cache خودکار صاف ہو جائے۔
// نوٹ: یہاں جان بوجھ کر "Network First" حکمتِ عملی استعمال کی گئی ہے — یعنی جب تک انٹرنیٹ چل رہا ہو،
// ہمیشہ تازہ ترین فائل ہی سرور سے لائی جائے گی (پرانی cached فائل کبھی خاموشی سے نہیں دکھائی جائے گی)۔
// صرف اس صورت میں cache استعمال ہوگا جب ڈیوائس واقعی آف لائن ہو — یہی وہ چیز ہے جو "پرانی فائل اٹکی رہنے"
// والے شکوک کو ہمیشہ کے لیے ختم کر دیتی ہے۔

const CACHE_VERSION = 'aio-pos-v220';
const CACHE_NAME = `aio-pos-cache-${CACHE_VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ---------- ایپ کا اپنا اپڈیٹ-ٹوسٹ بٹن اسی میسج کے ذریعے نئے ورژن کو فوراً فعال کرتا ہے ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
