// ---------- AIO POS & ERP — Service Worker ----------
// ہر ریلیز پر CACHE_VERSION بڑھائی جاتی ہے تاکہ فون پرانی کاپی کی بجائے نئی فائل لوڈ کرے
const CACHE_VERSION = 'aio-v008';
const APP_SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {}) // ---------- کوئی فائل نہ ملے تو انسٹال ناکام نہ ہو ----------
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ---------- نیٹ ورک-فرسٹ: انٹرنیٹ ہو تو ہمیشہ تازہ فائل لائیں، آف لائن ہونے پر کیش سے دکھائیں ----------
self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
