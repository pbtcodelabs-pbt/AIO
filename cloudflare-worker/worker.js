// AIO / FFPOS / GG Khatabook — Google Play purchase verify (subscriptions + one-time lifetime)
// خفیہ چابی (SERVICE_ACCOUNT_JSON) کوڈ میں نہیں، Cloudflare کی Settings → Variables and Secrets میں ہے۔
var DEFAULT_PACKAGE = "com.pbtcodelabs.aiopos";

// سبسکرپشنز (ہر مدت والی)
var APPS = {
  "com.pbtcodelabs.aiopos": ["aio_user1plus0_3m", "aio_user1plus0_6m", "aio_user1plus0_12m",
    // ملازم والے پیکج (مالک + 1/2/3 ملازم) — ہر فون 500 روپے مہینہ؛ صرف 6 مہینے اور سال
    "aio_user1plus1_6m", "aio_user1plus1_12m", "aio_user1plus2_6m", "aio_user1plus2_12m", "aio_user1plus3_6m", "aio_user1plus3_12m"],
  "com.pbtcodelabs.ffpos": ["ffpos_monthly", "ffpos_quarterly", "ffpos_halfyearly", "ffpos_yearly", "ffpos_premium"],
  "com.pbtcodelabs.dgkhata": ["dg_khata_1m", "dg_khata_12m"],
  "com.pbtcodelabs.ggkhatabook": ["gg_khatabook_1m", "gg_khatabook_12m"]
};

// ایک بار کی خریداری (لائف ٹائم) — کبھی ختم نہیں
var ONETIME = {
  "com.pbtcodelabs.aiopos": ["aio_lifetime_onetime"]
};
var LIFETIME_EXPIRY = "2099-12-31";

/* MCS0411WE147 (مالک کا حکم): My City Shines — ہر ممبرشپ (کاروبار / پروفیشن) کی ایک سال کی سبسکرپشن؛ 5 ہی پیکج دونوں کے لیے
   (ایک گوگل اکاؤنٹ پر ایک وقت میں ایک پیکج ایک ہی بار — اس لیے ایپ پہلا خالی پیکج چنتی ہے)؛ خریداری کا ٹوکن جس ممبرشپ (rec) سے جڑا، ہمیشہ اسی کی مدت بڑھاتا ہے */
var MCS_PKG = "com.pbtcodelabs.mycityshines";
var MCS_SKUS = ["mcs_mem_default", "mcs_mem_1", "mcs_mem_2", "mcs_mem_3", "mcs_mem_4"];

/* MCS1511SU427 (مالک کا حکم، 15 نومبر): My City Shines کا نیا سبسکرپشن نظام — زیرو سے آغاز
   • کوئی کاروبار مفت نہیں — نہ 15 دن، نہ منظوری پر مفت دن۔ کاروبار صرف ادائیگی (Google Play، اصلی GPA آرڈر نمبر) سے رجسٹرڈ / فعال ہوتا ہے۔
   • ٹیسٹ خریداری (License Tester) قبول نہیں۔ MCS1611MO471: 90 دن / ٹرائل / ایک بار والی ممبرشپ ختم — صرف سالانہ سبسکرپشن۔
   • MCS1511SU429: ایڈمن 1 (ADMIN1) اور ایڈمن 2 (ADMIN2) کے کاروبار بھی مفت نہیں — سب ادائیگی سے۔ DEV / CODEV نام ختم۔
   • MCS1511SU431: ایڈمن 1 (03206793793) کی ID MCS008 سے ہٹ کر MCS001 — ایڈمن 2 کی MCS002؛ جو ان IDs پر تھا وہ ایڈمن کی پرانی ID لیتا ہے (ادلا بدلی، سرور خود، ایک بار)
   اختیاری ماحول کی چابیاں (Cloudflare ← Settings ← Variables): ALLOW_TEST="1" ٹیسٹ خریداری بھی مانو (صرف جانچ کے لیے)؛ ALLOW_PROMO="0" ریڈیم کوڈ بند؛ GPA_STRICT="1" پرانی سختی (گاہک کا لکھا آرڈر نمبر گوگل سے نہ ملے تو انکار) — عام طور پر ضرورت نہیں: آرڈر نمبر سرور خود گوگل سے لیتا ہے */
var ADMIN_FREE_MOBILES = [];   /* مثال: ["923001234567", "923331234567"] — ان دو ایڈمن موبائل نمبروں کو MCS-001 / MCS-002 (اگر خالی ہوں) اور مفت کاروبار ملتا ہے */
/* MCS1511SU428 (مالک کا حکم): دو ایڈمن کے لیے پکی (محفوظ) MCS ID — ایڈمن 1 (ڈویلپر) = MCS-001، ایڈمن 2 = MCS-002۔
   ان دو موبائل نمبروں پر نیا کاروبار رجسٹر ہوتے ہی یہی ID ملتی ہے (اور ہر ایک کی پہلی ممبرشپ MCS-001-01 / MCS-002-01)۔ کوئی دوسرا موبائل یہ دونوں ID کبھی نہیں لے سکتا؛
   باقی سب 003 سے آگے۔ پہلے سے رجسٹرڈ تین کاروبار (حبیب شہباز، غوثیہ نان شاپ، آصف) خود بخود 003، 004، 005 بن جاتے ہیں (ان کی -01 ساتھ رہتی ہے)۔ */
var ADMIN_SLOTS = { "MCS001": "923206793793", "MCS002": "923138469706" };   /* MCS1511SU429 (مالک کا حکم): ID میں ڈیش بالکل نہیں — MCS001، ممبرشپ MCS001M1، ایجنٹ AG001 */
var ADMIN_AG = { "923206793793": "AG001", "923138469706": "AG002" };   /* MCS1511SU430 (مالک کا حکم): ایڈمن 1 = AG001، ایڈمن 2 = AG002 (ایجنٹ بنتے ہی یہی کوڈ؛ باقی ایجنٹ AG003 سے آگے) */
var ADMIN_FREE_MS = 3650 * 864e5;   /* ایڈمن کے اپنے کاروبار — 10 سال (خود بڑھتا رہتا ہے) */
var FS_PROJECT = "my-city-shines";

// ---------- 🔔 نئی خریداری پر مالک کے فون پر پیغام (ntfy ایپ) ----------
// مالک فون میں «ntfy» ایپ میں یہی topic سبسکرائب کرے۔ صرف پہلی تصدیق (acknowledge) پر پیغام، تجدید پر نہیں۔
var NTFY_TOPIC = "aio-sales-7bg2fo5j6vist8funtq7jk";
var APP_NAMES = {
  "com.pbtcodelabs.aiopos": "AIO POS",
  "com.pbtcodelabs.ffpos": "FFPOS",
  "com.pbtcodelabs.dgkhata": "DG Khata",
  "com.pbtcodelabs.ggkhatabook": "GG Khatabook",
  "com.pbtcodelabs.mycityshines": "My City Shines"
};

function planName(sku) {
  if (/lifetime/i.test(sku)) return "لائف ٹائم (ایک بار)";
  const m = String(sku).match(/_(\d+)m$/);
  const st = String(sku).match(/plus([1-9])_/);
  const staff = st ? " — مالک + " + st[1] + " ملازم" : "";
  if (m) return (Number(m[1]) === 12 ? "1 سال" : m[1] + " مہینے") + staff;
  if (/halfyearly/i.test(sku)) return "6 مہینے";
  if (/yearly/i.test(sku)) return "1 سال";
  if (/quarterly/i.test(sku)) return "3 مہینے";
  if (/monthly/i.test(sku)) return "1 مہینہ";
  return sku;
}

function countryName(code) {
  if (!code) return "معلوم نہیں";
  try {
    const n = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
    return n && n !== code ? n + " (" + code + ")" : code;
  } catch (e) {
    return code;
  }
}

function notifySale(ctx, info) {
  const lines = [
    "📱 ایپ: " + (APP_NAMES[info.pkg] || info.pkg),
    "📦 پیکج: " + planName(info.sku) + " — " + info.sku,
    "🌍 ملک: " + countryName(info.country),
    "💰 قیمت: " + (info.price || "معلوم نہیں")
  ];
  if (info.trial) lines.push("🎁 مفت آزمائش سے شروع");
  if (info.test) lines.push("🧪 یہ ٹیسٹ خریداری ہے (اصل پیسے نہیں)");
  const p = fetch("https://ntfy.sh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: NTFY_TOPIC,
      title: "🎉 نئی سبسکرپشن — " + (APP_NAMES[info.pkg] || info.pkg),
      message: lines.join("\n"),
      tags: ["tada"],
      priority: 4
    })
  }).catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(p);
  return p;
}

function fmtPrice(micros, cur) {
  const n = Number(micros);
  if (!cur || isNaN(n)) return "";
  return (n / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + cur;
}

// پرانا (v1) سبسکرپشن جواب — اس میں قیمت، کرنسی اور ملک ہوتا ہے
async function subPriceInfo(base, accessToken, sku, token) {
  try {
    const r = await fetch(base + "/purchases/subscriptions/" + encodeURIComponent(sku) + "/tokens/" + encodeURIComponent(token), {
      headers: { Authorization: "Bearer " + accessToken }
    });
    if (!r.ok) return {};
    const v = await r.json();
    return {
      price: fmtPrice(v.priceAmountMicros, v.priceCurrencyCode),
      country: v.countryCode || "",
      test: v.purchaseType === 0,
      promo: v.purchaseType === 1,   /* پروموشن / ریڈیم کوڈ */
      micros: v.priceAmountMicros != null ? Number(v.priceAmountMicros) : null,
      trial: v.paymentState === 2
    };
  } catch (e) {
    return {};
  }
}

var ACCESS_STATES = [
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_CANCELED",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
];

var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function reply(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS }
  });
}

function b64url(bytesOrString) {
  const bin = typeof bytesOrString === "string" ? bytesOrString : String.fromCharCode(...new Uint8Array(bytesOrString));
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAccessToken(env, scope) {
  const sa = JSON.parse(env.SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: scope || "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  }));
  const unsigned = header + "." + claim;
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + unsigned + "." + b64url(sig)
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("token_failed");
  return data.access_token;
}

// ---------- ♾️ لائف ٹائم (one-time product) کی تصدیق اور منظوری ----------
// purchaseState: 0 = خریدا گیا، 1 = منسوخ/واپس، 2 = ادائیگی زیرِ التوا
async function verifyOneTime(base, accessToken, sku, token, ctx, pkg) {
  const url = base + "/purchases/products/" + encodeURIComponent(sku) + "/tokens/" + encodeURIComponent(token);
  const res = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
  if (!res.ok) return reply({ access: false, error: "google_" + res.status, productId: sku });
  const d = await res.json();
  const purchased = d.purchaseState === 0;
  let acknowledged = d.acknowledgementState === 1;
  if (purchased && !acknowledged) {
    try {
      const ackRes = await fetch(url + ":acknowledge", {
        method: "POST",
        headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
        body: "{}"
      });
      acknowledged = ackRes.ok;
      if (ackRes.ok) {
        notifySale(ctx, { pkg, sku, country: d.regionCode || "", price: "", test: d.purchaseType === 0 });
      }
    } catch (e) {
      acknowledged = false;
    }
  }
  const startMs = Number(d.purchaseTimeMillis || 0);
  return reply({
    access: purchased,
    state: purchased ? "PURCHASED" : (d.purchaseState === 2 ? "PENDING" : "CANCELED"),
    productId: sku,
    acknowledged,
    lifetime: true,
    expiry: purchased ? LIFETIME_EXPIRY : "",
    start: startMs ? new Date(startMs).toISOString().slice(0, 10) : "",
    autoRenew: false,
    trial: false
  });
}

// ---------- MCS: دکان کے بورڈ کی تصویر سے نام اور موبائل نمبر (Cloudflare Workers AI) ----------
// فون میں Tesseract اردو بورڈ (نستعلیق، رنگین پس منظر) ٹھیک نہیں پڑھتا، اس لیے تصویر یہاں AI ماڈل پڑھتا ہے۔
var OCR_MODELS = ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
var OCR_PROMPT =
  "This is a photo of a shop signboard in Pakistan (Urdu and/or English). Read it carefully and reply with ONLY a JSON object, no other text:\n" +
  '{"name_ur":"shop name exactly as written in Urdu script, or empty","name_en":"shop name in English letters if written on the board, or empty","phones":["every mobile number on the board in the form 03xx-xxxxxxx"],"owner":"owner/proprietor name if written, or empty","address":"address/road/area if written, or empty"}\n' +
  "Rules: the shop name is usually the biggest text. Do not invent anything that is not visible. Digits must be exactly as on the board.";

function ocrParse(text) {
  const t = String(text || "");
  const m = t.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}

/* MCS: وزٹنگ کارڈ — الگ ہدایت: نام، تعارف کی لائن، ہر نمبر کے ساتھ نام، پتہ */
const CARD_PROMPT = `This photo shows a Pakistani business VISITING CARD (mostly Urdu Nastaliq, maybe some English). It may be rotated or photographed at an angle — read it carefully in any orientation.
Return ONLY one JSON object, no other text:
{"name_ur":"business name in Urdu exactly as printed (usually the biggest text, keep words like اینڈ)","name_en":"business name in English letters only if printed, else empty","tagline":"the services / description sentence printed on the card, copied word for word in Urdu","contacts":[{"name":"person name printed next to the number (Urdu), or empty","phone":"number exactly as printed, e.g. 0320-6378201"}],"address":"address line exactly as printed"}
Rules: copy every digit exactly — never guess or invent digits; Pakistani mobile numbers have 11 digits starting with 03. Include every phone number on the card. Use empty strings for anything you cannot read.`;

async function handleOcr(request, env) {
  if (!env.AI) return reply({ error: "ai_not_configured" }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return reply({ error: "bad_json" }, 400); }
  const img = body && body.image;
  if (typeof img !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(img) || img.length > 2500000) {
    return reply({ error: "bad_image" }, 400);
  }
  /* وزٹنگ کارڈ: دونوں ماڈل ایک ساتھ، جواب ملا کر — نمبر 11 ہندسے (03…)، جتنے ماڈل متفق اتنے ووٹ */
  if (body.mode === "card" && !body.model) {
    const runs = await Promise.allSettled(OCR_MODELS.map(async (model) => {
      const out = await env.AI.run(model, { messages: [{ role: "user", content: [{ type: "text", text: CARD_PROMPT }, { type: "image_url", image_url: { url: img } }] }], max_tokens: 700, temperature: 0 });
      const raw = out && (out.response !== undefined ? out.response : out);
      return { model, data: typeof raw === "object" && raw ? raw : ocrParse(raw) };
    }));
    const ok = runs.filter((r) => r.status === "fulfilled" && r.value.data).map((r) => r.value);
    if (!ok.length) return reply({ ok: false, error: "no_model" }, 502);
    const digits = (v) => String(v || "").replace(/[^0-9]/g, "");
    const fmt = (d) => d.slice(0, 4) + "-" + d.slice(4);
    const contacts = new Map();
    ok.forEach(({ data }) => {
      const list = Array.isArray(data.contacts) ? data.contacts : (Array.isArray(data.phones) ? data.phones.map((p) => ({ phone: p })) : []);
      list.forEach((c) => {
        let d = digits(c && c.phone); if (d.startsWith("92") && d.length === 12) d = "0" + d.slice(2);
        if (!/^03\d{9}$/.test(d)) return;
        const e = contacts.get(d) || { phone: fmt(d), name: "", votes: 0 };
        e.votes++; if (!e.name && c.name) e.name = String(c.name).trim();
        contacts.set(d, e);
      });
    });
    const first = ok[0].data, second = ok[1] ? ok[1].data : {};
    const pick = (k) => String(first[k] || second[k] || "").trim();
    const longer = (k) => { const a = String(first[k] || "").trim(), b = String(second[k] || "").trim(); return a.length >= b.length ? a : b; };
    const nameA = String(first.name_ur || "").trim(), nameB = String(second.name_ur || "").trim();
    return reply({ ok: true, merged: true, models: ok.map((x) => x.model), data: {
      name_ur: nameA || nameB, name_alt: nameA && nameB && nameA !== nameB ? nameB : "", name_en: pick("name_en"),
      tagline: longer("tagline"), address: longer("address"),
      contacts: [...contacts.values()].sort((a, b) => b.votes - a.votes)
    } });
  }
  let lastErr = "";
  // جانچ کے لیے کسی ایک ماڈل کو چننا (صرف اوپر والی فہرست میں سے)
  const only = body && OCR_MODELS.includes(body.model) ? [body.model] : OCR_MODELS;
  for (const model of only) {
    try {
      const out = await env.AI.run(model, {
        messages: [{ role: "user", content: [
          { type: "text", text: body.mode === "card" ? CARD_PROMPT : OCR_PROMPT },
          { type: "image_url", image_url: { url: img } }
        ] }],
        max_tokens: body.mode === "card" ? 700 : 400,
        temperature: 0
      });
      const raw = out && (out.response !== undefined ? out.response : out);
      const data = typeof raw === "object" && raw ? raw : ocrParse(raw);
      if (data) return reply({ ok: true, model, data });
      lastErr = "unparsed: " + String(raw).slice(0, 200);
    } catch (e) {
      lastErr = String(e && e.message || e).slice(0, 300);
    }
  }
  return reply({ ok: false, error: lastErr }, 502);
}


// ---------- MCS: ہوم صفحے کے ریٹ — ڈالر (PKR) اور سونا (عالمی ریٹ سے فی تولہ / 10 گرام) — 30 منٹ کیش ----------
/* MCS: پٹرول کا ریٹ — کئی ویب سائٹس سے پڑھ کر جو ریٹ زیادہ جگہ ملے وہی (غلط ہندسے سے بچاؤ) */
const PETROL_SOURCES = [
  "https://www.psopk.com/en/product-and-services/product-prices/pol",
  "https://www.pakwheels.com/petroleum-prices-in-pakistan",
  "https://hamariweb.com/finance/petrol_price/",
  "https://www.urdupoint.com/business/petrol-prices-in-pakistan.html",
  "https://propakistani.pk/petrol-price-in-pakistan/",
];
function petrolFromHtml(html) {
  const t = String(html || "").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ");
  const rx = /(petrol|motor\s*spirit|motor\s*gasoline|super\s*petrol|premier|پٹرول|پیٹرول)[^0-9]{0,90}?(?:rs\.?|pkr|روپے)?\s*([2-4]\d{2}(?:\.\d{1,2})?)(?![\d])/gi;
  const found = []; let m;
  while ((m = rx.exec(t)) && found.length < 12) { const v = parseFloat(m[2]); if (v >= 200 && v <= 480) found.push(v); }
  return found;
}
async function fetchPetrol() {
  const per = {}, votes = {};
  await Promise.all(PETROL_SOURCES.map(async (u) => {
    try {
      const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36", "Accept": "text/html" }, cf: { cacheTtl: 3600 } });
      if (!r.ok) { per[u] = "HTTP " + r.status; return; }
      const vals = petrolFromHtml(await r.text());
      per[u] = vals.slice(0, 4);
      if (vals.length) { const v = vals[0].toFixed(2); votes[v] = (votes[v] || 0) + 1; }
    } catch (e) { per[u] = String(e.message || e).slice(0, 80); }
  }));
  const best = Object.entries(votes).sort((a, b) => b[1] - a[1] || parseFloat(b[0]) - parseFloat(a[0]))[0];
  return { petrol: best ? parseFloat(best[0]) : null, votes: best ? best[1] : 0, per };
}

async function handleRates(ctx, debug) {
  const cache = caches.default;
  const key = new Request("https://aio-pos-verify/rates-cache-v2");
  const hit = debug ? null : await cache.match(key);
  if (hit) { const h = new Response(hit.body, hit); Object.entries(CORS).forEach(([k, v]) => h.headers.set(k, v)); return h; }
  const out = { ts: Date.now() };
  const j = async (u) => { const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 MCS" } }); if (!r.ok) throw new Error(u + " " + r.status); return r.json(); };
  try { const d = await j("https://open.er-api.com/v6/latest/USD"); out.usdPkr = d && d.rates && d.rates.PKR; } catch (e) { out.usdErr = String(e.message || e).slice(0, 120); }
  try {
    const d = await j("https://data-asg.goldprice.org/dbXRates/PKR");
    const it = d && d.items && d.items[0]; if (it && it.xauPrice) out.xauPkrOz = it.xauPrice;
  } catch (e) { out.goldErr1 = String(e.message || e).slice(0, 120); }
  if (!out.xauPkrOz) {
    try { const d = await j("https://api.gold-api.com/price/XAU"); if (d && d.price && out.usdPkr) out.xauPkrOz = d.price * out.usdPkr; } catch (e) { out.goldErr2 = String(e.message || e).slice(0, 120); }
  }
  if (out.xauPkrOz) { const perG = out.xauPkrOz / 31.1034768; out.gold10g = Math.round(perG * 10); out.goldTola = Math.round(perG * 11.6638); }
  try { const p = await fetchPetrol(); if (p.petrol) { out.petrol = p.petrol; out.petrolVotes = p.votes; } if (debug || !p.petrol) out.petrolSrc = p.per; } catch (e) { out.petrolErr = String(e.message || e).slice(0, 120); }
  const res = new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json", "Cache-Control": "max-age=1800", ...CORS } });
  if (out.usdPkr || out.goldTola) ctx && ctx.waitUntil ? ctx.waitUntil(cache.put(key, res.clone())) : await cache.put(key, res.clone());
  return res;
}

/* ===== MCS: کالوں / واٹس ایپ / میسج کی گنتی — Durable Object (SQLite)، ہر دن ہر دکان (فون نمبر) کی گنتی ===== */
const STAT_KINDS = ["call", "wa", "sms", "share", "open", "ad", "view"];   /* view = پروفائل دیکھی گئی */
/* MCS0511TH142 (مالک کا حکم): ایجنٹ کا ریفرل کوڈ = کاروبار کی قسم کے دو حروف + ترتیب وار نمبر (MS-001) — ہر قسم کا الگ، کبھی دوہرا نہیں */
const AG_ABBR = { medicalStore: "MS", homeopathic: "HM", testingLab: "TL", plumberElectrician: "PE", tuitionTeacher: "TT", groceryStore: "GS", clothesShop: "CS", mobileElectronics: "ME", hardwareStore: "HW", bakery: "BK", jewelryShop: "JS", furnitureShop: "FS", autoParts: "AP", beautyParlor: "BP", restaurant: "RS", otherShop: "OS", doctor: "DR", emergencyNumbers: "EN", govOffices: "GO", mcsAgent: "AG" };   /* MCS0911MO262: «MCS Agent» کیٹگری (صرف ایجنٹ) = AG-001 */
function agCatTag(c) { let h = 0; for (let i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) >>> 0; return h.toString(36).slice(0, 7); }   /* ایپ کے pfCatTag جیسا */
const AG_TAG = Object.fromEntries(Object.keys(AG_ABBR).map((k) => [agCatTag(k), AG_ABBR[k]]));
/* MCS1111WE329 (مالک کا حکم): ڈویلپر / کو-ڈویلپر کے کوڈ DEV / CODEV (پرانے PBT-D / PBT-C بھی مانے جاتے ہیں) */
function refNorm(v) { const t = String(v || "").toUpperCase().trim(), c = t.replace(/[\s_-]+/g, ""); return (c === "PBTD" || c === "DEV" || c === "ADMIN1") ? "ADMIN1" : (c === "PBTC" || c === "CODEV" || c === "ADMIN2") ? "ADMIN2" : t; }   /* MCS1511SU429 (مالک کا حکم): DEV / CODEV ختم — اب ADMIN1 / ADMIN2 (پرانا لکھا بھی مانا جاتا ہے) */
function agAbbrOfRk(rk) { return AG_TAG[String(rk || "").split("_")[1] || ""] || "BZ"; }   /* نئی (ایڈمن کی بنائی) قسم = BZ */
function agNormRef(v) { const t = String(v || "").trim().toUpperCase().replace(/\s+/g, ""); const m = /^([A-Z]{2})[-.]?0*(\d{1,5})$/.exec(t); return m ? m[1] + m[2].padStart(3, "0") : String(v || "").trim(); }   /* MCS1511SU429: ڈیش کے بغیر AG001 */
export class McsStats {
  constructor(state) {
    this.sql = state.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS hits (day TEXT, rec TEXT, kind TEXT, n INTEGER, PRIMARY KEY (day, rec, kind))");
    this.sql.exec("CREATE TABLE IF NOT EXISTS vtok (rec TEXT PRIMARY KEY, tok TEXT, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS verified (rec TEXT PRIMARY KEY, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS edits (id INTEGER PRIMARY KEY AUTOINCREMENT, rec TEXT, ts INTEGER, body TEXT, done INTEGER DEFAULT 0)");
    /* MCS پروفائل: دکاندار کا اپنا صفحہ (تصویریں، تفصیل، ریٹ، اوقات، نقشہ) — مالک فون کی خفیہ چابی سے */
    this.sql.exec("CREATE TABLE IF NOT EXISTS prof (rec TEXT PRIMARY KEY, data TEXT, key TEXT, since INTEGER, until INTEGER, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS pimg (id TEXT PRIMARY KEY, rec TEXT, data TEXT, ts INTEGER)");
    /* 🔑 اکاؤنٹ سبسکرپشن (AIO وغیرہ، پلے اسٹور سے باہر خریدی): ریکارڈ + جی میل / موبائل کی چابیاں */
    this.sql.exec("CREATE TABLE IF NOT EXISTS ent (id TEXT PRIMARY KEY, app TEXT, data TEXT, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS entkey (k TEXT PRIMARY KEY, id TEXT)");
    /* 📦 HD1711: ایکٹیویشن پیکج ٹیبل — ہر پیکج کا نام (کوڈ کا شروع)، مدت، کل فون؛ ہیلپ ڈیسک سے بدلا جا سکتا ہے */
    this.sql.exec("CREATE TABLE IF NOT EXISTS entpkg (k TEXT PRIMARY KEY, app TEXT, data TEXT, ts INTEGER)");
    /* 🤝 MCS کمیشن ایجنٹ (MCS0411WE131): درخواست + شناختی کارڈ / سیلفی کی تصویریں — صرف ایڈمن پڑھے */
    this.sql.exec("CREATE TABLE IF NOT EXISTS agent (id TEXT PRIMARY KEY, phone TEXT, data TEXT, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS agimg (id TEXT, kind TEXT, data TEXT, PRIMARY KEY (id, kind))");
    /* MCS0511TH134: ایجنٹ پورٹل — ریفرل رجسٹر، کمیشن کا کھاتہ (ادائیگیاں)، ادائیگی کے ثبوت، چیٹ، ترتیب؛ پروفائل کے خریدے سال (prof.paid) */
    this.sql.exec("CREATE TABLE IF NOT EXISTS agref (rk TEXT PRIMARY KEY, code TEXT, data TEXT, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS agpay (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, amount INTEGER, note TEXT, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS agproof (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, rk TEXT, note TEXT, img TEXT, done INTEGER DEFAULT 0, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS agmsg (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, who TEXT, text TEXT, img TEXT, audio TEXT, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS agcfg (k TEXT PRIMARY KEY, v TEXT)");
    /* MCS0511TH158 (مالک کا حکم): ہر فروخت کا کھاتہ — 1000 = گوگل 150 (اصل، فرق مینٹیننس سے) + مینٹیننس 150 + لانے والا 170 + ڈویلپر 265 + کو-ڈویلپر 265 */
    this.sql.exec("CREATE TABLE IF NOT EXISTS sale (id INTEGER PRIMARY KEY AUTOINCREMENT, rec TEXT, ts INTEGER, src TEXT, units INTEGER, mon TEXT)");
    try { this.sql.exec("ALTER TABLE sale ADD COLUMN who TEXT"); } catch (e) {}   /* AGP0511TH011: فروخت کے وقت کا «لانے والا» محفوظ — بعد میں ایجنٹ ہٹے تو پرانا حساب نہ بدلے */
    this.sql.exec("CREATE TABLE IF NOT EXISTS agcnic (cnic TEXT PRIMARY KEY, code TEXT, id TEXT, ts INTEGER)");   /* MCS0511TH145: ایک شناختی کارڈ = ایک ایجنٹ = ایک کوڈ، ہمیشہ کے لیے (حذف کے بعد بھی) */
    /* AGP0911MO015 (مالک کا حکم): PBT پورٹل — لاگ اِن صرف 6 ہندسوں کا PIN؛ PIN بھولنے پر پیدائش کا سال (ایک بار محفوظ)؛ ڈویلپر کا PIN سیشن */
    /* AGP0911MO018 (مالک کی منظوری): MCS کا حساب — دستی وصولی (اشتہار / ممبرشپ)، ادائیگی کے اکاؤنٹ، ادائیگی کی درخواست */
    this.sql.exec("CREATE TABLE IF NOT EXISTS finx (id INTEGER PRIMARY KEY AUTOINCREMENT, mon TEXT, ts INTEGER, kind TEXT, amount INTEGER, rk TEXT, who TEXT, note TEXT)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS payacct (who TEXT PRIMARY KEY, data TEXT, ts INTEGER)");
    /* AGP1011TU025 (مالک کا حکم): غلط / جانچ والی فروخت یا وصولی «ہٹائیں» — کبھی مٹتی نہیں، صرف void (حساب سے باہر)، «واپس لائیں» سے واپس، آڈٹ لاگ میں */
    for (const t of ["sale", "finx"]) for (const c of ["void INTEGER DEFAULT 0", "vwhy TEXT", "vts INTEGER"]) { try { this.sql.exec("ALTER TABLE " + t + " ADD COLUMN " + c); } catch (e) {} }
    /* AGP0911MO019: ایجنٹ کی اطلاعات (سرور کے اصل واقعات سے) + حساب کا آڈٹ لاگ */
    this.sql.exec("CREATE TABLE IF NOT EXISTS agnote (id INTEGER PRIMARY KEY AUTOINCREMENT, who TEXT, kind TEXT, text TEXT, ts INTEGER, rd INTEGER DEFAULT 0)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS finlog (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, op TEXT, data TEXT)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS payreq (id INTEGER PRIMARY KEY AUTOINCREMENT, who TEXT, amount INTEGER, ts INTEGER, done INTEGER DEFAULT 0)");
    for (const c of ["method TEXT", "acct TEXT", "img TEXT"]) { try { this.sql.exec("ALTER TABLE agpay ADD COLUMN " + c); } catch (e) {} }
    this.sql.exec("CREATE TABLE IF NOT EXISTS ppyob (role TEXT, id TEXT, yob TEXT, PRIMARY KEY (role, id))");
    this.sql.exec("CREATE TABLE IF NOT EXISTS ppsess (tok TEXT PRIMARY KEY, exp INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS ppfail (k TEXT, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS codev (phone TEXT PRIMARY KEY, name TEXT, pin TEXT, ts INTEGER, seen INTEGER)");
    for (const c of ["perms TEXT", "off INTEGER", "offts INTEGER", "offp TEXT"]) { try { this.sql.exec("ALTER TABLE codev ADD COLUMN " + c); } catch (e) {} }   /* MCS1511SU458 (مالک کا حکم): ایڈمن کی اجازتیں + ہٹانا / بحال */   /* MCS0511TH136: کو-ڈویلپر (صرف جانچ موڈ — کچھ محفوظ / منظور نہیں) */
    if (!this.sql.exec("SELECT v FROM agcfg WHERE k = 'cdseed'").toArray().length) { this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('cdseed', '1')"); this.sql.exec("INSERT OR IGNORE INTO codev (phone, name, pin, ts, seen) VALUES ('923138469706', 'محمد عمران', ?, ?, 0)", String(100000 + Math.floor(Math.random() * 900000)), Date.now()); }   /* مالک نے دیا (4 نومبر) — PIN صرف ایڈمن پینل میں */
    this.sql.exec("CREATE TABLE IF NOT EXISTS pendop (id INTEGER PRIMARY KEY AUTOINCREMENT, by TEXT, op TEXT, data TEXT, ts INTEGER, st TEXT DEFAULT 'p', dts INTEGER, dnote TEXT)");   /* MCS1511SU459 (مالک کا حکم): maker-checker — ایڈمن 2 تجویز کرے، آخری منظوری صرف ایڈمن 1 */
    try { this.sql.exec("ALTER TABLE prof ADD COLUMN paid INTEGER DEFAULT 0"); } catch (e) {}
    try { this.sql.exec("ALTER TABLE prof ADD COLUMN pend INTEGER DEFAULT 0"); } catch (e) {}   /* MCS0511TH157: دکاندار نے خود بنائی — ایڈمن کی منظوری پر 15 دن */
    /* MCS0511TH161 (مالک کا حکم، ہیلپ ڈیسک #95): ایپ کا لاگ اِن — اکاؤنٹ (موبائل ایک ہی بار)، چابیاں m:/e:/g:/a:، سیشن (ٹوکن کا SHA-256)، غلط پاس ورڈ کی حد */
    this.sql.exec("CREATE TABLE IF NOT EXISTS mcsuser (id TEXT PRIMARY KEY, data TEXT, pwh TEXT, ts INTEGER, seen INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS mcsukey (k TEXT PRIMARY KEY, id TEXT)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS mcssess (tok TEXT PRIMARY KEY, id TEXT, via TEXT, ts INTEGER, last INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS actcode (code TEXT PRIMARY KEY, data TEXT, ts INTEGER, used INTEGER DEFAULT 0, uid TEXT)");   /* MCS1211TH334: منظوری کے بعد ایکٹیویشن کوڈ XXXX-XXXX */
    this.sql.exec("CREATE TABLE IF NOT EXISTS mcsfail (k TEXT PRIMARY KEY, n INTEGER, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS aioid (id TEXT PRIMARY KEY, dev TEXT, data TEXT, ts INTEGER)");   /* AIO0911MO190: ہر فون کی پکی AIO ID */
    this.sql.exec("CREATE TABLE IF NOT EXISTS aioinv (id TEXT PRIMARY KEY, data TEXT, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS mbuy (tok TEXT PRIMARY KEY, rec TEXT, sku TEXT, exp INTEGER, ts INTEGER)");
    /* MCS1111WE312 (مالک کا حکم، 11 نومبر — «System Structure & ID Flow»): ہر موبائل کی ایک سسٹم ID ترتیب سے MCS-001، MCS-002…؛
       ہر ممبرشپ (سبسکرپشن / تجدید) پر MCS-001-01، -02…؛ ایجنٹ AG-001، AG-002… */
    this.sql.exec("CREATE TABLE IF NOT EXISTS mcssid (mob TEXT PRIMARY KEY, sid TEXT UNIQUE, subn INTEGER DEFAULT 0, ts INTEGER)");
    try { this.sql.exec("ALTER TABLE sale ADD COLUMN subid TEXT"); } catch (e) {}   /* MCS0411WE147: پلے اسٹور کی ممبرشپ — ٹوکن ← ممبرشپ */
    /* MCS1511SU427: خریداری کا GPA آرڈر نمبر (ایک آرڈر ایک ہی بار) + مفت / ریڈیم کوڈ کا نشان؛ جائزے کی جدول */
    for (const c of ["gpa TEXT", "free INTEGER DEFAULT 0"]) { try { this.sql.exec("ALTER TABLE mbuy ADD COLUMN " + c); } catch (e) {} }
    this.sql.exec("CREATE TABLE IF NOT EXISTS preq (rec TEXT PRIMARY KEY, data TEXT, st TEXT, note TEXT, ts INTEGER, upd INTEGER)");
  }
  adminFree(rec) {   /* MCS1511SU429 (مالک کا حکم): ایڈمن 1 / ایڈمن 2 کے کاروبار بھی مفت نہیں — باقی سب کی طرح ادائیگی (Google Play) سے ہی چلیں گے */
    return false;
  }
  paidActive(rec) {   /* اس کاروبار کی کوئی Google Play خریداری (ادا شدہ یا ریڈیم) ابھی چل رہی ہے؟ */
    try { return !!this.sql.exec("SELECT tok FROM mbuy WHERE rec = ? AND exp > ? LIMIT 1", rec, Date.now()).toArray().length; } catch (e) { return false; }
  }
  entGet(id) { const r = this.sql.exec("SELECT data FROM ent WHERE id = ?", id).toArray()[0]; return r ? JSON.parse(r.data) : null; }
  entPut(e) { e.ts = Date.now(); this.sql.exec("INSERT INTO ent (id, app, data, ts) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data, ts = excluded.ts", e.id, e.app, JSON.stringify(e), e.ts); (e.keys || []).forEach((k) => this.sql.exec("INSERT INTO entkey (k, id) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET id = excluded.id", e.app + "|" + k, e.id)); }
  entOut(e) { const now = Date.now(); return { ok: true, id: e.id, name: e.name || "", life: !!e.life, exp: e.exp || 0, active: !e.revoked && (!!e.life || (e.exp || 0) > now), revoked: !!e.revoked, devices: e.devices || 1, used: (e.claims || []).length, keys: e.keys || [] }; }
  /* 📦 پیکج فہرست — پہلی بار خالی ہو تو AIO کے موجودہ Play پیکجوں (PLAY_BILLING_PRODUCTS) سے بھر دے؛ اس کے بعد ہیلپ ڈیسک سے بدلیں */
  entPkgList(app) {
    let rows = this.sql.exec("SELECT data FROM entpkg WHERE app = ?", app).toArray();
    if (!rows.length && app === "AIO") {
      const S = [
        ["1p0-3m", "1P0-3M", "Owner only — 3 Months", 90, 1, false, "aio_user1plus0_3m"], ["1p0-6m", "1P0-6M", "Owner only — 6 Months", 180, 1, false, "aio_user1plus0_6m"], ["1p0-12m", "1P0-12M", "Owner only — 1 Year", 365, 1, false, "aio_user1plus0_12m"],
        ["1p1-6m", "1P1-6M", "Owner + 1 staff — 6 Months", 180, 2, false, "aio_user1plus1_6m"], ["1p1-12m", "1P1-12M", "Owner + 1 staff — 1 Year", 365, 2, false, "aio_user1plus1_12m"],
        ["1p2-6m", "1P2-6M", "Owner + 2 staff — 6 Months", 180, 3, false, "aio_user1plus2_6m"], ["1p2-12m", "1P2-12M", "Owner + 2 staff — 1 Year", 365, 3, false, "aio_user1plus2_12m"],
        ["1p3-6m", "1P3-6M", "Owner + 3 staff — 6 Months", 180, 4, false, "aio_user1plus3_6m"], ["1p3-12m", "1P3-12M", "Owner + 3 staff — 1 Year", 365, 4, false, "aio_user1plus3_12m"],
        ["1d100y", "1D100Y", "1 device — Lifetime (100 years)", 0, 1, true, "aio_lifetime_onetime"],
      ];
      S.forEach((s, n) => { const d = { id: s[0], prefix: s[1], name: s[2], days: s[3], devices: s[4], life: s[5], sku: s[6], active: true, sort: n + 1 }; this.sql.exec("INSERT OR IGNORE INTO entpkg (k, app, data, ts) VALUES (?, ?, ?, ?)", app + "|" + d.id, app, JSON.stringify(d), Date.now()); });
      rows = this.sql.exec("SELECT data FROM entpkg WHERE app = ?", app).toArray();
    }
    if (!rows.length && app === "MCS") {   /* MCS1711TU499: پہلی بار — ایک سال کی رجسٹریشن */
      const d = { id: "mcs-1y", prefix: "MCS-1Y", name: "1 Year Registration", days: 365, devices: 1, life: false, sku: "", active: true, sort: 1 };
      this.sql.exec("INSERT OR IGNORE INTO entpkg (k, app, data, ts) VALUES (?, ?, ?, ?)", "MCS|" + d.id, "MCS", JSON.stringify(d), Date.now());
      rows = this.sql.exec("SELECT data FROM entpkg WHERE app = ?", app).toArray();
    }
    return rows.map((r) => JSON.parse(r.data)).sort((a, b) => (a.sort || 99) - (b.sort || 99));
  }
  agNextCode(ab) {   /* MCS0511TH142: ہر قسم کی الگ گنتی agcfg seq_XX */
    const r = this.sql.exec("SELECT v FROM agcfg WHERE k = ?", "seq_" + ab).toArray()[0]; let n = (parseInt((r || {}).v || "0", 10) || 0) + 1;
    const used = new Set(this.sql.exec("SELECT data FROM agent").toArray().map((x) => JSON.parse(x.data).code));
    while (used.has(ab + String(n).padStart(3, "0"))) n++;
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", "seq_" + ab, String(n));
    return ab + String(n).padStart(3, "0");
  }

  adminSlotOf(mob0) {   /* MCS1511SU428: یہ موبائل ایڈمن کا ہے تو اس کی پکی ID (MCS-001 / MCS-002)، ورنہ خالی */
    const mob = this.sidMob(mob0); if (!mob) return "";
    for (const k of Object.keys(ADMIN_SLOTS)) if (entPhone(ADMIN_SLOTS[k]) === mob) return k;
    return "";
  }
  adminFix431() {   /* MCS1511SU431 (مالک کا حکم): ایڈمن کا موبائل اگر MCS008 جیسی کسی اور ID پر بیٹھا ہو تو اسے اس کی پکی MCS001 / MCS002 پر لائیں؛ جو اس ID پر تھا وہ ایڈمن کی پرانی ID لے لے (ادلا بدلی — کوئی خالی خانہ نہیں)؛ ہر چیز ساتھ (لاگ اِن چابی، ممبرشپ ID)؛ دوبارہ چلے تو کچھ نہیں بدلتا */
    for (const k of Object.keys(ADMIN_SLOTS)) {
      const mob = entPhone(ADMIN_SLOTS[k]); if (!mob) continue;
      const me = this.sql.exec("SELECT sid FROM mcssid WHERE mob = ?", mob).toArray()[0];
      if (!me || me.sid === k) continue;
      const old = me.sid, hold = this.sql.exec("SELECT mob FROM mcssid WHERE sid = ?", k).toArray()[0], tmp = "ZZ" + k;
      if (hold) this.sidRen(k, tmp);
      this.sidRen(old, k);
      if (hold) this.sidRen(tmp, old);
      for (const m of [mob, hold && hold.mob]) { if (!m) continue; const sid = this.sidGet(m); if (sid) { try { this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) SELECT ?, id FROM mcsukey WHERE k = ?", "a:" + sid, "m:" + m); } catch (e) {} } }
      try { this.finLog("admfix431", { slot: k, from: old, swapped: hold ? hold.mob : "" }); } catch (e) {}
    }
  }
  sidRen(a, b) {   /* ایک سسٹم ID بدلیں: mcssid + لاگ اِن کی چابی (a:MCS-NNN) + فروخت کی سبسکرپشن ID (MCS-NNN-01) — سب ساتھ */
    this.sql.exec("UPDATE mcssid SET sid = ? WHERE sid = ?", b, a);
    this.sql.exec("UPDATE mcsukey SET k = ? WHERE k = ?", "a:" + b, "a:" + a);
    for (const r of this.sql.exec("SELECT id, subid FROM sale WHERE subid LIKE ?", a + "M%").toArray()) this.sql.exec("UPDATE sale SET subid = ? WHERE id = ?", b + String(r.subid).slice(a.length), r.id);
  }
  sidAdmin428() {   /* MCS1511SU428 (مالک کا حکم — خود سرور پر، ضرورت پر): ایڈمن کے دو موبائل = MCS-001 / MCS-002؛ پہلے سے رجسٹرڈ سب (حبیب، غوثیہ، آصف…) +2 آگے (003، 004، 005…)، ان کی -01 ساتھ؛ دوبارہ چلے تو کچھ نہیں بدلتا */
    if (this.finCfg("sidadm428", "")) return;
    const num = (x) => (/^MCS-?(\d{3})$/.exec(String(x)) || [0, 0])[1] * 1;
    const slotOf = {}; for (const k of Object.keys(ADMIN_SLOTS)) { const m = entPhone(ADMIN_SLOTS[k]); if (m) slotOf[m] = k; }
    const rows = this.sql.exec("SELECT mob, sid, subn, ts FROM mcssid").toArray();
    const adm = rows.filter((r) => slotOf[r.mob]), oth = rows.filter((r) => !slotOf[r.mob] && num(r.sid) > 0).sort((a, b) => num(a.sid) - num(b.sid));
    const shift = oth.some((r) => num(r.sid) <= 2);   /* 001 / 002 پر کوئی غیر ایڈمن بیٹھا ہے → سب کو دو آگے */
    const plan = [];   /* [mob, پرانی ID، نئی ID] — صرف وہ جن کی ID بدلتی ہے */
    for (const r of oth) { const n2 = shift ? num(r.sid) + 2 : num(r.sid); const to = "MCS" + String(n2).padStart(3, "0"); if (to !== r.sid) plan.push([r.mob, r.sid, to]); }
    for (const r of adm) if (r.sid !== slotOf[r.mob]) plan.push([r.mob, r.sid, slotOf[r.mob]]);
    const tmp = (x) => "ZZ-" + x;
    for (const q of plan) this.sidRen(q[1], tmp(q[1]));   /* پہلے سب عارضی نام (ٹکراؤ سے بچاؤ) */
    for (const q of plan) this.sidRen(tmp(q[1]), q[2]);
    const profs = this.sql.exec("SELECT rec FROM prof").toArray();
    const made = [];
    for (const k of Object.keys(ADMIN_SLOTS)) {   /* جس ایڈمن کی ID ابھی نہیں بنی، اسی وقت بنا دیں */
      const mob = entPhone(ADMIN_SLOTS[k]); if (!mob) continue;
      const ex = this.sql.exec("SELECT sid FROM mcssid WHERE mob = ?", mob).toArray()[0];
      if (!ex) { this.sql.exec("INSERT INTO mcssid (mob, sid, subn, ts) VALUES (?, ?, 0, ?)", mob, k, Date.now()); this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) SELECT ?, id FROM mcsukey WHERE k = ?", "a:" + k, "m:" + mob); made.push(k); }
      const cnt = profs.filter((x) => this.sidMob(x.rec) === mob).length;   /* ایڈمن کا کاروبار پہلے سے بنا ہو تو -01 */
      const cur = this.sql.exec("SELECT subn FROM mcssid WHERE mob = ?", mob).toArray()[0];
      if (cnt > ((cur && cur.subn) || 0)) this.sql.exec("UPDATE mcssid SET subn = ? WHERE mob = ?", cnt, mob);
    }
    let mx = 0; for (const r of this.sql.exec("SELECT sid FROM mcssid").toArray()) mx = Math.max(mx, num(r.sid));
    const sq = parseInt(this.finCfg("sidseq", "0"), 10) || 0;
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('sidseq', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", String(Math.max(sq + (shift ? 2 : 0), mx, 2)));
    this.finLog("sidadm428", { shift, moved: plan.map((q) => q[1] + ">" + q[2]), made });
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('sidadm428', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify({ at: Date.now(), shift, moved: plan.length }));
  }
  sidMob(v) { const s = String(v || ""); const m = /^p(\d{10})_/.exec(s); return m ? "92" + m[1] : entPhone(s); }   /* ممبرشپ rk (p3001234567_…) یا کوئی بھی نمبر → 92… */
  sidGet(mob) { mob = this.sidMob(mob); if (!mob) return ""; const r = this.sql.exec("SELECT sid FROM mcssid WHERE mob = ?", mob).toArray()[0]; return r ? r.sid : ""; }
  /* MCS1211TH351 (مالک کا حکم): ڈویلپر = DEV، کو-ڈویلپر = CODEV — ان کی MCS ID نہیں */
  staffSid(mob0) { const mob = this.sidMob(mob0); if (!mob) return ""; if (mob === (this.finCfg("devmob", "") || "923206793793")) return "ADMIN1";
    return mob === "923138469706" && this.sql.exec("SELECT phone FROM codev WHERE phone = ?", mob).toArray().length ? "ADMIN2" : ""; }   /* MCS1511SU458: نئے ایڈمن (بزنس مین / ایجنٹ) کی اپنی MCS ID ویسی */
  sidResetCore(L, agentFirst, now) {   /* MCS1211TH351/353: رجسٹرڈ کاروبار کو ترتیب سے MCS-001…، باقی ختم؛ ایجنٹ AG-001… */
    const old = this.sql.exec("SELECT mob, sid, subn FROM mcssid").toArray();
    this.finLog("sidreset", { old: old.length, list: L.map((x) => x.mob) });
    const keepAdm = old.filter((r) => this.adminSlotOf(r.mob) === r.sid);   /* MCS1511SU428: ایڈمن کی MCS-001 / 002 کبھی نہیں مٹتی */
    L = L.filter((x) => !this.adminSlotOf(x.mob));
    this.sql.exec("DELETE FROM mcssid");
    this.sql.exec("DELETE FROM mcsukey WHERE k GLOB 'a:MCS-[0-9][0-9][0-9]' OR k GLOB 'a:MCS[0-9][0-9][0-9]'");
    this.sql.exec("UPDATE sale SET subid = NULL");
    for (const r of keepAdm) { this.sql.exec("INSERT INTO mcssid (mob, sid, subn, ts) VALUES (?, ?, ?, ?)", r.mob, r.sid, r.subn || 0, now); this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) SELECT ?, id FROM mcsukey WHERE k = ?", "a:" + r.sid, "m:" + r.mob); }
    L.forEach((x, i) => {
      const sid = "MCS" + String(i + 3).padStart(3, "0");
      this.sql.exec("INSERT INTO mcssid (mob, sid, subn, ts) VALUES (?, ?, 1, ?)", x.mob, sid, now);
      this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) SELECT ?, id FROM mcsukey WHERE k = ?", "a:" + sid, "m:" + x.mob);
      if (x.name) this.sql.exec("INSERT INTO agcfg (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", "sidname_" + x.mob, x.name);
      const sl = this.sql.exec("SELECT id, rec FROM sale WHERE COALESCE(void, 0) = 0 ORDER BY ts").toArray().find((r) => this.sidMob(r.rec) === x.mob);
      if (sl) this.sql.exec("UPDATE sale SET subid = ? WHERE id = ?", sid + "M1", sl.id);
    });
    /* MCS1211TH352: نئے اصول (سائن اپ پر ID) کے بعد والے سائن اپ — رجسٹرڈ کے بعد ترتیب سے */
    { const at = parseInt(this.finCfg("sid352at", "0"), 10) || 0, seen = new Set(L.map((x) => x.mob)); let n = L.length + 2;
      if (at) for (const r of this.sql.exec("SELECT data, ts FROM mcsuser WHERE ts >= ? ORDER BY ts", at).toArray()) { let u = null; try { u = JSON.parse(r.data); } catch (e) {} const m = u && !u.del && entPhone(u.mobile); if (!m || seen.has(m) || this.staffSid(m)) continue; seen.add(m); n++;
        const sid = "MCS" + String(n).padStart(3, "0"); this.sql.exec("INSERT INTO mcssid (mob, sid, subn, ts) VALUES (?, ?, 0, ?)", m, sid, r.ts); this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) SELECT ?, id FROM mcsukey WHERE k = ?", "a:" + sid, "m:" + m); }
      this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('sidseq', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", String(n)); }
    const agents = this.agRenumber(agentFirst);
    return { ok: true, agents, list: L.map((x, i) => ({ mob: x.mob, name: x.name, sid: "MCS" + String(i + 3).padStart(3, "0"), subid: "MCS" + String(i + 3).padStart(3, "0") + "M1" })) };
  }
  agOff354() {   /* MCS1211TH354 (مالک کا حکم): ایجنٹ صرف حبیب شہباز (AG-001) — باقی ایجنٹ «غیر فعال» (off، مٹائے نہیں — واپس لائے جا سکتے ہیں)؛ کو-ڈویلپر کا شناختی کارڈ = CODEV */
    if (this.finCfg("agoff354", "")) return;
    const HAB = "923015079681", done = [];
    for (const r of this.sql.exec("SELECT id, data FROM agent").toArray()) { let d = {}; try { d = JSON.parse(r.data); } catch (e) { continue; }
      if (entPhone(d.phone || "") === HAB || d.off) continue;
      d.off = 1; d.offAt = Date.now(); d.offWhy = "owner: only Habib Shahbaz is an agent (MCS1211TH354)";
      this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), r.id); done.push((d.code || "") + " " + (d.name || ""));
      const cn = String(d.cnic || "").replace(/\D/g, "");
      if (cn.length === 13 && entPhone(d.phone || "") === "923138469706" && this.sql.exec("SELECT phone FROM codev WHERE phone = ?", entPhone(d.phone || "")).toArray().length) this.sql.exec("INSERT INTO agcnic (cnic, code, id, ts) VALUES (?, 'ADMIN2', 'ADMIN2', ?) ON CONFLICT (cnic) DO UPDATE SET code = 'ADMIN2', id = 'ADMIN2'", cn, Date.now());
    }
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('agoff354', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify({ at: Date.now(), off: done }));
    this.finLog("agoff354", { off: done });
  }
  sidFix353() {   /* MCS1211TH353 (مالک کا حکم — خود سرور پر، ایک بار): حبیب شہباز MCS-001، غوثیہ نان شاپ MCS-002، پنجاب سیٹنگ (آصف) MCS-003؛ حبیب شہباز ایجنٹ AG-001 */
    if (this.finCfg("sidmig353", "")) return;
    const nm = (rec) => { let n = this.finCfg("bn_" + rec, "") || ""; if (!n) { const a = this.sql.exec("SELECT data FROM agref WHERE rk = ?", rec).toArray()[0]; try { const d = JSON.parse((a && a.data) || "{}"); n = d.name || d.biz || ""; } catch (e) {} }
      if (!n) for (const x of this.sql.exec("SELECT who FROM sale WHERE rec = ?", rec).toArray()) { try { const w = JSON.parse(x.who || "{}"); if (w.biz) { n = w.biz; break; } } catch (e) {} }
      if (!n) { const p = this.sql.exec("SELECT data FROM prof WHERE rec = ?", rec).toArray()[0]; try { const d = JSON.parse((p && p.data) || "{}"); n = d.nameUr || d.name || d.biz || ""; } catch (e) {} } return String(n || ""); };
    const C = [], seen = new Set();
    for (const r of this.sql.exec("SELECT rec, MIN(ts) AS t FROM sale WHERE COALESCE(void, 0) = 0 AND COALESCE(units, 0) > 0 GROUP BY rec ORDER BY t").toArray()) { const mob = this.sidMob(r.rec); if (!mob || seen.has(mob) || this.staffSid(mob)) continue; seen.add(mob); C.push({ mob, name: nm(r.rec), t: r.t }); }
    const HAB = "923015079681";
    const slots = [ (x) => x.mob === HAB || /حبیب\s*شہباز|habib\s*shahbaz|محمدی\s*کری/i.test(x.name), (x) => /غوث|gh?ou?s|ghaus|نان|naan/i.test(x.name), (x) => /پنجاب|punjab|سیٹنگ|سٹنگ|setting|آصف|asif/i.test(x.name) ];
    const L = []; const used = new Set();
    slots.forEach((f, i) => { const c = C.find((x) => !used.has(x.mob) && f(x)); if (c) { used.add(c.mob); L[i] = c; } });
    if (!L[0]) { L[0] = { mob: HAB, name: "Habib Shahbaz" }; used.add(HAB); }
    for (let i = 1; i < 3; i++) if (!L[i]) { const c = C.find((x) => !used.has(x.mob)); if (c) { used.add(c.mob); L[i] = c; } }
    const list = L.filter(Boolean).map((x) => ({ mob: x.mob, name: x.name }));
    const r = this.sidResetCore(list, HAB, Date.now());
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('sidmig353', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify({ at: Date.now(), list: r.list.map((x) => x.sid + " " + x.name), agents: (r.agents || []).map((a) => a.code + " " + (a.name || "")), cand: C.length }));
  }
  sidFor(mob0, ts) {   /* اسی موبائل کی ID، ورنہ اگلی MCS-NNN — MCS1211TH351: صرف رجسٹرڈ (فروخت / منظوری) پر بلایا جائے، سائن اپ پر نہیں */
    const mob = this.sidMob(mob0); if (!mob) return "";
    const ex = this.sidGet(mob);
    if (ex) { const sl0 = this.adminSlotOf(mob); if (sl0 && ex !== sl0) { try { this.adminFix431(); } catch (e) {} return this.sidGet(mob) || ex; } return ex; }   /* MCS1511SU431: ایڈمن غلط ID پر ہو تو اسی وقت درست */
    let n = (parseInt(this.finCfg("sidseq", "0"), 10) || 0) + 1, sid;
    /* MCS1511SU428: MCS-001 / MCS-002 صرف ایڈمن کے دو طے شدہ موبائل کے لیے — کوئی اور کبھی نہیں */
    const slot = this.adminSlotOf(mob);
    if (slot) {
      const hold = this.sql.exec("SELECT mob FROM mcssid WHERE sid = ?", slot).toArray()[0];
      if (hold && hold.mob !== mob) { let m2 = Math.max(3, n); let to; for (;;) { to = "MCS" + String(m2).padStart(3, "0"); if (!this.sql.exec("SELECT mob FROM mcssid WHERE sid = ?", to).toArray().length) break; m2++; }   /* حفاظتی: کسی اور کے پاس ہو تو اسے اگلی خالی دے دیں */
        this.sidRen(slot, to); this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('sidseq', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", String(m2)); this.finLog("sidslot_moved", { slot, to, from: hold.mob }); }
      this.sql.exec("INSERT INTO mcssid (mob, sid, subn, ts) VALUES (?, ?, 0, ?)", mob, slot, ts || Date.now());
      this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) SELECT ?, id FROM mcsukey WHERE k = ?", "a:" + slot, "m:" + mob);
      return slot;
    }
    if (n < 3) n = 3;
    for (;;) { sid = "MCS" + String(n).padStart(3, "0"); if (!this.sql.exec("SELECT mob FROM mcssid WHERE sid = ?", sid).toArray().length) break; n++; }
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('sidseq', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", String(n));
    this.sql.exec("INSERT INTO mcssid (mob, sid, subn, ts) VALUES (?, ?, 0, ?)", mob, sid, ts || Date.now());
    this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) SELECT ?, id FROM mcsukey WHERE k = ?", "a:" + sid, "m:" + mob);
    return sid;
  }
  /* MCS1511SU450 (مالک کا حکم — «ایک ہی کاروبار ہے تو M1 ہو، M2 نہیں»): ممبرشپ نمبر کاروبار کا پکا نمبر — اس موبائل کا پہلا زندہ کاروبار M1، دوسرا M2…
     تجدید پر وہی نمبر؛ حذف شدہ کاروبار کا نمبر خالی ہو کر اگلے نئے کو (گنتی کبھی بے وجہ آگے نہیں بڑھتی) */
  subOf(rec) {
    const c = this.finCfg("subof_" + rec, ""); if (c) return c;
    const q = this.sql.exec("SELECT subid FROM sale WHERE rec = ? AND subid IS NOT NULL AND COALESCE(void, 0) = 0 ORDER BY id DESC LIMIT 1", rec).toArray()[0];
    return q ? q.subid : "";
  }
  subSet(rec, subid) { this.sql.exec("INSERT INTO agcfg (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", "subof_" + rec, subid); }
  subNext(rec) {
    const sid = this.sidFor(rec); if (!sid) return "";
    const own = this.subOf(rec); if (own && own.indexOf(sid + "M") === 0) { this.subSet(rec, own); return own; }
    const mob = this.sidMob(rec), used = new Set();
    for (const r of this.sql.exec("SELECT rec FROM prof WHERE rec LIKE ?", "p" + mob.slice(2) + "_%").toArray()) {
      if (r.rec === rec) continue; const m = /M(\d+)$/.exec(this.subOf(r.rec) || ""); if (m) used.add(parseInt(m[1], 10));
    }
    let n = 1; while (used.has(n)) n++;
    const subid = sid + "M" + n; this.subSet(rec, subid);
    const cur = this.sql.exec("SELECT subn FROM mcssid WHERE sid = ?", sid).toArray()[0];
    if (!cur || (cur.subn || 0) < n) this.sql.exec("UPDATE mcssid SET subn = ? WHERE sid = ?", n, sid);
    return subid;   /* MCS001M1، MCS001M2… */
  }
  /* MCS1511SU450: ایک ہی موبائل کے پرانے (حذف شدہ کارڈ والے) ریکارڈ کی مدت / خریداری / فروخت / نمبر نئے کارڈ پر */
  recMove450(from, to) {
    if (!from || !to || from === to) return false;
    const f = this.sql.exec("SELECT until, paid FROM prof WHERE rec = ?", from).toArray()[0], t = this.sql.exec("SELECT until, paid FROM prof WHERE rec = ?", to).toArray()[0];
    if (!f || !t) return false;
    const now = Date.now(), until = Math.max(t.until || 0, f.until || 0);
    this.sql.exec("UPDATE prof SET until = ?, paid = COALESCE(paid, 0) + ?, pend = 0 WHERE rec = ?", until, f.paid || 0, to);
    this.sql.exec("UPDATE prof SET until = ?, paid = 0 WHERE rec = ?", Math.min(now, f.until || now), from);
    this.sql.exec("UPDATE mbuy SET rec = ? WHERE rec = ?", to, from);
    this.sql.exec("UPDATE sale SET rec = ? WHERE rec = ? AND COALESCE(void, 0) = 0", to, from);
    const num = (v) => { const m = /M(\d+)$/.exec(v || ""); return m ? parseInt(m[1], 10) : 0; };
    const sf = this.subOf(from), st = this.subOf(to);
    this.sql.exec("DELETE FROM agcfg WHERE k = ?", "subof_" + from);
    if (sf && (!num(st) || num(sf) < num(st))) { this.subSet(to, sf); this.sql.exec("UPDATE sale SET subid = ? WHERE rec = ? AND COALESCE(void, 0) = 0", sf, to); }
    this.finLog("recmove450", { from, to, until, sub: this.subOf(to) });
    return true;
  }
  own450() {   /* ایک بار (مالک کا حکم): ایڈمن 1 کی Google Play خریداری پرانے ریکارڈ (…2ukgfa) میں گئی، فون پر نیا کارڈ (…fsxj74) — مدت اور M1 نئے پر */
    if (this.finCfg("own450", "")) return;
    const pick = (end) => (this.sql.exec("SELECT rec FROM prof WHERE rec LIKE 'p3206793793_%' AND rec LIKE ?", "%" + end).toArray()[0] || {}).rec;
    const from = pick("2ukgfa"), to = pick("fsxj74");
    const done = from && to ? this.recMove450(from, to) : false;
    if (done) { const sid = this.sidGet(to); if (sid) { this.subSet(to, sid + "M1"); this.sql.exec("UPDATE sale SET subid = ? WHERE rec = ? AND COALESCE(void, 0) = 0", sid + "M1", to); } }
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('own450', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify({ at: Date.now(), from: from || "", to: to || "", done }));
  }
  /* MCS1511SU456 (مالک کا حکم، ایک بار): ایڈمن 1 (0320-6793793) کے سب کاروبار کی مدت صفر — ٹیسٹ خریداریاں / جمع شدہ مدت ختم، تاکہ پرومو کوڈ سے نئی سبسکرپشن شروع سے آزمائی جا سکے۔
     پرانے ٹیسٹ ٹوکن کاروبار سے الگ (rec = void_…) تاکہ پیچھے کی تجدید دوبارہ مدت نہ ڈالے؛ ان کی فروخت void (حساب سے باہر، «Removed entries» میں)؛ ممبرشپ نمبر M1 ویسا */
  own456() {
    if (this.finCfg("own456", "")) return;
    const now = Date.now(), recs = this.sql.exec("SELECT rec FROM prof WHERE rec LIKE 'p3206793793_%'").toArray().map((r) => r.rec);
    let sales = 0, toks = 0;
    for (const rec of recs) {
      this.sql.exec("UPDATE prof SET until = ?, paid = 0, pend = 0 WHERE rec = ?", now, rec);
      toks += this.sql.exec("SELECT tok FROM mbuy WHERE rec = ?", rec).toArray().length;
      this.sql.exec("UPDATE mbuy SET rec = ? WHERE rec = ?", "void_" + rec, rec);
      sales += this.sql.exec("SELECT id FROM sale WHERE rec = ? AND COALESCE(void, 0) = 0", rec).toArray().length;
      this.sql.exec("UPDATE sale SET void = 1, vwhy = ?, vts = ? WHERE rec = ? AND COALESCE(void, 0) = 0", "owner reset 456 (test purchases)", now, rec);
    }
    this.finLog("own456", { recs, sales, toks });
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('own456', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify({ at: now, recs: recs.length, sales, toks }));
  }
  subFix450() {   /* ایک بار: ہر موبائل کے زندہ کاروبار (پرانے پہلے) کو M1، M2… دوبارہ؛ ان کی فروخت کا subid بھی */
    if (this._sf450) return; this._sf450 = 1;
    if (this.finCfg("subfix450", "")) return;
    const log = [];
    for (const s of this.sql.exec("SELECT mob, sid FROM mcssid").toArray()) {
      const recs = this.sql.exec("SELECT rec FROM prof WHERE rec LIKE ? ORDER BY since, ts", "p" + String(s.mob).slice(2) + "_%").toArray().map((r) => r.rec)
        .filter((rec) => this.subOf(rec) || this.sql.exec("SELECT id FROM sale WHERE rec = ? AND COALESCE(void, 0) = 0 LIMIT 1", rec).toArray().length || this.adminSlotOf(rec));
      recs.forEach((rec, i) => {
        const nv = s.sid + "M" + (i + 1), old = this.subOf(rec);
        if (old !== nv) { this.sql.exec("UPDATE sale SET subid = ? WHERE rec = ? AND COALESCE(void, 0) = 0", nv, rec); log.push(rec + ":" + (old || "-") + ">" + nv); }
        this.subSet(rec, nv);
      });
      this.sql.exec("UPDATE mcssid SET subn = ? WHERE mob = ?", recs.length, s.mob);
    }
    this.finLog("subfix450", { moved: log });
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('subfix450', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify({ at: Date.now(), moved: log.length }));
  }
  idFmt1() {   /* MCS1511SU429 (مالک کا حکم، ایک بار): پرانی ID سے ڈیش ہٹائیں — MCS-001 ← MCS001؛ MCS-001-01 ← MCS001M1؛ AG-001 ← AG001 (ریفرل / حساب / چیٹ ساتھ ساتھ) */
    if (this._idf) return; this._idf = 1;
    if (this.finCfg("idfmt1", "")) return;
    const log = { sid: 0, key: 0, sub: 0, ag: 0 };
    for (const r of this.sql.exec("SELECT mob, sid FROM mcssid").toArray()) { const m = /^MCS-(\d{3,5})$/.exec(String(r.sid || "")); if (m) { try { this.sql.exec("UPDATE mcssid SET sid = ? WHERE mob = ?", "MCS" + m[1], r.mob); log.sid++; } catch (e) {} } }
    for (const r of this.sql.exec("SELECT k FROM mcsukey WHERE k GLOB 'a:MCS-[0-9][0-9][0-9]*'").toArray()) { const m = /^a:MCS-(\d{3,5})$/.exec(String(r.k)); if (!m) continue; try { this.sql.exec("UPDATE mcsukey SET k = ? WHERE k = ?", "a:MCS" + m[1], r.k); log.key++; } catch (e) { try { this.sql.exec("DELETE FROM mcsukey WHERE k = ?", r.k); } catch (e2) {} } }
    for (const r of this.sql.exec("SELECT id, subid FROM sale WHERE subid LIKE 'MCS-%'").toArray()) { const m = /^MCS-(\d{3,5})-(\d+)$/.exec(String(r.subid)); if (m) { this.sql.exec("UPDATE sale SET subid = ? WHERE id = ?", "MCS" + m[1] + "M" + (parseInt(m[2], 10) || 1), r.id); log.sub++; } }
    for (const r of this.sql.exec("SELECT id, data FROM agent").toArray()) { let d = null; try { d = JSON.parse(r.data); } catch (e) {} const m = d && /^([A-Z]{2,3})-(\d{3,5})$/.exec(String(d.code || "")); if (!m) continue; const old = d.code, nc = m[1] + m[2]; d.oldCodes = (d.oldCodes || []).concat(old); d.code = nc; this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), r.id); this.agMoveRefs(old, nc); log.ag++; }
    this.finLog("idfmt1", log);
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('idfmt1', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify(Object.assign({ at: Date.now() }, log)));
  }
  admCode1() {   /* MCS1511SU429 (مالک کا حکم، ایک بار): محفوظ DEV / CODEV ← ADMIN1 / ADMIN2 (ریفرل، حساب، چیٹ ساتھ)؛ ایڈمن کے پرانے مفت (دس سال والے) کاروبار ختم — اب ادائیگی سے */
    if (this._adc) return; this._adc = 1;
    if (this.finCfg("admcode1", "")) return;
    const log = { fr: 0 };
    for (const q of [["DEV", "ADMIN1"], ["CODEV", "ADMIN2"]]) { try { this.agMoveRefs(q[0], q[1]); } catch (e) {} try { this.sql.exec("UPDATE agcnic SET id = ? WHERE id = ?", q[1], q[0]); } catch (e) {} }
    const now = Date.now();
    for (const r of this.sql.exec("SELECT rec, until FROM prof WHERE until > ?", now + 1000 * 864e5).toArray()) { if (this.adminSlotOf(r.rec) || this.staffSid(r.rec)) { this.sql.exec("UPDATE prof SET until = ? WHERE rec = ?", now, r.rec); log.fr++; } }
    this.finLog("admcode1", log);
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('admcode1', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify(Object.assign({ at: now }, log)));
  }
  agSlots430() {   /* MCS1511SU430 (مالک کا حکم، ایک بار): AG001 / AG002 ایڈمن کے؛ ان پر بیٹھے دوسرے ایجنٹ AG003 سے آگے (ریفرل / حساب / چیٹ ساتھ) */
    if (this._ags) return; this._ags = 1;
    if (this.finCfg("agslot430", "")) return;
    const rows = this.sql.exec("SELECT id, data FROM agent").toArray().map((r) => { try { return JSON.parse(r.data); } catch (e) { return null; } }).filter(Boolean);
    const used = new Set(rows.map((d) => d.code).filter(Boolean)); const moved = [];
    const nextFree = () => { let n = 3; while (used.has("AG" + String(n).padStart(3, "0"))) n++; return "AG" + String(n).padStart(3, "0"); };
    for (const d of rows) {
      if (!/^AG00[12]$/.test(d.code || "") || ADMIN_AG[entPhone(d.phone || "")] === d.code) continue;
      const old = d.code, nc = nextFree(); used.add(nc); d.oldCodes = (d.oldCodes || []).concat(old); d.code = nc;
      this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), d.id); this.agMoveRefs(old, nc); moved.push(old + ">" + nc);
    }
    for (const d of rows) {   /* ایڈمن کا اپنا ایجنٹ پہلے سے کسی اور کوڈ پر ہو تو اسے AG001 / AG002 */
      const fx = ADMIN_AG[entPhone(d.phone || "")]; if (!fx || d.code === fx || !d.code || d.status !== "approved") continue;
      if (rows.some((x) => x !== d && x.code === fx)) continue;
      const old = d.code; d.oldCodes = (d.oldCodes || []).concat(old); d.code = fx;
      this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), d.id); this.agMoveRefs(old, fx); moved.push(old + ">" + fx);
    }
    this.finLog("agslot430", { moved });
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('agslot430', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify({ at: Date.now(), moved }));
  }
  agFreeList() { try { const v = JSON.parse(this.finCfg("agfree", "[]") || "[]"); return Array.isArray(v) ? v.filter((c) => /^AG\d{3,}$/.test(c)).sort() : []; } catch (e) { return []; } }
  agFreeSave(list) { const u = Array.from(new Set(list)).sort(); this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('agfree', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify(u)); return u; }
  agFreeCode(d) {   /* MCS1611MO487 (مالک کا حکم): ایجنٹ کا AG نمبر آزاد — اس کا پرانا حساب / ریفرل / چیٹ ایک محفوظ کوڈ (X…) پر، ایجنٹ بند؛ نمبر «خالی» فہرست میں */
    const code = String(d && d.code || ""); if (!/^AG\d{3,}$/.test(code)) return "";
    if (ADMIN_AG[entPhone(d.phone || "")] === code || Object.values(ADMIN_AG).includes(code)) return "";   /* AG001 / AG002 ایڈمن کے لیے پکے */
    const arch = "X" + code + "-" + Date.now().toString(36).toUpperCase();
    this.agMoveRefs(code, arch);
    d.oldCodes = (d.oldCodes || []).filter((c) => c !== code).concat(arch); d.freedCode = code; d.freedAt = Date.now(); d.code = arch; d.off = true; d.offAt = Date.now();
    this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), d.id);
    for (const r of this.sql.exec("SELECT id, data FROM agent").toArray()) { try { const x = JSON.parse(r.data); if (x.id !== d.id && (x.oldCodes || []).includes(code)) { x.oldCodes = x.oldCodes.filter((c) => c !== code); this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(x), x.id); } } catch (e) {} }
    this.agFreeSave(this.agFreeList().concat(code));
    this.finLog("agfree", { code, arch, id: d.id });
    return code;
  }
  agTakeFree() {   /* سب سے چھوٹا خالی AG نمبر (جو ابھی کسی کے پاس نہیں) */
    const used = new Set(this.sql.exec("SELECT data FROM agent").toArray().map((x) => { try { return JSON.parse(x.data).code; } catch (e) { return ""; } }));
    const L = this.agFreeList(); const c = L.find((x) => !used.has(x)); if (!c) { if (L.length) this.agFreeSave(L.filter((x) => !used.has(x))); return ""; }
    this.agFreeSave(L.filter((x) => x !== c && !used.has(x))); return c;
  }
  agSlot486() {   /* MCS1611MO486 (مالک کا حکم، ایک بار): پہلا اصل ایجنٹ حبیب شہباز = AG003 (AG001 / AG002 ایڈمن کے) — AG003 خالی ہو تو اس کا AG004 → AG003، ریفرل / حساب / چیٹ ساتھ؛ پرانا کوڈ oldCodes میں */
    if (this._ag486) return; this._ag486 = 1;
    if (this.finCfg("agslot486", "")) return;
    const rows = this.sql.exec("SELECT id, data FROM agent").toArray().map((r) => { try { return JSON.parse(r.data); } catch (e) { return null; } }).filter(Boolean);
    const h = rows.find((d) => entPhone(d.phone || "") === "923015079681" && d.status === "approved");
    let res = "none";
    if (h && h.code !== "AG003") {
      const taken = rows.find((d) => d !== h && (d.code === "AG003" || (d.oldCodes || []).includes("AG003")) && !ADMIN_AG[entPhone(d.phone || "")]);
      if (taken && !taken.off) res = "taken:" + taken.id;
      else {
        const old = h.code;
        if (taken) {   /* غیر فعال ایجنٹ AG003 پر ہو تو کوڈ آپس میں بدل (اس کا حساب اس کے ساتھ) */
          taken.oldCodes = (taken.oldCodes || []).filter((c) => c !== "AG003");
          if (taken.code === "AG003") { this.agMoveRefs("AG003", "AGTMP486"); taken.oldCodes.push("AG003"); taken.code = old; }
          this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(taken), taken.id);
        }
        h.oldCodes = (h.oldCodes || []).concat(old); h.code = "AG003";
        this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(h), h.id); this.agMoveRefs(old, "AG003");
        if (taken && taken.code === old) this.agMoveRefs("AGTMP486", old);
        try { this.sql.exec("UPDATE agcnic SET code = 'AG003' WHERE code = ?", old); } catch (e) {}
        res = old + ">AG003";
      }
    }
    this.finLog("agslot486", { res });
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('agslot486', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify({ at: Date.now(), res }));
  }
  refMigrate() {   /* MCS1111WE329: ایک بار — محفوظ PBT-D / PBT-C → DEV / CODEV (فروخت، وصولی، ممبرشپ) */
    if (this.finCfg("refmig1", "")) return;
    for (const t of ["sale", "finx"]) for (const x of this.sql.exec("SELECT id, who FROM " + t + " WHERE who LIKE '%PBT-%'").toArray()) { try { const w = JSON.parse(x.who); w.code = refNorm(w.code); if (w.was) w.was = refNorm(w.was); this.sql.exec("UPDATE " + t + " SET who = ? WHERE id = ?", JSON.stringify(w), x.id); } catch (e) {} }
    for (const x of this.sql.exec("SELECT rec, data FROM prof WHERE data LIKE '%PBT-%'").toArray()) { try { const d = JSON.parse(x.data); d.ref = refNorm(d.ref); this.sql.exec("UPDATE prof SET data = ? WHERE rec = ?", JSON.stringify(d), x.rec); } catch (e) {} }
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('refmig1', '1')");
  }
  sidMigrate() {   /* ایک بار: پہلے سے بنے اکاؤنٹ اور رجسٹرڈ کاروبار (ممبرشپ) وقت کی ترتیب سے MCS-001…؛ پرانی فروخت پر سبسکرپشن ID */
    if (this.finCfg("sidmig1", "")) return;
    const rows = [];
    for (const r of this.sql.exec("SELECT data, ts FROM mcsuser").toArray()) { try { const u = JSON.parse(r.data); if (!u.del && u.mobile) rows.push([r.ts || u.ts || 0, u.mobile]); } catch (e) {} }
    for (const r of this.sql.exec("SELECT rec, since, ts FROM prof").toArray()) rows.push([r.since || r.ts || 0, r.rec]);
    rows.sort((a, b) => a[0] - b[0]).forEach((x) => this.sidFor(x[1], x[0]));
    for (const r of this.sql.exec("SELECT id, rec FROM sale WHERE subid IS NULL ORDER BY ts").toArray()) { const sub = this.subNext(r.rec); if (sub) this.sql.exec("UPDATE sale SET subid = ? WHERE id = ?", sub, r.id); }
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('sidmig1', '1')");
  }
  agRecode(id) {   /* MCS1111WE312: پرانا ایجنٹ کوڈ (MS-001…) → اگلا AG-NNN؛ ریفرل / حساب / چیٹ / اطلاعات ساتھ */
    const r = this.sql.exec("SELECT data FROM agent WHERE id = ?", id).toArray()[0]; if (!r) return { ok: false, reason: "none" };
    const d = JSON.parse(r.data); if (!d.code) return { ok: false, reason: "no_code" }; if (/^AG\d+$/.test(d.code)) return { ok: true, code: d.code, same: 1 };
    if (String(d.cnic || "").replace(/\D/g, "").length !== 13) return { ok: false, reason: "bad_cnic" };
    const old = d.code, code = this.agCodeFor(d.cnic, d.bizRk, id, d.phone); if (!code) return { ok: false, reason: "no_biz" }; d.code = code; d.oldCodes = (d.oldCodes || []).concat(old);
    this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), id);
    this.agMoveRefs(old, code);
    this.finLog("agrecode", { id, old, code });
    return { ok: true, code, old };
  }
  agMoveRefs(old, code) {   /* MCS1211TH351: ایجنٹ کوڈ بدلے تو ریفرل / حساب / چیٹ / اطلاعات / شناختی کارڈ ساتھ */
    for (const t of ["agref", "agpay", "agproof", "agmsg"]) this.sql.exec("UPDATE " + t + " SET code = ? WHERE code = ?", code, old);
    for (const t of ["agnote", "payacct", "payreq"]) { try { this.sql.exec("UPDATE " + t + " SET who = ? WHERE who = ?", "A:" + code, "A:" + old); } catch (e) {} }
    try { this.sql.exec("UPDATE finx SET who = ? WHERE who = ?", code, old); } catch (e) {}
    for (const x of this.sql.exec("SELECT id, who FROM sale WHERE who LIKE ?", '%"' + old + '"%').toArray()) { try { const w = JSON.parse(x.who); if (w.code === old) w.code = code; if (w.was === old) w.was = code; this.sql.exec("UPDATE sale SET who = ? WHERE id = ?", JSON.stringify(w), x.id); } catch (e) {} }
    for (const k of ["rd_" + old]) { try { this.sql.exec("UPDATE agcfg SET k = ? WHERE k = ?", "rd_" + code, k); } catch (e) {} }
    try { this.sql.exec("UPDATE agcnic SET code = ? WHERE code = ?", code, old); } catch (e) {}
    try { for (const x of this.sql.exec("SELECT rec, data FROM prof WHERE data LIKE ?", '%"ref":"' + old + '"%').toArray()) { const d = JSON.parse(x.data || "{}"); if (d.ref === old) { d.ref = code; this.sql.exec("UPDATE prof SET data = ? WHERE rec = ?", JSON.stringify(d), x.rec); } } } catch (e) {}
  }
  agRenumber(firstMob) {   /* MCS1211TH351 (مالک کا حکم): سب منظور ایجنٹ ترتیب وار AG-001، AG-002… — پہلا firstMob (حبیب شہباز) */
    const fm = entPhone(firstMob || "");
    const A = this.sql.exec("SELECT id, data FROM agent").toArray().map((r) => { try { return JSON.parse(r.data); } catch (e) { return null; } }).filter((d) => d && d.code && d.status === "approved");
    for (let k = A.length - 1; k >= 0; k--) if (ADMIN_AG[entPhone(A[k].phone || "")]) A.splice(k, 1);   /* MCS1511SU430: ایڈمن کے AG001 / AG002 نہیں چھیڑتے */
    A.sort((x, y) => ((entPhone(x.phone) === fm ? 0 : 1) - (entPhone(y.phone) === fm ? 0 : 1)) || ((x.okAt || x.at || 0) - (y.okAt || y.at || 0)));
    const tmp = A.map((d) => { const t = "TMPAG-" + d.id; this.agMoveRefs(d.code, t); return t; });
    const out = A.map((d, i) => { const code = "AG" + String(i + 3).padStart(3, "0"), old = d.code;
      this.agMoveRefs(tmp[i], code);
      if (old !== code) d.oldCodes = (d.oldCodes || []).filter((x) => x !== code).concat(old);
      d.code = code; this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), d.id);
      return { id: d.id, name: d.name, phone: d.phone, old, code }; });
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('seq_AG', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", String(A.length + 2));
    this.finLog("agrenum", { list: out.map((x) => x.old + ">" + x.code) });
    return out;
  }
  agCnicRow(cnic) { const c = String(cnic || "").replace(/\D/g, ""); return c.length === 13 ? this.sql.exec("SELECT code, id FROM agcnic WHERE cnic = ?", c).toArray()[0] || null : null; }
  agStaffCnic(cnic) {   /* MCS1211TH335: ڈویلپر / کو-ڈویلپر کا شناختی کارڈ — اس پر ایجنٹ کوڈ نہیں (DEV / CODEV ہی ان کا ریفرل)؛ کاروبار بن سکتا ہے */
    return "";   /* MCS1511SU430: ایڈمن بھی ایجنٹ بن سکتا ہے (AG001 / AG002) */
  }
  agCnicOwner(cnic, exceptId) {   /* اسی شناختی کارڈ کا کوئی اور ایجنٹ (کسی بھی حالت میں) */
    const c = String(cnic || "").replace(/\D/g, ""); if (c.length !== 13) return null;
    for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const d = JSON.parse(r.data); if (d.id !== exceptId && String(d.cnic || "").replace(/\D/g, "") === c) return d; }
    return null;
  }
  agBizOf(rk, phone) {   /* MCS1111WE312: ایجنٹ کا جڑا کاروبار — دیا گیا rk (اگر سرور پر ہو) ورنہ اسی موبائل کی کوئی ممبرشپ */
    if (rk && this.sql.exec("SELECT rec FROM prof WHERE rec = ?", rk).toArray().length) return rk;
    const m = this.sidMob(phone); if (!m) return "";
    const r = this.sql.exec("SELECT rec FROM prof WHERE rec LIKE ? ORDER BY since LIMIT 1", "p" + m.slice(2) + "_%").toArray()[0]; return r ? r.rec : "";
  }
  agCodeFor(cnic, rk, id, phone) {   /* MCS1111WE312 (مالک کا حکم): ایجنٹ کوڈ = اس کی سسٹم ID کا نمبر — MCS-001 → AG-001؛ کاروبار جڑا ہونا لازمی */
    const c = String(cnic || "").replace(/\D/g, ""); if (c.length !== 13) return "";   /* مالک کا حکم: شناختی کارڈ کے بغیر ایجنٹ کوڈ نہیں */
    const row = this.agCnicRow(c); if (row && /^AG\d+$/.test(row.code)) return row.code;
    const biz = this.agBizOf(rk, phone); if (!biz) return "";
    { const fixed = ADMIN_AG[entPhone(phone || "")]; if (fixed) { this.sql.exec("INSERT INTO agcnic (cnic, code, id, ts) VALUES (?, ?, ?, ?) ON CONFLICT (cnic) DO UPDATE SET code = excluded.code", c, fixed, id || "", Date.now()); return fixed; } }   /* MCS1511SU430 */
    /* MCS1211TH351 (مالک کا حکم): ایجنٹ کوڈ ترتیب وار AG-001، AG-002… (MCS نمبر سے نہیں) */
    { const fr = this.agTakeFree(); if (fr) { this.sql.exec("INSERT INTO agcnic (cnic, code, id, ts) VALUES (?, ?, ?, ?) ON CONFLICT (cnic) DO UPDATE SET code = excluded.code", c, fr, id || "", Date.now()); return fr; } }   /* MCS1611MO487: پہلے خالی ہوا AG نمبر */
    let mx = 0; for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { try { const m = /^AG-?(\d+)$/.exec(JSON.parse(r.data).code || ""); if (m) mx = Math.max(mx, +m[1]); } catch (e) {} }
    let code = "AG" + String(Math.max(mx, 2) + 1).padStart(3, "0");   /* 001 / 002 ایڈمن کے لیے محفوظ */
    for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const d = JSON.parse(r.data); if (d.code === code && d.id !== id && String(d.cnic || "").replace(/\D/g, "") !== c) { code = this.agNextCode("AGX"); break; } }
    if (c.length === 13) this.sql.exec("INSERT INTO agcnic (cnic, code, id, ts) VALUES (?, ?, ?, ?) ON CONFLICT (cnic) DO UPDATE SET code = excluded.code", c, code, id || "", Date.now());
    return code;
  }
  agResolve(code, phone) {   /* نیا کوڈ (ms1 / MS-001)، پرانا p… کوڈ، ایجنٹ کا موبائل یا شناختی کارڈ نمبر (MCS0511TH143) → منظور ایجنٹ */
    const nc = agNormRef(code), cn = String(code || "").replace(/\D/g, "");
    if (cn.length === 13) { for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const d = JSON.parse(r.data); if (d.status === "approved" && !d.off && String(d.cnic || "").replace(/\D/g, "") === cn) return d; } return null; }
    for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const d = JSON.parse(r.data); if (d.status === "approved" && !d.off && (d.code === nc || (code && (d.bizRk === code || (d.oldCodes || []).includes(code))) || (phone && d.phone === phone))) return d; }
    return null;
  }
  agMigrate() {   /* پرانے p… کوڈ ایک بار نئے انداز میں — ریفرل / ادائیگیاں / ثبوت / چیٹ ساتھ */
    if (this.sql.exec("SELECT v FROM agcfg WHERE k = 'agmig2'").toArray().length) return;
    for (const r of this.sql.exec("SELECT id, data FROM agent").toArray()) {
      const d = JSON.parse(r.data); if (!d.code || !/^p\d/.test(d.code)) continue;
      const old = d.code; d.code = this.agNextCode(agAbbrOfRk(d.bizRk || old)); d.oldCodes = (d.oldCodes || []).concat(old);
      this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), r.id);
      for (const t of ["agref", "agpay", "agproof", "agmsg"]) this.sql.exec("UPDATE " + t + " SET code = ? WHERE code = ?", d.code, old);
    }
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('agmig2', '1')");
  }
  /* ===== AGP0911MO018 (مالک کی منظوری، 9 نومبر): MCS کا حساب — صرف My City Shines =====
     ممبرشپ (1000 فی سال): گوگل پلے سے = گوگل 15٪، مینٹیننس 15٪، پھر بچی رقم کا 15٪ لانے والا (AGP1011TU023)، باقی ڈویلپر / کو-ڈویلپر آدھا آدھا؛ سیدھی ملی = گوگل والا 15٪ بھی مینٹیننس میں۔
     اشتہار: مینٹیننس 15٪، بچی رقم کا 15٪ لانے والا، باقی آدھا آدھا۔ لانے والا: ایجنٹ / DEV (ڈویلپر) / CODEV (کو-ڈویلپر) / PBT (آدھا آدھا)۔
     9 نومبر سے پہلے کی فروخت پرانے حساب (ایجنٹ 170، ڈویلپر / کو-ڈویلپر 265) سے۔ پلے والی رقم گوگل سے «✅ وصول» ہونے تک «⏳ آنا باقی»۔
     ادائیگی: ہر مہینے 20 سے 25 تاریخ، کم از کم 1,000؛ اس سے زیادہ ہو تو بیچ میں درخواست۔ */
  static FIN2_AT = Date.UTC(2026, 10, 8, 19, 0);   /* 9 نومبر 2026، رات 12 بجے (PKT) */
  agNote(who, kind, text) { if (!who) return; try { this.sql.exec("INSERT INTO agnote (who, kind, text, ts) VALUES (?, ?, ?, ?)", who, kind, String(text).slice(0, 300), Date.now()); this.sql.exec("DELETE FROM agnote WHERE ts < ?", Date.now() - 400 * 86400e3); } catch (e) {} }
  finLog(op, data) { try { this.sql.exec("INSERT INTO finlog (ts, op, data) VALUES (?, ?, ?)", Date.now(), op, JSON.stringify(data || {}).slice(0, 2000)); } catch (e) {} }
  finMonOf(ts) { const t = new Date(ts + 5 * 3600e3); return t.getUTCFullYear() + "_" + String(t.getUTCMonth() + 1).padStart(2, "0"); }
  finCfg(k, d) { const r = this.sql.exec("SELECT v FROM agcfg WHERE k = ?", k).toArray()[0]; return r ? r.v : d; }
  /* ===== MCS1511SU458 (مالک کا حکم، ہیلپ ڈیسک #263): ایڈمن بنانا / ہٹانا، اجازتیں، اور حصے کی شرحیں مالک کے ہاتھ میں =====
     شرحیں «ورژن» میں (agcfg splitv): ہر ورژن کی تاریخ (at) سے آگے کی فروخت پر — پچھلی فروخت کا حساب کبھی نہیں بدلتا۔
     ہر حصہ {t:'p', v:15} (پوری رقم کا فیصد) یا {t:'f', v:150} (مقررہ رقم — ممبرشپ پر فی سال، اشتہار پر فی اشتہار)۔
     ترتیب: گوگل → مینٹیننس → لانے والا → ایڈمنز (adm: {موبائل: {t, v}} — فیصد = گوگل، مینٹیننس اور لانے والے کے بعد بچی رقم کا) → جو بچا ایڈمن 1۔
     کوئی ورژن نہ ہو تو پرانا حساب (15 / 15 / 15، باقی آدھا آدھا)۔ */
  static CD_PERMS = ["biz", "agents", "chat", "help", "accounts", "agview", "company"];
  cdPerms(r) { let p = null; try { p = r && r.perms ? JSON.parse(r.perms) : null; } catch (e) {} if (!p) p = { biz: 1, agents: 1, chat: 1, help: 1, accounts: 1, agview: 1, company: 0 }; const o = {}; for (const k of McsStats.CD_PERMS) o[k] = p[k] ? 1 : 0; return o; }
  cdAuth(phone, pin) { const r = this.sql.exec("SELECT phone, name, pin, ts, seen, perms, COALESCE(off, 0) AS off FROM codev WHERE phone = ?", String(phone || "")).toArray()[0]; if (!r || r.off || !r.pin || !pin || r.pin !== String(pin)) return null; r.p = this.cdPerms(r); return r; }
  splitRules() { let a = []; try { a = JSON.parse(this.finCfg("splitv", "[]")) || []; } catch (e) {} return a.filter((x) => x && x.at).sort((p, q) => p.at - q.at); }
  splitAt(ts) { let r = null; for (const x of this.splitRules()) if (x.at <= ts) r = x; return r; }
  splitCur() {   /* ابھی کی شرحیں — ورژن نہ ہو تو پرانے حساب جیسی */
    const r = this.splitAt(Date.now()); if (r) return r;
    const first = this.sql.exec("SELECT phone FROM codev WHERE COALESCE(off, 0) = 0 ORDER BY ts LIMIT 1").toArray()[0], adm = {}; if (first) adm[first.phone] = { t: "p", v: 50 };
    return { at: 0, google: { t: "p", v: 15 }, maint: { t: "p", v: 15 }, bring: { t: "p", v: 15 }, adm };
  }
  splitEnsure(by) { if (!this.splitRules().length) { const c = this.splitCur(); this.splitPush(Object.assign({}, c, { at: Date.now() - 1 }), by || "auto"); } }
  splitPush(r, by) { const a = this.splitRules(); r = Object.assign({}, r, { at: r.at || Date.now(), by: by || "" }); a.push(r); this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('splitv', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify(a.slice(-100))); this.finLog("split", r); return r; }
  finSplit(kind, src, amount, by, ts, gAct, code) {
    const R = this.splitAt(ts || Date.now());
    if (R) {
      const price = parseInt(this.finCfg("memprice", "1000"), 10) || 1000, k = kind === "mem" ? amount / price : 1;
      const val = (x, d) => { x = x && (x.t === "p" || x.t === "f") ? x : d; const v = Math.max(0, +x.v || 0); return x.t === "f" ? Math.round(v * k) : Math.round(amount * Math.min(100, v) / 100); };
      const P15 = { t: "p", v: 15 }, sh = { google: 0, maint: 0, agent: 0, dev: 0, codev: 0, cd: {} };
      let left = amount; const take = (n) => { n = Math.max(0, Math.min(left, Math.round(n))); left -= n; return n; };
      const g = val(R.google, P15), m = val(R.maint, P15);
      if (kind === "mem" && src === "play") { sh.google = take(gAct != null ? gAct : g); sh.maint = take(m); } else if (kind === "mem") sh.maint = take(m + g); else sh.maint = take(m);
      const rows = {}; for (const r of this.sql.exec("SELECT phone, offp FROM codev").toArray()) { let p = []; try { p = JSON.parse(r.offp || "[]") || []; } catch (e) {} rows[r.phone] = p; }
      const alive = (ph) => rows[ph] && !rows[ph].some((x) => ts >= x[0] && (!x[1] || ts < x[1]));   /* ہٹائے جانے کے عرصے کی فروخت میں حصہ نہیں — بحال ہو کر بھی نہیں */
      const a = val(R.bring, P15);
      if (by === "agent") sh.agent = take(a); else if (by === "dev") sh.dev += take(a);
      else if (by === "codev") { const ph = this.cdBringPhone(code); if (ph && alive(ph)) sh.cd[ph] = take(a); else sh.dev += take(a); }
      const rest = left;   /* PBT (کمپنی) کا لانے والا حصہ بچی رقم ہی میں — پرانے «آدھا آدھا» جیسا */
      for (const ph of Object.keys(R.adm || {})) { if (!alive(ph)) continue; const x = R.adm[ph]; const v = x && x.t === "f" ? val(x) : Math.round(rest * Math.min(100, Math.max(0, +(x && x.v) || 0)) / 100); sh.cd[ph] = (sh.cd[ph] || 0) + take(v); }
      sh.dev += left; for (const ph in sh.cd) sh.codev += sh.cd[ph];
      return sh;
    }
    const sh = this.finSplitOld(kind, src, amount, by, ts, gAct), f = this.sql.exec("SELECT phone FROM codev ORDER BY ts LIMIT 1").toArray()[0];
    sh.cd = {}; if (f && sh.codev) sh.cd[f.phone] = sh.codev; else if (sh.codev) { sh.dev += sh.codev; sh.codev = 0; }
    return sh;
  }
  cdBringPhone(code) { const c = String(code || "").toUpperCase(); const m = /^ADMIN(\d+)$/.exec(c === "CODEV" || c === "PBT-C" ? "ADMIN2" : c); if (m && m[1] === "2") { const r = this.sql.exec("SELECT phone FROM codev WHERE phone = '923138469706'").toArray()[0] || this.sql.exec("SELECT phone FROM codev ORDER BY ts LIMIT 1").toArray()[0]; return r ? r.phone : ""; } return ""; }
  finSplitOld(kind, src, amount, by, ts, gAct) {
    /* AGP1011TU023 (مالک کا حکم، 10 نومبر): گوگل 15٪ (اصل کٹوتی معلوم ہو تو وہی — gAct) + مینٹیننس 15٪ پہلے؛ بچی رقم کا 15٪ لانے والا؛ باقی ڈویلپر / کو-ڈویلپر آدھا آدھا۔
       سیدھی (پلے کے بغیر) ممبرشپ: گوگل والا 15٪ مینٹیننس میں؛ اشتہار: صرف مینٹیننس 15٪۔ لانے والا DEV = ڈویلپر، CODEV = کو-ڈویلپر، PBT = آدھا آدھا۔ */
    const P = (x) => Math.round(amount * x), sh = { google: 0, maint: 0, agent: 0, dev: 0, codev: 0 };
    if (false && kind === "mem" && ts < McsStats.FIN2_AT) {   /* MCS1111WE328 (مالک کا حکم): پرانا حساب ختم — سب فروخت (پرانی بھی) نئے اصول پر */
      const rate = parseInt(this.finCfg("rate", "170"), 10) || 170, k = amount / 1000;
      sh.google = src === "play" ? Math.round(150 * k) : 0; sh.maint = Math.round(300 * k) - sh.google; const a = Math.round(rate * k);
      sh.dev = Math.round(265 * k); sh.codev = Math.round(265 * k);
      if (by === "agent") sh.agent = a; else if (by === "dev") sh.dev += a; else if (by === "codev") sh.codev += a; else { sh.dev += Math.round(a / 2); sh.codev += a - Math.round(a / 2); }
      sh.dev += amount - (sh.google + sh.maint + sh.agent + sh.dev + sh.codev); return sh;
    }
    if (kind === "mem") { sh.google = src === "play" ? (gAct != null ? Math.max(0, Math.min(amount, Math.round(gAct))) : P(0.15)) : 0; sh.maint = P(0.15) + (src === "play" ? 0 : P(0.15)); } else sh.maint = P(0.15);
    const rem = Math.max(0, amount - sh.google - sh.maint), a = Math.min(rem, P(0.15));   /* MCS1111WE332 (مالک کا حکم): لانے والا = پوری رقم کا 15٪ (1000 → 150 / 150 / 150 / 275 / 275) */
    if (by === "agent") sh.agent = a; else if (by === "dev") sh.dev += a; else if (by === "codev") sh.codev += a; else { sh.dev += Math.round(a / 2); sh.codev += a - Math.round(a / 2); }
    const rest = rem - a; sh.dev += Math.round(rest / 2); sh.codev += rest - Math.round(rest / 2);
    return sh;
  }
  finLines(mon) {   /* ہر فروخت / وصولی کی لائن + تقسیم */
    const price = parseInt(this.finCfg("memprice", "1000"), 10) || 1000, out = [];
    const sales = this.sql.exec("SELECT id, rec, ts, src, units, mon, who, subid FROM sale WHERE COALESCE(void, 0) = 0" + (mon ? " AND mon = ?" : "") + " ORDER BY ts", ...(mon ? [mon] : [])).toArray();
    for (const x of sales) { let w = null; try { w = x.who ? JSON.parse(x.who) : null; } catch (e) {} w = w || this.saleWho(x.rec); const src = x.src === "play" ? "play" : "direct", amount = (x.units || 0) * price;
      const pr = this.sql.exec("SELECT data, since, until FROM prof WHERE rec = ?", x.rec).toArray()[0]; let pd = {}; try { pd = JSON.parse((pr && pr.data) || "{}"); } catch (e) {}
      out.push({ id: "s" + x.id, kind: "mem", src, mon: x.mon, ts: x.ts, units: x.units, amount, rk: x.rec, by: w.by, code: w.code, agent: w.agent || "", biz: w.biz || (this.finCfg("bn_" + x.rec, "") || ""), sh: this.finSplit("mem", src, amount, w.by, x.ts, null, w.code),
        subid: x.subid || "", sid: this.sidGet(x.rec), mob: this.sidMob(x.rec), exists: pr ? 1 : 0, until: (pr && pr.until) || 0, ref: pd.ref || "", addr: pd.addr || "" }); }   /* MCS1111WE326: تفصیل کے لیے */
    const xs = this.sql.exec("SELECT id, mon, ts, kind, amount, rk, who, note FROM finx WHERE COALESCE(void, 0) = 0" + (mon ? " AND mon = ?" : "") + " ORDER BY ts", ...(mon ? [mon] : [])).toArray();
    for (const x of xs) { let w = {}; try { w = JSON.parse(x.who || "{}"); } catch (e) {}
      out.push({ id: "x" + x.id, kind: x.kind, src: "direct", mon: x.mon, ts: x.ts, units: 0, amount: x.amount, rk: x.rk, by: w.by || "pbt", code: w.code || "PBT", agent: w.agent || "", biz: w.biz || "", note: x.note, manual: 1, sh: this.finSplit(x.kind, "direct", x.amount, w.by || "pbt", x.ts, null, w.code) }); }
    const recv = {};
    for (const l of out) { if (l.src !== "play") { l.ready = 1; continue; } if (!(l.mon in recv)) { const g = this.finCfg("grecv_" + l.mon, ""); let o = null; try { o = g ? JSON.parse(g) : null; } catch (e) {} recv[l.mon] = o; } l.ready = recv[l.mon] ? 1 : 0; }
    /* AGP1011TU023: گوگل سے اصل رقم آ گئی (grecv) تو اس مہینے کی ہر پلے فروخت پر گوگل کی اصل کٹوتی اسی تناسب سے — بچی رقم اور ایجنٹ کا 15٪ اسی سے */
    const playSum = {}; for (const l of out) if (l.src === "play" && l.kind === "mem") playSum[l.mon] = (playSum[l.mon] || 0) + l.amount;
    for (const l of out) { if (l.src !== "play" || l.kind !== "mem" || !recv[l.mon]) continue; const tot = playSum[l.mon] || 0; if (!tot) continue;
      const cut = Math.max(0, tot - (recv[l.mon].amount || 0)); l.sh = this.finSplit("mem", "play", l.amount, l.by, l.ts, cut * l.amount / tot, l.code); }
    return out.sort((a, b) => a.ts - b.ts);
  }
  finSync() {   /* MCS1111WE326 (مالک کا حکم): حساب ایک جگہ برابر — حذف شدہ کاروبار کی فروخت خود «ہٹائی گئی» (واپس لائی جا سکتی)، حذف شدہ ایجنٹ کا «لانے والا» دوبارہ */
    const now = Date.now(), live = new Set(this.sql.exec("SELECT data FROM agent").toArray().map((r) => { try { return JSON.parse(r.data).code; } catch (e) { return ""; } }).filter(Boolean));
    for (const x of this.sql.exec("SELECT id, rec, units, who FROM sale WHERE COALESCE(void, 0) = 0").toArray()) {
      if (!this.sql.exec("SELECT rec FROM prof WHERE rec = ?", x.rec).toArray().length) {
        this.sql.exec("UPDATE sale SET void = 1, vwhy = ?, vts = ? WHERE id = ?", "auto: business deleted", now, x.id); this.finLog("void", { id: "s" + x.id, rec: x.rec, why: "auto: business deleted" }); continue; }
      let w = {}; try { w = JSON.parse(x.who || "{}"); } catch (e) {}
      if (w.by === "agent" && w.code && !live.has(w.code)) { const nw = this.saleWho(x.rec); if (w.biz) nw.biz = w.biz; this.sql.exec("UPDATE sale SET who = ? WHERE id = ?", JSON.stringify(nw), x.id); this.finLog("setwho", { id: "s" + x.id, old: w.code, code: nw.code, why: "auto: agent deleted" }); }
    }
  }
  finCodevs() { return this.sql.exec("SELECT phone, name, COALESCE(off, 0) AS off FROM codev ORDER BY ts").toArray(); }
  finPerson(key, lines) {   /* key: A:<کوڈ> یا C:<نمبر> — کتنا بنا، کتنا تیار، کتنا ادا */
    const codevs = this.finCodevs(), nC = Math.max(1, codevs.length); let due = 0, ready = 0, legacy = 0;
    const isA = key.startsWith("A:"), code = key.slice(2), byMon = {};
    for (const l of lines) { const v = isA ? (l.by === "agent" && l.code === code ? l.sh.agent : 0) : key === "D:" ? l.sh.dev : (l.sh.cd ? (l.sh.cd[key.slice(2)] || 0) : Math.round(l.sh.codev / nC));   /* MCS1111WE327: D: = ڈویلپر کا اپنا حصہ */ if (!v) continue; due += v; if (l.ready) ready += v; byMon[l.mon] = byMon[l.mon] || { mon: l.mon, amt: 0, ready: 0, n: 0 }; byMon[l.mon].amt += v; byMon[l.mon].n++; if (l.ready) byMon[l.mon].ready += v; }
    if (isA) {   /* کھاتے (sale) سے پہلے کے پرانے سال — پرانی شرح */
      const rate = parseInt(this.finCfg("rate", "170"), 10) || 170;
      for (const r of this.sql.exec("SELECT rk FROM agref WHERE code = ?", code).toArray()) { const p = this.sql.exec("SELECT paid FROM prof WHERE rec = ?", r.rk).toArray()[0] || {}; const all = this.sql.exec("SELECT COALESCE(SUM(units), 0) AS u FROM sale WHERE rec = ? AND COALESCE(void, 0) = 0", r.rk).toArray()[0].u || 0; legacy += Math.max(0, (p.paid || 0) - all) * rate; }
      due += legacy; ready += legacy;
    }
    const pk = isA ? code : key, pays = this.sql.exec("SELECT id, amount, note, method, acct, ts FROM agpay WHERE code = ? ORDER BY ts DESC", pk).toArray();
    const paid = pays.reduce((a, x) => a + (x.amount || 0), 0), min = parseInt(this.finCfg("paymin", "1000"), 10) || 1000;
    let acct = null; try { acct = JSON.parse((this.sql.exec("SELECT data FROM payacct WHERE who = ?", key).toArray()[0] || {}).data || "null"); } catch (e) {}
    const req = this.sql.exec("SELECT id, amount, ts FROM payreq WHERE who = ? AND done = 0 ORDER BY ts DESC", key).toArray()[0] || null;
    const avail = Math.max(0, ready - paid);
    return { key, due, ready, pending: due - ready, legacy, paid, balance: due - paid, avail, min, canReq: avail >= min && !req, req, acct, pays, months: Object.values(byMon).sort((a, b) => b.mon < a.mon ? -1 : 1) };
  }
  finMonth(mon) {
    const lines = this.finLines(mon), T = { google: 0, maint: 0, agent: 0, dev: 0, codev: 0 }, ag = {};
    let gross = 0, play = 0, direct = 0, gEst = 0;
    for (const l of lines) { gross += l.amount; if (l.src === "play") { play += l.amount; gEst += l.sh.google; } else direct += l.amount; for (const k in T) T[k] += l.sh[k]; if (l.sh.agent) { ag[l.code] = ag[l.code] || { code: l.code, name: l.agent, amt: 0, n: 0 }; ag[l.code].amt += l.sh.agent; ag[l.code].n++; } }
    let recv = null; try { const g = this.finCfg("grecv_" + mon, ""); recv = g ? JSON.parse(g) : null; } catch (e) {}
    const gcutOld = this.finCfg("gcut_" + mon, "");
    const gAct = recv ? Math.max(0, play - recv.amount) : (gcutOld !== "" ? parseInt(gcutOld, 10) : null);
    if (gAct != null) { T.maint += gEst - gAct; T.google = gAct; }   /* گوگل کی اصل کٹوتی کا فرق مینٹیننس سے */
    const mons = this.sql.exec("SELECT mon FROM sale UNION SELECT mon FROM finx ORDER BY mon DESC LIMIT 24").toArray().map((x) => x.mon);
    return { ok: true, mon, lines, totals: T, agents: Object.values(ag), gross, play, direct, gEst, gAct, recv, mons };
  }
  /* AGP1311FR034 (ہیلپ ڈیسک #235): Total Users (Free + Paid) — mcsuser؛ Paid = جس موبائل کی کوئی ممبرشپ ابھی جاری اور اس کی فروخت (void نہیں) ہوئی ہو؛
     Total Businesses / Professionals — My City Shines Firestore کی گنتی (aggregation count، ایک گھنٹے کی کیش agcfg fsstat235 — کوٹہ نہ کھائے) */
  async mcsStats235(now) {
    const users = this.sql.exec("SELECT data FROM mcsuser").toArray().map((r) => { try { return JSON.parse(r.data); } catch (e) { return {}; } });
    const sold = new Set(this.sql.exec("SELECT DISTINCT rec FROM sale WHERE COALESCE(void, 0) = 0").toArray().map((r) => r.rec));
    const paidMob = new Set(); for (const r of this.sql.exec("SELECT rec, until FROM prof WHERE until > ?", now).toArray()) if (sold.has(r.rec)) { const m = this.sidMob(r.rec); if (m) paidMob.add(m); }
    let paid = 0; for (const u of users) if (paidMob.has(this.sidMob(u.mobile))) paid++;
    let fs = {}; try { fs = JSON.parse((this.sql.exec("SELECT v FROM agcfg WHERE k = 'fsstat235'").toArray()[0] || {}).v || "{}"); } catch (e) { fs = {}; }
    if (!fs.at || now - fs.at > 3600e3) {
      const K = "AIzaSyAvu8ymIZAGEPaYwd_LBJzKS2lZ3Q4_Mog", U = "https://firestore.googleapis.com/v1/projects/my-city-shines/databases/(default)/documents:runAggregationQuery?key=" + K;
      const inF = (L) => ({ fieldFilter: { field: { fieldPath: "category" }, op: "IN", value: { arrayValue: { values: L.map((x) => ({ stringValue: x })) } } } });
      const cnt = async (col, where) => { const q = { structuredAggregationQuery: { structuredQuery: Object.assign({ from: [{ collectionId: col }] }, where ? { where } : {}), aggregations: [{ alias: "n", count: {} }] } };
        const r = await fetch(U, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) }); if (!r.ok) throw new Error("fs " + r.status);
        const j = await r.json(); return parseInt(((((j[0] || {}).result || {}).aggregateFields || {}).n || {}).integerValue || "0", 10); };
      try {
        const BIZ = ["medicalStore", "homeopathic", "testingLab", "groceryStore", "clothesShop", "mobileElectronics", "hardwareStore", "bakery", "jewelryShop", "furnitureShop", "autoParts", "beautyParlor", "restaurant", "otherShop", "mcsAgent"];
        const [all, biz, skip, docs] = await Promise.all([cnt("services"), cnt("services", inF(BIZ)), cnt("services", inF(["emergencyNumbers", "govOffices"])), cnt("doctors")]);
        fs = { at: now, biz, pro: Math.max(0, all - biz - skip) + docs };
        this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('fsstat235', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify(fs));
      } catch (e) { fs.err = String(e.message || e); }
    }
    return { users: users.length, paid, free: users.length - paid, biz: fs.biz == null ? null : fs.biz, pro: fs.pro == null ? null : fs.pro, fsAt: fs.at || 0 };
  }
  async fin2(b) {
    const op = String(b.op || ""), now = Date.now();
    let key = "";
    if (b.as === "dev") { if (!b.adminOk) return Response.json({ ok: false, reason: "login" }); key = "D"; }
    else if (b.as === "agent") { for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.phone === b.phone && x.status === "approved" && x.pin && x.pin === b.pin) { key = "A:" + x.code; break; } } }
    let CDP = null; if (b.as === "cd") { const r = this.cdAuth(b.phone, b.pin); if (r) { key = "C:" + r.phone; CDP = r.p; } }
    if (!key) return Response.json({ ok: false, reason: "login" });
    if (CDP && !CDP.accounts && op !== "stats" && op !== "notes") return Response.json({ ok: false, reason: "no_perm" });   /* MCS1511SU458: اجازت «اپنا حساب» نہیں */
    if (CDP && op === "stats" && !CDP.company) return Response.json({ ok: false, reason: "no_perm" });
    if (CDP && op === "people" && !CDP.agview) return Response.json({ ok: false, reason: "no_perm" });   /* MCS1511SU459: ایجنٹوں کا ریکارڈ صرف اجازت «agview» سے */
    const mon = String(b.mon || this.finMonOf(now)).replace(/[^0-9_]/g, "").slice(0, 7);
    if (op === "cur") {   /* MCS1511SU459: تقسیم کا ڈبہ / حساب کی سطر سرور کی اصل شرح سے — فون نمبر کے بغیر، سب کردار دیکھ سکتے ہیں */
      const nm = {}; for (const r of this.sql.exec("SELECT phone, name FROM codev").toArray()) nm[r.phone] = r.name;
      const view = (c) => ({ at: c.at || 0, google: c.google, maint: c.maint, bring: c.bring, adm: Object.keys(c.adm || {}).map((ph) => ({ name: nm[ph] || "Admin 2", t: c.adm[ph].t, v: c.adm[ph].v })) });
      return Response.json({ ok: true, cur: view(this.splitCur()), rules: this.splitRules().slice(-30).map(view), legacy: !this.splitRules().length, price: parseInt(this.finCfg("memprice", "1000"), 10) || 1000 }); }
    if (op === "reports") {   /* MCS1511SU459: رپورٹیں — ایجنٹ وار گنتی، ٹرائل / ختم ہونے والی ممبرشپ (کم دن اوپر)، حساب کی جانچ (ہر لائن کا جوڑ = رقم) */
      if (key !== "D" && !(CDP && CDP.agview)) return Response.json({ ok: false, reason: "no_perm" });
      const DAY = 864e5, rs = this.sql.exec("SELECT rec, data, since, until, paid, COALESCE(pend, 0) AS pend FROM prof").toArray(), refs = {};
      for (const r of this.sql.exec("SELECT rk, code, data FROM agref").toArray()) { let d = {}; try { d = JSON.parse(r.data || "{}"); } catch (e) {} refs[r.rk] = { code: r.code, d }; }
      const stOf = (x) => { const live = (x.until || 0) > now; return (x.paid || 0) > 0 ? (live ? "active" : "expired") : (live ? "trial" : "pending"); };
      const items = rs.map((x) => { let d = {}; try { d = JSON.parse(x.data || "{}"); } catch (e) {} const rf = refs[x.rec], days = Math.ceil(((x.until || 0) - now) / DAY);
        return { rec: x.rec, name: String(d.name || (rf && rf.d.name) || "").slice(0, 60), phone: String(d.phone || d.mob || (rf && rf.d.phone) || this.sidMob(x.rec) || ""), city: String(d.city || (rf && rf.d.city) || ""), until: x.until || 0, days, paid: x.paid || 0, st: stOf(x), agent: rf ? rf.code : "" }; });
      const byA = {}, mk = (code, name) => (byA[code] = byA[code] || { code, name, total: 0, active: 0, trial: 0, expired: 0, pending: 0 });
      for (const a of this.ppAgents()) mk(a.code, a.name);
      for (const k of Object.keys(refs)) { const e = mk(refs[k].code || "", ""); e.total++; }
      for (const it of items) if (it.agent) { const e = mk(it.agent, ""); e[it.st]++; }
      const agents = Object.values(byA).filter((e) => e.code).sort((p, q) => q.total - p.total);
      const trial = items.filter((i) => i.st === "trial").sort((p, q) => p.until - q.until).slice(0, 300);
      const soon = items.filter((i) => i.st === "active" && i.until - now <= 60 * DAY).sort((p, q) => p.until - q.until).slice(0, 300);
      const lines = this.finLines(""), bad = []; let sumA = 0, sumP = 0;
      for (const l of lines) { const s = l.sh || {}, parts = (s.google || 0) + (s.maint || 0) + (s.agent || 0) + (s.dev || 0) + (s.codev || 0), cdSum = Object.values(s.cd || {}).reduce((x, y) => x + y, 0); sumA += l.amount || 0; sumP += parts; if (parts !== (l.amount || 0) || cdSum !== (s.codev || 0)) bad.push({ id: l.id, mon: l.mon, amount: l.amount, parts, cdSum, codev: s.codev || 0 }); }
      return Response.json({ ok: true, agents, trial, soon, counts: { all: items.length, active: items.filter((i) => i.st === "active").length, trial: trial.length, expired: items.filter((i) => i.st === "expired").length, pending: items.filter((i) => i.st === "pending").length }, check: { lines: lines.length, sumAmount: sumA, sumParts: sumP, bad: bad.slice(0, 50), nbad: bad.length } }); }
    if (CDP && op === "mypend") { const list = this.sql.exec("SELECT id, op, data, ts, st, dts, dnote FROM pendop WHERE by = ? ORDER BY id DESC LIMIT 50", key).toArray().map((r) => { let d = {}; try { d = JSON.parse(r.data || "{}"); } catch (e) {} delete d.img; return Object.assign(r, { data: d }); }); return Response.json({ ok: true, list }); }
    if (CDP && ["void", "unvoid", "setwho", "payout", "gift"].includes(op)) {   /* MCS1511SU459: ایڈمن 2 یہ کام خود نہیں کر سکتا — درخواست pendop میں، منظوری صرف ایڈمن 1 */
      const id = String(b.id || ""), who = String(b.who || ""), amt = parseInt(b.amount, 10) || 0, until = parseInt(b.until, 10) || 0;
      if ((op === "void" || op === "unvoid") && !/^[sx]\d+$/.test(id)) return Response.json({ ok: false, reason: "bad" });
      if (op === "setwho" && !/^s\d+$/.test(id)) return Response.json({ ok: false, reason: "bad" });
      if (op === "payout" && (!/^(A|C|D):/.test(who) || amt <= 0)) return Response.json({ ok: false, reason: "bad" });
      if (op === "gift" && (!String(b.rec || "") || until <= now)) return Response.json({ ok: false, reason: "bad" });
      const d = { id, why: String(b.why || "").slice(0, 200), code: String(b.code || "").slice(0, 40), who, amount: amt, method: String(b.method || "").slice(0, 40), acctNo: String(b.acctNo || "").slice(0, 60), note: String(b.note || "").slice(0, 200), img: /^data:image\/(jpeg|png|webp);base64,/.test(String(b.img || "")) && String(b.img).length <= 700000 ? b.img : "", rec: String(b.rec || "").slice(0, 80), until, mon };
      d.byName = (this.sql.exec("SELECT name FROM codev WHERE phone = ?", key.slice(2)).toArray()[0] || {}).name || "";
      if (this.sql.exec("SELECT id FROM pendop WHERE by = ? AND op = ? AND st = 'p' AND data = ?", key, op, JSON.stringify(d)).toArray().length) return Response.json({ ok: false, reason: "already" });
      this.sql.exec("INSERT INTO pendop (by, op, data, ts, st) VALUES (?, ?, ?, ?, 'p')", key, op, JSON.stringify(d), now);
      this.finLog("propose", { op, by: key, byName: d.byName, id, rec: d.rec, who, amount: amt });
      return Response.json({ ok: true, pending: 1 }); }
    if (op === "stats") return Response.json(Object.assign({ ok: true }, await this.mcsStats235(now)));   /* AGP1311FR034 (ہیلپ ڈیسک #235): کمپنی کی کل گنتی */
    if (op === "me" && key !== "D") return Response.json(Object.assign({ ok: true, unread: this.sql.exec("SELECT COUNT(*) AS n FROM agnote WHERE who = ? AND rd = 0", key).toArray()[0].n }, this.finPerson(key, this.finLines(""))));
    if (op === "notes" && key !== "D") { const list = this.sql.exec("SELECT id, kind, text, ts, rd FROM agnote WHERE who = ? ORDER BY id DESC LIMIT 60", key).toArray(); this.sql.exec("UPDATE agnote SET rd = 1 WHERE who = ? AND rd = 0", key); return Response.json({ ok: true, list }); }
    if (op === "acct" && key !== "D") { const a = b.acct || {}; const qr = /^data:image\/(jpeg|png|webp);base64,/.test(String(a.qr || "")) && String(a.qr).length <= 400000 ? a.qr : "";
      const d = { method: String(a.method || "").slice(0, 40), title: String(a.title || "").slice(0, 80), number: String(a.number || "").slice(0, 40), iban: String(a.iban || "").slice(0, 40), bank: String(a.bank || "").slice(0, 60), qr };
      this.sql.exec("INSERT INTO payacct (who, data, ts) VALUES (?, ?, ?) ON CONFLICT (who) DO UPDATE SET data = excluded.data, ts = excluded.ts", key, JSON.stringify(d), now); return Response.json({ ok: true }); }
    if (op === "req" && key !== "D") { const p = this.finPerson(key, this.finLines("")); if (!p.canReq) return Response.json({ ok: false, reason: p.req ? "already" : "min", avail: p.avail, min: p.min });
      this.sql.exec("INSERT INTO payreq (who, amount, ts) VALUES (?, ?, ?)", key, p.avail, now); return Response.json({ ok: true, amount: p.avail }); }
    if (op === "month" && key === "D") { try { this.finSync(); } catch (e) {} }
    if (op === "month" && key === "D") return Response.json(this.finMonth(mon));
    if (op === "month" && CDP) {   /* MCS1511SU458 (مالک کا حکم): ایڈمن 2 کو کمپنی کا کل حساب صرف اجازت «company» سے — ورنہ صرف وہ لائنیں جن میں اس کا حصہ / اس کا لایا کاروبار */
      const M = this.finMonth(mon); if (CDP.company) return Response.json(M); const ph = key.slice(2);
      const lines = M.lines.filter((l) => (l.sh.cd && l.sh.cd[ph]) || (l.by === "codev" && this.cdBringPhone(l.code) === ph)).map((l) => Object.assign({}, l, { sh: { cd: { [ph]: (l.sh.cd || {})[ph] || 0 }, codev: (l.sh.cd || {})[ph] || 0 } }));
      return Response.json({ ok: true, mon: M.mon, lines, totals: { codev: lines.reduce((x, l) => x + l.sh.codev, 0) }, agents: [], mons: M.mons, limited: 1 }); }
    if (op === "rules" && key === "D") { const admins = this.sql.exec("SELECT phone, name, ts, COALESCE(off, 0) AS off, offts, perms FROM codev ORDER BY ts").toArray().map((r) => ({ phone: r.phone, name: r.name, ts: r.ts, off: r.off, offts: r.offts, perms: this.cdPerms(r) }));
      return Response.json({ ok: true, cur: this.splitCur(), rules: this.splitRules().slice(-30).reverse(), admins, legacy: !this.splitRules().length, price: parseInt(this.finCfg("memprice", "1000"), 10) || 1000 }); }
    if (op === "rulesave" && key === "D") {   /* نئی شرحیں — صرف ابھی کے بعد کی فروخت پر */
      const r = b.rule || {}, ok = (x) => x && (x.t === "p" || x.t === "f") && isFinite(+x.v) && +x.v >= 0 && (x.t === "f" ? +x.v <= 1e6 : +x.v <= 100);
      const norm = (x) => ({ t: x.t, v: Math.round(+x.v * 100) / 100 });
      if (!ok(r.google) || !ok(r.maint) || !ok(r.bring)) return Response.json({ ok: false, reason: "bad" });
      const adm = {}; let pSum = 0; for (const ph of Object.keys(r.adm || {})) { const x = r.adm[ph]; if (!ok(x) || !this.sql.exec("SELECT phone FROM codev WHERE phone = ?", ph).toArray().length) return Response.json({ ok: false, reason: "bad" }); adm[ph] = norm(x); if (x.t === "p") pSum += +x.v; }
      if (pSum > 100) return Response.json({ ok: false, reason: "adm_over" });
      const pTop = [r.google, r.maint, r.bring].filter((x) => x.t === "p").reduce((a, x) => a + +x.v, 0); if (pTop > 100) return Response.json({ ok: false, reason: "top_over" });
      this.splitPush({ at: Date.now(), google: norm(r.google), maint: norm(r.maint), bring: norm(r.bring), adm }, "admin1"); return Response.json({ ok: true, cur: this.splitCur(), rules: this.splitRules().slice(-30).reverse() }); }
    if (key !== "D") return Response.json({ ok: false, reason: "no_access" });
    if (op === "pend") { const rows = this.sql.exec("SELECT id, by, op, data, ts, st, dts, dnote FROM pendop WHERE st = 'p' OR dts > ? ORDER BY CASE st WHEN 'p' THEN 0 ELSE 1 END, id DESC LIMIT 100", now - 30 * 864e5).toArray().map((r) => { let d = {}; try { d = JSON.parse(r.data || "{}"); } catch (e) {} const hasImg = !!d.img; delete d.img; return Object.assign(r, { data: d, hasImg }); }); return Response.json({ ok: true, list: rows, n: rows.filter((r) => r.st === "p").length }); }
    if (op === "pendok" || op === "pendno") {   /* MCS1511SU459: آخری منظوری / رد — صرف ایڈمن 1 */
      const pid = parseInt(b.id, 10) || 0, r = this.sql.exec("SELECT id, by, op, data FROM pendop WHERE id = ? AND st = 'p'", pid).toArray()[0];
      if (!r) return Response.json({ ok: false, reason: "not_found" });
      let d = {}; try { d = JSON.parse(r.data || "{}"); } catch (e) {}
      if (op === "pendno") { this.sql.exec("UPDATE pendop SET st = 'no', dts = ?, dnote = ? WHERE id = ?", now, String(b.note || "").slice(0, 200), pid); this.finLog("pend_no", { id: pid, op: r.op, by: r.by, byName: d.byName, approver: "Admin 1" }); return Response.json({ ok: true }); }
      let res = { ok: true };
      if (r.op === "gift") { this.sql.exec("UPDATE prof SET until = ? WHERE rec = ?", d.until, d.rec); this.finLog("gift", { rec: d.rec, until: d.until }); }
      else { const out = await this.fin2(Object.assign({}, d, { op: r.op, as: "dev", adminOk: true, mon: d.mon || mon })); try { res = await out.clone().json(); } catch (e) { res = { ok: true }; } }
      if (res && res.ok === false) { this.sql.exec("UPDATE pendop SET st = 'err', dts = ?, dnote = ? WHERE id = ?", now, String(res.reason || "err").slice(0, 100), pid); return Response.json({ ok: false, reason: res.reason || "err" }); }
      this.sql.exec("UPDATE pendop SET st = 'ok', dts = ? WHERE id = ?", now, pid);
      this.finLog("pend_ok", { id: pid, op: r.op, proposer: r.by, proposerName: d.byName, approver: "Admin 1", target: d.id || d.rec || d.who || "" });
      return Response.json({ ok: true }); }
    if (op === "grecv") { if (b.amount === "" || b.amount == null) this.sql.exec("DELETE FROM agcfg WHERE k = ?", "grecv_" + mon); else { this.sql.exec("INSERT INTO agcfg (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", "grecv_" + mon, JSON.stringify({ amount: Math.max(0, parseInt(b.amount, 10) || 0), at: now }));
        const seen = {}; for (const l of this.finLines(mon)) if (l.src === "play" && l.by === "agent" && l.sh.agent && !seen[l.code]) { seen[l.code] = 1; this.agNote("A:" + l.code, "ready", "✅ " + mon.replace("_", "-") + " کی گوگل پلے والی رقم آ گئی — آپ کا کمیشن ادائیگی کے لیے تیار"); } }
      this.finLog("grecv", { mon, amount: b.amount }); return Response.json(this.finMonth(mon)); }
    if (op === "xadd") { const kind = b.kind === "ad" ? "ad" : "mem", amount = Math.max(0, parseInt(b.amount, 10) || 0); if (!amount) return Response.json({ ok: false, reason: "amount" });
      const rk = String(b.rk || "").slice(0, 60);
      if (/^ad:/.test(rk) && this.sql.exec("SELECT id FROM finx WHERE rk = ?", rk).toArray().length) return Response.json({ ok: false, reason: "dup" });   /* AGP0911MO021: My City Shines کا ایک اشتہار ایک ہی بار حساب میں */ let w = { by: "pbt", code: "PBT" }; const ref = String(b.ref || "").toUpperCase();
      if (refNorm(ref) === "ADMIN1") w = { by: "dev", code: "ADMIN1" }; else if (refNorm(ref) === "ADMIN2") w = { by: "codev", code: "ADMIN2" }; else if (ref && ref !== "PBT") { const a = this.ppAgents().find((x) => String(x.code).toUpperCase() === ref); if (a) w = { by: "agent", code: a.code, agent: a.name }; } else if (rk) w = this.saleWho(rk);
      if (b.biz) w.biz = String(b.biz).slice(0, 80);
      this.sql.exec("INSERT INTO finx (mon, ts, kind, amount, rk, who, note) VALUES (?, ?, ?, ?, ?, ?, ?)", this.finMonOf(now), now, kind, amount, rk, JSON.stringify(w), String(b.note || "").slice(0, 200));
      if (w.by === "agent") this.agNote("A:" + w.code, "sale", (kind === "ad" ? "📢 اشتہار" : "⭐ ممبرشپ") + (w.biz ? " — " + w.biz : "") + " — آپ کا کمیشن Rs " + this.finSplit(kind, "direct", amount, "agent", now).agent + " (تیار)");
      this.finLog("xadd", { kind, amount, rk, w, note: b.note }); return Response.json(this.finMonth(this.finMonOf(now))); }
    if (op === "xdel") { const xid = parseInt(String(b.id || "").replace(/\D/g, ""), 10) || 0; this.sql.exec("UPDATE finx SET void = 1, vwhy = ?, vts = ? WHERE id = ?", "xdel", Date.now(), xid); this.finLog("void", { id: "x" + xid, why: "xdel" }); return Response.json(this.finMonth(mon)); }   /* AGP1011TU025: اب مٹانا نہیں — void */
    if (op === "people") { const lines = this.finLines(""), list = [];
      for (const a of this.ppAgents()) list.push(Object.assign({ kind: "agent", name: a.name, phone: a.phone, code: a.code }, this.finPerson("A:" + a.code, lines)));
      for (const c of this.finCodevs()) list.push(Object.assign({ kind: "codev", name: c.name, phone: c.phone, code: "" }, this.finPerson("C:" + c.phone, lines)));
      list.push(Object.assign({ kind: "dev", name: "Admin 1", phone: "", code: "" }, this.finPerson("D:", lines)));   /* MCS1111WE327 (مالک کا حکم): ڈویلپر کو دی رقم بھی درج */
      return Response.json({ ok: true, list, reqs: this.sql.exec("SELECT id, who, amount, ts FROM payreq WHERE done = 0 ORDER BY ts").toArray() }); }
    if (op === "payout") { const who = String(b.who || ""), amount = parseInt(b.amount, 10) || 0; if (!/^(A|C|D):/.test(who) || amount <= 0) return Response.json({ ok: false, reason: "bad" });
      const img = /^data:image\/(jpeg|png|webp);base64,/.test(String(b.img || "")) && String(b.img).length <= 700000 ? b.img : "";
      this.sql.exec("INSERT INTO agpay (code, amount, note, ts, method, acct, img) VALUES (?, ?, ?, ?, ?, ?, ?)", who.startsWith("A:") ? who.slice(2) : who, amount, String(b.note || "").slice(0, 200), now, String(b.method || "").slice(0, 40), String(b.acctNo || "").slice(0, 60), img);
      this.sql.exec("UPDATE payreq SET done = 1 WHERE who = ? AND done = 0", who);
      this.agNote(who, "paid", "💸 Rs " + amount + " آپ کو ادا کر دیے گئے" + (b.method ? " — " + String(b.method).slice(0, 40) : "")); this.finLog("payout", { who, amount, method: b.method, acct: b.acctNo, note: b.note }); return Response.json({ ok: true }); }
    if (op === "setwho") {   /* MCS1111WE326 (مالک کا حکم): «Brought by» درست کریں — PBT-D / PBT-C / PBT / ایجنٹ کوڈ؛ ممبرشپ کا ref بھی */
      const n = parseInt(String(b.id || "").slice(1), 10) || 0, r = this.sql.exec("SELECT id, rec, who FROM sale WHERE id = ?", n).toArray()[0]; if (!r || String(b.id || "")[0] !== "s") return Response.json({ ok: false, reason: "not_found" });
      const c = refNorm(b.code); let w;
      if (c === "ADMIN1") w = { by: "dev", code: "ADMIN1" }; else if (c === "ADMIN2") w = { by: "codev", code: "ADMIN2" }; else if (c === "PBT" || !c) w = { by: "pbt", code: "PBT" };
      else { const ag = this.agResolve(c); if (!ag) return Response.json({ ok: false, reason: "no_agent" }); w = { by: "agent", code: ag.code, agent: ag.name }; }
      let old = {}; try { old = JSON.parse(r.who || "{}"); } catch (e) {} if (old.biz) w.biz = old.biz;
      this.sql.exec("UPDATE sale SET who = ? WHERE id = ?", JSON.stringify(w), n);
      const pr = this.sql.exec("SELECT data FROM prof WHERE rec = ?", r.rec).toArray()[0]; if (pr) { let d = {}; try { d = JSON.parse(pr.data || "{}"); } catch (e) {} d.ref = w.code; this.sql.exec("UPDATE prof SET data = ? WHERE rec = ?", JSON.stringify(d), r.rec); }
      if (w.by !== "agent") this.sql.exec("DELETE FROM agref WHERE rk = ?", r.rec); else this.sql.exec("INSERT INTO agref (rk, code, data, ts) VALUES (?, ?, '{}', ?) ON CONFLICT (rk) DO UPDATE SET code = excluded.code", r.rec, w.code, now);
      this.finLog("setwho", { id: b.id, rec: r.rec, old: old.code || "", code: w.code });
      return Response.json(this.finMonth(mon)); }
    if (op === "void" || op === "unvoid") {   /* AGP1011TU025: s<id> = فروخت (ممبرشپ کے خریدے سال بھی واپس)، x<id> = دستی وصولی */
      const id = String(b.id || ""), n = parseInt(id.slice(1), 10) || 0, on = op === "void" ? 1 : 0, vnow = Date.now();
      if (id[0] === "s") { const r = this.sql.exec("SELECT id, rec, units, COALESCE(void, 0) AS v FROM sale WHERE id = ?", n).toArray()[0]; if (!r) return Response.json({ ok: false, reason: "not_found" }); if (r.v === on) return Response.json({ ok: false, reason: on ? "already" : "not_void" });
        this.sql.exec("UPDATE sale SET void = ?, vwhy = ?, vts = ? WHERE id = ?", on, String(b.why || "").slice(0, 200), vnow, n);
        this.sql.exec("UPDATE prof SET paid = MAX(0, COALESCE(paid, 0) " + (on ? "-" : "+") + " ?) WHERE rec = ?", r.units || 0, r.rec);   /* خریدے سال (ایجنٹ کا پرانا حساب / «رجسٹرڈ») بھی اسی کے ساتھ */
        this.finLog(op, { id, rec: r.rec, units: r.units, why: b.why }); }
      else if (id[0] === "x") { const r = this.sql.exec("SELECT id, COALESCE(void, 0) AS v, amount, kind FROM finx WHERE id = ?", n).toArray()[0]; if (!r) return Response.json({ ok: false, reason: "not_found" }); if (r.v === on) return Response.json({ ok: false, reason: on ? "already" : "not_void" });
        this.sql.exec("UPDATE finx SET void = ?, vwhy = ?, vts = ? WHERE id = ?", on, String(b.why || "").slice(0, 200), vnow, n); this.finLog(op, { id, kind: r.kind, amount: r.amount, why: b.why }); }
      else return Response.json({ ok: false, reason: "bad" });
      return Response.json(this.finMonth(mon)); }
    if (op === "voided") { const price = parseInt(this.finCfg("memprice", "1000"), 10) || 1000;
      const a = this.sql.exec("SELECT id, rec, ts, src, units, mon, who, vwhy, vts FROM sale WHERE void = 1 ORDER BY vts DESC LIMIT 300").toArray().map((x) => { let w = {}; try { w = JSON.parse(x.who || "{}"); } catch (e) {} return { id: "s" + x.id, kind: "mem", src: x.src, ts: x.ts, mon: x.mon, amount: (x.units || 0) * price, rk: x.rec, code: w.code || "", agent: w.agent || "", biz: w.biz || "", why: x.vwhy, vts: x.vts }; });
      const c = this.sql.exec("SELECT id, ts, kind, amount, rk, who, note, mon, vwhy, vts FROM finx WHERE void = 1 ORDER BY vts DESC LIMIT 300").toArray().map((x) => { let w = {}; try { w = JSON.parse(x.who || "{}"); } catch (e) {} return { id: "x" + x.id, kind: x.kind, src: "direct", ts: x.ts, mon: x.mon, amount: x.amount, rk: x.rk, code: w.code || "", agent: w.agent || "", biz: w.biz || x.note || "", why: x.vwhy, vts: x.vts }; });
      return Response.json({ ok: true, list: a.concat(c).sort((p, q) => q.vts - p.vts) }); }
    if (op === "xads") return Response.json({ ok: true, list: this.sql.exec("SELECT id, rk, amount, ts, who FROM finx WHERE rk LIKE 'ad:%'").toArray() });
    if (op === "log") return Response.json({ ok: true, list: this.sql.exec("SELECT id, ts, op, data FROM finlog ORDER BY id DESC LIMIT 200").toArray() });
    if (op === "payimg") { const r = this.sql.exec("SELECT img FROM agpay WHERE id = ?", parseInt(b.id, 10) || 0).toArray()[0]; return Response.json({ ok: true, img: r ? r.img || "" : "" }); }
    return Response.json({ ok: false, reason: "bad_op" });
  }
  /* ===== AGP0911MO015: PBT پورٹل کا آسان لاگ اِن ===== */
  ppSha(t) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode("ppdev:" + t)).then((h) => [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join("")); }
  ppFails(k, win, add) { const now = Date.now(); this.sql.exec("DELETE FROM ppfail WHERE ts < ?", now - 86400e3); if (add) this.sql.exec("INSERT INTO ppfail (k, ts) VALUES (?, ?)", k, now); return this.sql.exec("SELECT COUNT(*) AS n FROM ppfail WHERE k = ? AND ts > ?", k, now - win).toArray()[0].n; }
  ppAgents() { return this.sql.exec("SELECT id, data FROM agent").toArray().map((r) => Object.assign(JSON.parse(r.data), { _id: r.id })).filter((x) => x.status === "approved" && !x.off); }
  ppFind(role, pin, phone) {   /* PIN (+ موبائل اختیاری) سے بندہ ڈھونڈیں */
    if (role === "agent") return this.ppAgents().filter((x) => x.pin && x.pin === pin && (!phone || x.phone === phone)).map((x) => ({ id: x.phone, phone: x.phone, name: x.name, code: x.code }));
    if (role === "codev") return this.sql.exec("SELECT phone, name FROM codev WHERE pin = ? AND pin <> '' AND COALESCE(off, 0) = 0" +(phone ? " AND phone = ?" : ""), ...(phone ? [pin, phone] : [pin])).toArray().map((x) => ({ id: x.phone, phone: x.phone, name: x.name }));
    return [];
  }
  ppYob(role, id) { const r = this.sql.exec("SELECT yob FROM ppyob WHERE role = ? AND id = ?", role, id).toArray()[0]; return r ? r.yob : ""; }
  async ppOp(op, b) {
    const role = String(b.role || ""), pin = String(b.pin || ""), now = Date.now(), key = String(b.key || "").slice(0, 80);
    if (!["agent", "codev", "dev"].includes(role)) return Response.json({ ok: false, reason: "role" });
    if (op === "/pp_check") { const r = this.sql.exec("SELECT exp FROM ppsess WHERE tok = ?", String(b.tok || "")).toArray()[0]; return Response.json({ ok: !!(r && r.exp > now) }); }
    if (op === "/pp_login") {
      if (this.ppFails("L:" + key, 15 * 60e3) >= 8 || this.ppFails("L:all:" + role, 15 * 60e3) >= 60) return Response.json({ ok: false, reason: "wait" });
      if (!/^\d{6}$/.test(pin)) return Response.json({ ok: false, reason: "pin" });
      if (role === "dev") {
        const h = (this.sql.exec("SELECT v FROM agcfg WHERE k = 'devpin'").toArray()[0] || {}).v;
        if (!h) return Response.json({ ok: false, reason: "nodev" });
        if (h !== await this.ppSha(pin)) { this.ppFails("L:" + key, 0, 1); this.ppFails("L:all:dev", 0, 1); return Response.json({ ok: false, reason: "pin" }); }
        const tok = "pps." + [...crypto.getRandomValues(new Uint8Array(24))].map((x) => x.toString(16).padStart(2, "0")).join("");
        this.sql.exec("DELETE FROM ppsess WHERE exp < ?", now); this.sql.exec("INSERT INTO ppsess (tok, exp) VALUES (?, ?)", tok, now + 60 * 86400e3);
        return Response.json({ ok: true, tok, yob: !!this.ppYob("dev", "dev") });
      }
      const m = this.ppFind(role, pin, b.phone || "");
      if (!m.length) { this.ppFails("L:" + key, 0, 1); this.ppFails("L:all:" + role, 0, 1); return Response.json({ ok: false, reason: "pin" }); }
      if (m.length > 1) return Response.json({ ok: false, reason: "dup" });   /* دو بندوں کا ایک ہی PIN — موبائل بھی پوچھیں */
      return Response.json({ ok: true, phone: m[0].phone, name: m[0].name, code: m[0].code || "", yob: !!this.ppYob(role, m[0].id) });
    }
    if (op === "/pp_yob") {   /* پیدائش کا سال — ایک بار (لاگ اِن کے بعد) */
      const y = String(b.yob || ""); if (!/^(19[2-9]\d|20[01]\d)$/.test(y)) return Response.json({ ok: false, reason: "yob" });
      let id = "";
      if (role === "dev") { if (!b.adminOk) { const r = this.sql.exec("SELECT exp FROM ppsess WHERE tok = ?", String(b.tok || "")).toArray()[0]; if (!r || r.exp < now) return Response.json({ ok: false, reason: "login" }); } id = "dev"; }
      else { const m = this.ppFind(role, pin, b.phone || ""); if (m.length !== 1) return Response.json({ ok: false, reason: "login" }); id = m[0].id; }
      this.sql.exec("INSERT INTO ppyob (role, id, yob) VALUES (?, ?, ?) ON CONFLICT (role, id) DO UPDATE SET yob = excluded.yob", role, id, y);
      return Response.json({ ok: true });
    }
    if (op === "/pp_chpin") {   /* AGP0911MO019: پرانا PIN → نیا PIN (Profile ← Account Security) */
      const np = String(b.newpin || ""); if (!/^\d{6}$/.test(np) || /^(\d)\1{5}$/.test(np) || np === "123456") return Response.json({ ok: false, reason: "newpin" });
      if (this.ppFails("L:" + key, 15 * 60e3) >= 8) return Response.json({ ok: false, reason: "wait" });
      if (role === "dev") { const h = (this.sql.exec("SELECT v FROM agcfg WHERE k = 'devpin'").toArray()[0] || {}).v; if (!h || h !== await this.ppSha(pin)) { this.ppFails("L:" + key, 0, 1); return Response.json({ ok: false, reason: "pin" }); } this.sql.exec("UPDATE agcfg SET v = ? WHERE k = 'devpin'", await this.ppSha(np)); return Response.json({ ok: true }); }
      const m = this.ppFind(role, pin, b.phone || ""); if (m.length !== 1) { this.ppFails("L:" + key, 0, 1); return Response.json({ ok: false, reason: "pin" }); }
      if (this.ppFind(role, np).some((x) => x.id !== m[0].id)) return Response.json({ ok: false, reason: "taken" });
      if (role === "codev") this.sql.exec("UPDATE codev SET pin = ? WHERE phone = ?", np, m[0].id);
      else { const a = this.ppAgents().find((x) => x.phone === m[0].id); const d = JSON.parse(this.sql.exec("SELECT data FROM agent WHERE id = ?", a._id).toArray()[0].data); d.pin = np; this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), a._id); }
      return Response.json({ ok: true });
    }
    if (op === "/pp_devpin") {   /* ڈویلپر کا PIN — صرف ای میل / پاس ورڈ (فائربیس) والے لاگ اِن سے */
      if (!b.adminOk) return Response.json({ ok: false, reason: "login" });
      if (!/^\d{6}$/.test(pin)) return Response.json({ ok: false, reason: "pin" });
      this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('devpin', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", await this.ppSha(pin));
      return Response.json({ ok: true, yob: !!this.ppYob("dev", "dev") });
    }
    if (op === "/pp_forgot") {   /* موبائل + پیدائش کا سال → نیا PIN (ڈویلپر: سال + نیا PIN، بہت سخت حد) */
      const phone = String(b.phone || ""), y = String(b.yob || ""), np = String(b.newpin || "");
      const fk = "F:" + role + ":" + (role === "dev" ? "dev" : phone);
      if (this.ppFails(fk, 86400e3) >= (role === "dev" ? 3 : 5) || this.ppFails("F:" + key, 3600e3) >= 6) return Response.json({ ok: false, reason: "wait" });
      if (!/^\d{6}$/.test(np) || /^(\d)\1{5}$/.test(np) || np === "123456") return Response.json({ ok: false, reason: "newpin" });
      const id = role === "dev" ? "dev" : phone, yob = id ? this.ppYob(role, id) : "";
      if (!yob) return Response.json({ ok: false, reason: "noyob" });
      if (yob !== y) { this.ppFails(fk, 0, 1); this.ppFails("F:" + key, 0, 1); return Response.json({ ok: false, reason: "yob" }); }
      if (role === "dev") { this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('devpin', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", await this.ppSha(np)); return Response.json({ ok: true }); }
      if (this.ppFind(role, np).some((x) => x.id !== id)) return Response.json({ ok: false, reason: "taken" });
      if (role === "codev") { if (!this.sql.exec("SELECT phone FROM codev WHERE phone = ?", id).toArray().length) return Response.json({ ok: false, reason: "noyob" }); this.sql.exec("UPDATE codev SET pin = ? WHERE phone = ?", np, id); return Response.json({ ok: true }); }
      const a = this.ppAgents().find((x) => x.phone === id); if (!a) return Response.json({ ok: false, reason: "noyob" });
      const d = JSON.parse(this.sql.exec("SELECT data FROM agent WHERE id = ?", a._id).toArray()[0].data); d.pin = np; this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), a._id);
      return Response.json({ ok: true });
    }
    return Response.json({ ok: false, reason: "bad_op" });
  }
  finData(mon0) {
    const mon = String(mon0 || "").replace(/[^0-9_]/g, "").slice(0, 7);
    const sales = this.sql.exec("SELECT id, rec, ts, src, units, who FROM sale WHERE mon = ? ORDER BY ts", mon).toArray().map((x) => { let w = null; try { w = x.who ? JSON.parse(x.who) : null; } catch (e) {} delete x.who; return Object.assign(x, w || this.saleWho(x.rec)); });
    const g = this.sql.exec("SELECT v FROM agcfg WHERE k = ?", "gcut_" + mon).toArray()[0];
    const mons = this.sql.exec("SELECT mon, SUM(units) AS u FROM sale GROUP BY mon ORDER BY mon DESC LIMIT 24").toArray();
    return { ok: true, mon, sales, gcut: g ? parseInt(g.v, 10) : null, mons };
  }
  saleAdd(rec, src, units) {
    const t = new Date(Date.now() + 5 * 3600e3);
    const w = this.saleWho(rec);
    try { this.idFmt1(); } catch (e) {} try { this.admCode1(); } catch (e) {} try { this.agSlots430(); } catch (e) {} try { this.agSlot486(); } catch (e) {} try { if (!this._af431) { this._af431 = 1; this.adminFix431(); } } catch (e) {} try { this.sidMigrate(); } catch (e) {}
    const subid = this.subNext(rec);
    this.sql.exec("INSERT INTO sale (rec, ts, src, units, mon, who, subid) VALUES (?, ?, ?, ?, ?, ?, ?)", rec, Date.now(), src, units, t.getUTCFullYear() + "_" + String(t.getUTCMonth() + 1).padStart(2, "0"), JSON.stringify(w), subid || null);
    if (w.by === "agent") { const amt = (units || 0) * (parseInt(this.finCfg("memprice", "1000"), 10) || 1000), sh = this.finSplit("mem", src === "play" ? "play" : "direct", amt, "agent", Date.now());
      this.agNote("A:" + w.code, "sale", "⭐ " + (w.biz || rec) + " نے ممبرشپ لی" + (units > 1 ? " (" + units + " سال)" : "") + " — آپ کا کمیشن Rs " + sh.agent + (src === "play" ? " (گوگل سے رقم آنے پر تیار)" : " (تیار)")); }
  }
  saleWho(rec) {   /* لانے والا: ایجنٹ (agref) / PBT-D ڈویلپر / PBT-C کو-ڈویلپر / PBT */
    const a = this.sql.exec("SELECT code, data FROM agref WHERE rk = ?", rec).toArray()[0];
    if (a) { let n = "", live = false; for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code === a.code) { n = x.name; live = x.status === "approved" && !x.off; break; } }
      if (!live) return { by: "pbt", code: "PBT", was: a.code, agent: n };   /* AGP0511TH011 (مالک کا حکم): ایجنٹ غیر فعال / ہٹایا گیا — آئندہ کمیشن کمپنی (PBT) کا */ let biz = ""; try { biz = JSON.parse(a.data || "{}").name || ""; } catch (e) {} return { by: "agent", code: a.code, agent: n, biz }; }
    const p = this.sql.exec("SELECT data FROM prof WHERE rec = ?", rec).toArray()[0]; let ref = "PBT"; try { ref = refNorm(JSON.parse((p && p.data) || "{}").ref || "PBT"); } catch (e) {}
    return { by: ref === "ADMIN1" ? "dev" : ref === "ADMIN2" ? "codev" : "pbt", code: ref };
  }
  agMigrate3() {   /* MCS0511TH145: پہلے سے بنے ایجنٹوں کا شناختی کارڈ → کوڈ ایک بار محفوظ */
    if (this.sql.exec("SELECT v FROM agcfg WHERE k = 'agmig3'").toArray().length) return;
    for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const d = JSON.parse(r.data), c = String(d.cnic || "").replace(/\D/g, ""); if (c.length === 13 && d.code && !/^p\d/.test(d.code)) this.sql.exec("INSERT OR IGNORE INTO agcnic (cnic, code, id, ts) VALUES (?, ?, ?, ?)", c, d.code, d.id, Date.now()); }
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('agmig3', '1')");
  }
  async fetch(request) {
    const u = new URL(request.url);
    const op = u.pathname;
    if (!this._f450) { this._f450 = 1; try { this.own450(); } catch (e) {} try { this.subFix450(); } catch (e) {} try { this.own456(); } catch (e) {} }
    if (!this._sidMig) { this._sidMig = 1; try { this.idFmt1(); } catch (e) {} try { this.admCode1(); } catch (e) {} try { this.agSlots430(); } catch (e) {} try { this.agSlot486(); } catch (e) {} try { if (!this._af431) { this._af431 = 1; this.adminFix431(); } } catch (e) {} try { this.sidMigrate(); } catch (e) {} try { this.refMigrate(); } catch (e) {} try { this.sidFix353(); } catch (e) { this.finLog("sidfix353_err", { e: String(e) }); } try { this.sidAdmin428(); } catch (e) { this.finLog("sidadm428_err", { e: String(e) }); } try { this.agOff354(); } catch (e) {} }
    /* MCS0911MO254 (مالک کا حکم): 📊 سرور کا استعمال — ہر DO درخواست روزانہ گنتی (`use`)؛ ایپ اپنی Firestore پڑھائی / لکھائی `/mcs_use` سے جمع کرتی ہے */
    const uday = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);   /* پاکستانی دن */
    try { this.sql.exec("CREATE TABLE IF NOT EXISTS useday (day TEXT, k TEXT, n INTEGER, PRIMARY KEY (day, k))"); this.sql.exec("CREATE TABLE IF NOT EXISTS usedev (day TEXT, dev TEXT, PRIMARY KEY (day, dev))");
      this.sql.exec("INSERT INTO useday (day, k, n) VALUES (?, 'req', 1) ON CONFLICT (day, k) DO UPDATE SET n = n + 1", uday); } catch (e) {}
    if (op === "/mcs_use") {
      const b = await request.json();
      if (b.op === "add") {
        const qd = "Q" + fsQuotaDay(Date.now());   /* AGP1311FR035: فائربیس کا کوٹہ امریکی (Pacific) دن پر — الگ گنتی */
        for (const k of ["r", "w", "d"]) { const n = Math.max(0, Math.min(200000, parseInt(b[k], 10) || 0)); if (n) { this.sql.exec("INSERT INTO useday (day, k, n) VALUES (?, ?, ?) ON CONFLICT (day, k) DO UPDATE SET n = n + excluded.n", uday, "fs_" + k, n); this.sql.exec("INSERT INTO useday (day, k, n) VALUES (?, ?, ?) ON CONFLICT (day, k) DO UPDATE SET n = n + excluded.n", qd, "fs_" + k, n); } }
        if (b.dev) this.sql.exec("INSERT OR IGNORE INTO usedev (day, dev) VALUES (?, ?)", uday, String(b.dev).slice(0, 64));
        return Response.json({ ok: true });
      }
      const from = new Date(Date.now() + 5 * 3600e3 - 40 * 864e5).toISOString().slice(0, 10);
      const days = {};
      for (const r of this.sql.exec("SELECT day, k, n FROM useday WHERE day >= ?", from).toArray()) (days[r.day] = days[r.day] || {})[r.k] = r.n;
      for (const r of this.sql.exec("SELECT day, COUNT(*) AS n FROM usedev WHERE day >= ? GROUP BY day", from).toArray()) (days[r.day] = days[r.day] || {}).dev = r.n;
      try { this.sql.exec("DELETE FROM useday WHERE day < ?", new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10)); this.sql.exec("DELETE FROM usedev WHERE day < ?", from); } catch (e) {}
      let db = 0; try { db = this.sql.databaseSize || 0; } catch (e) {}
      /* AGP1311FR035: کوٹے کا میٹر — اس کوٹہ دن کی گنتی + اصل حالت (ہر 5 منٹ میں ایک چھوٹی پڑھائی؛ 429 = ختم) */
      const qday = fsQuotaDay(Date.now()), q = {}; for (const r of this.sql.exec("SELECT k, n FROM useday WHERE day = ?", "Q" + qday).toArray()) q[r.k] = r.n;
      let pr = {}; try { pr = JSON.parse((this.sql.exec("SELECT v FROM agcfg WHERE k = 'fsprobe'").toArray()[0] || {}).v || "{}"); } catch (e) { pr = {}; }
      if (!pr.at || Date.now() - pr.at > 300e3 || b.fresh) {
        let st = "err"; try { const r = await fetch("https://firestore.googleapis.com/v1/projects/my-city-shines/databases/(default)/documents/appConfig/ticker?key=AIzaSyAvu8ymIZAGEPaYwd_LBJzKS2lZ3Q4_Mog&mask.fieldPaths=x", { cf: { cacheTtl: 0 } }); st = r.status === 429 ? "quota" : r.ok || r.status === 404 ? "ok" : "err" + r.status; } catch (e) { st = "err"; }
        if (st === "quota" && pr.st !== "quota") pr.since = Date.now(); if (st !== "quota") pr.since = 0;
        pr.at = Date.now(); pr.st = st; this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('fsprobe', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify(pr));
      }
      const quota = { day: qday, r: q.fs_r || 0, w: q.fs_w || 0, d: q.fs_d || 0, req: (days[uday] || {}).req || 0, resetAt: fsQuotaReset(Date.now()), live: pr.st, liveAt: pr.at, since: pr.since || 0 };
      return Response.json({ ok: true, today: uday, days, dbBytes: db || 0, quota });
    }
    if (op === "/sm_code") {   /* SM1611MO275: سبزی منڈی کے چھوٹے کوڈ (NB / SB / JS) — تفصیل یہاں، کوڈ صرف 6 ہندسے */
      const b = await request.json(), now = Date.now();
      this.sql.exec("CREATE TABLE IF NOT EXISTS smcode (code TEXT PRIMARY KEY, kind TEXT, data TEXT, res TEXT, st TEXT, uid TEXT, ts INTEGER, upd INTEGER)");
      const TTL = { JS: 2 * 864e5, NB: 30 * 864e5, SB: 30 * 864e5, DNB: 30 * 864e5, DSB: 30 * 864e5 };
      const over = (k, max, win) => { const r = this.sql.exec("SELECT n, ts FROM mcsfail WHERE k = ?", k).toArray()[0]; return !!(r && now - r.ts < win && r.n >= max); };
      const bump = (k, win) => this.sql.exec("INSERT INTO mcsfail (k, n, ts) VALUES (?, 1, ?) ON CONFLICT (k) DO UPDATE SET n = CASE WHEN ? - mcsfail.ts < ? THEN mcsfail.n + 1 ELSE 1 END, ts = CASE WHEN ? - mcsfail.ts < ? THEN mcsfail.ts ELSE excluded.ts END", k, now, now, win, now, win);
      const live = (r) => r && now - r.ts < (TTL[r.kind] || 864e5);
      let row = b.code ? this.sql.exec("SELECT * FROM smcode WHERE code = ?", b.code).toArray()[0] : null;
      if (row && ((b.app === "DR") !== /^D/.test(row.kind))) row = null;   /* AIODR1611MO173: ایپ کا کوڈ صرف اسی ایپ کو */
      const kOut = (k) => String(k || "").replace(/^D(?=NB|SB)/, "");
      if (b.op === "put") {
        if (over("smp:" + b.ip, 40, 3600e3)) return Response.json({ ok: false, reason: "wait" });
        bump("smp:" + b.ip, 3600e3);
        if (Math.random() < 0.05) this.sql.exec("DELETE FROM smcode WHERE ts < ?", now - 40 * 864e5);
        const old = this.sql.exec("SELECT * FROM smcode WHERE uid = ? AND kind = ? AND st = 'new' ORDER BY ts DESC LIMIT 1", b.uid, b.kind).toArray()[0];
        if (live(old)) { this.sql.exec("UPDATE smcode SET data = ?, upd = ? WHERE code = ?", b.data, now, old.code); return Response.json({ ok: true, code: old.code, same: 1 }); }
        let c = ""; for (let i = 0; i < 40; i++) { const t = String(100000 + Math.floor(Math.random() * 900000)); const ex = this.sql.exec("SELECT * FROM smcode WHERE code = ?", t).toArray()[0]; if (!ex || !live(ex)) { if (ex) this.sql.exec("DELETE FROM smcode WHERE code = ?", t); c = t; break; } }
        if (!c) return Response.json({ ok: false, reason: "busy" });
        this.sql.exec("INSERT INTO smcode (code, kind, data, res, st, uid, ts, upd) VALUES (?, ?, ?, '', 'new', ?, ?, ?)", c, b.kind, b.data, b.uid, now, now);
        return Response.json({ ok: true, code: c });
      }
      if (b.op === "get") {
        if (over("smg:" + b.ip, 25, 900e3)) return Response.json({ ok: false, reason: "wait" });
        if (!live(row)) { bump("smg:" + b.ip, 900e3); return Response.json({ ok: false, reason: row ? "expired" : "none" }); }
        if (row.kind !== "JS" && !b.dev) { bump("smg:" + b.ip, 900e3); return Response.json({ ok: false, reason: "dev_only" }); }   /* SM1611MO276: NB / SB صرف ڈویلپر */
        return Response.json({ ok: true, code: row.code, kind: kOut(row.kind), data: row.data, st: row.st, ts: row.ts, upd: row.upd, res: row.kind === "JS" ? "" : row.res });
      }
      if (!live(row)) return Response.json({ ok: false, reason: row ? "expired" : "none" });
      if (b.op === "me") { if (row.uid !== b.uid) { bump("smg:" + b.ip, 900e3); return Response.json({ ok: false, reason: "none" }); } return Response.json({ ok: true, kind: kOut(row.kind), st: row.st, res: row.res, upd: row.upd }); }
      if (b.op === "proof") {
        if (row.uid !== b.uid) return Response.json({ ok: false, reason: "none" });
        let d = {}; try { d = JSON.parse(row.data || "{}"); } catch (e) {}
        if (b.tid) d.tid = b.tid; if (b.shot) d.shot = b.shot; d.proofAt = now;
        this.sql.exec("UPDATE smcode SET data = ?, upd = ? WHERE code = ?", JSON.stringify(d), now, b.code); return Response.json({ ok: true });
      }
      if (b.op === "set") {   /* JS: new → ok (مالک نے جوڑا، res = دکان)، ok → joined (ملازم کا فون)؛ NB / SB: → done (ڈویلپر نے جاری کیا) */
        const okMove = (row.kind === "JS" && ((row.st === "new" && b.st === "ok") || (row.st === "ok" && b.st === "joined" && row.uid === b.uid) || (row.st === "new" && b.st === "no")))
          || (row.kind !== "JS" && b.dev && ["done", "no"].includes(b.st));
        if (!okMove) return Response.json({ ok: false, reason: "state", st: row.st });
        this.sql.exec("UPDATE smcode SET st = ?, res = CASE WHEN ? != '' AND ? != '{}' THEN ? ELSE res END, upd = ? WHERE code = ?", b.st, b.res, b.res, b.res, now, b.code);
        return Response.json({ ok: true });
      }
      return Response.json({ ok: false, reason: "bad_op" });
    }
    if (op === "/mcs_city") {   /* MCS1711TU494 (مالک کا حکم): ہر مقامی شہر کی ایک بڑی تصویر (لاگ اِن / سائن اپ کے اوپر) — پڑھنا سب، لگانا صرف ایڈمن؛ نام = شہر کا نام (ضلع کے ساتھ) */
      const b = await request.json();
      this.sql.exec("CREATE TABLE IF NOT EXISTS mcscity (city TEXT PRIMARY KEY, img TEXT, v INTEGER)");
      const city = String(b.city || "").trim().replace(/\s+/g, " ").slice(0, 120);
      if (b.op === "put") {
        if (!city) return Response.json({ ok: false, reason: "city" });
        const img = String(b.img || ""); if (!/^data:image\/(jpeg|webp|png);base64,/.test(img) || img.length > 450000) return Response.json({ ok: false, reason: "img" });
        const v = Date.now(); this.sql.exec("INSERT INTO mcscity (city, img, v) VALUES (?, ?, ?) ON CONFLICT (city) DO UPDATE SET img = excluded.img, v = excluded.v", city, img, v);
        return Response.json({ ok: true, v });
      }
      if (b.op === "del") { this.sql.exec("DELETE FROM mcscity WHERE city = ?", city); return Response.json({ ok: true }); }
      if (b.op === "list") { const o = {}; for (const r of this.sql.exec("SELECT city, v FROM mcscity").toArray()) o[r.city] = r.v; return Response.json({ ok: true, cities: o }); }
      const r = this.sql.exec("SELECT img, v FROM mcscity WHERE city = ?", city).toArray()[0];
      if (b.op === "ver") return Response.json({ ok: true, v: r ? r.v : 0 });
      return Response.json({ ok: true, v: r ? r.v : 0, img: r ? r.img : "" });
    }
    if (op === "/mcs_dir") {   /* MCS1611MO466 (مالک کا حکم — فائربیس کی لمٹ): MCS نمبر کے بغیر کارڈوں کی ایک نقل (gzip base64)؛ فون فائربیس کی بجائے یہیں سے */
      const b = await request.json();
      this.sql.exec("CREATE TABLE IF NOT EXISTS mcsdir (i INTEGER PRIMARY KEY, v TEXT)");
      const meta = () => { try { return JSON.parse((this.sql.exec("SELECT v FROM agcfg WHERE k = 'dirmeta'").toArray()[0] || {}).v || "{}"); } catch (e) { return {}; } };
      if (b.op === "put") {
        const s = String(b.data || ""); if (!s || s.length > 8e6) return Response.json({ ok: false, reason: "size" });
        const P = 900000, parts = Math.ceil(s.length / P);
        this.sql.exec("DELETE FROM mcsdir");
        for (let i = 0; i < parts; i++) this.sql.exec("INSERT INTO mcsdir (i, v) VALUES (?, ?)", i, s.slice(i * P, (i + 1) * P));
        const m = { v: Date.now(), n: parseInt(b.n, 10) || 0, parts, len: s.length };
        this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('dirmeta', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", JSON.stringify(m));
        return Response.json({ ok: true, ...m });
      }
      const m = meta();
      if (b.op === "get") { if (!m.v) return Response.json({ ok: false, reason: "none" }); const data = this.sql.exec("SELECT v FROM mcsdir ORDER BY i").toArray().map((r) => r.v).join(""); return Response.json({ ok: true, v: m.v, n: m.n, data }); }
      return Response.json({ ok: true, v: m.v || 0, n: m.n || 0 });
    }
    if (op === "/bk_run" || op === "/bk_get") {   /* AGP1711TU036 (مالک کا حکم — روز کا بیک اپ): سرور کی سب جدولیں + فائربیس کے لائیو کارڈ + appConfig + کارڈوں کی نقل → ایک gzip، 30 دن */
      let b = {}; try { b = await request.json(); } catch (e) { b = {}; }
      this.sql.exec("CREATE TABLE IF NOT EXISTS bkday (day TEXT, i INTEGER, v TEXT, PRIMARY KEY (day, i))");
      this.sql.exec("CREATE TABLE IF NOT EXISTS bkmeta (day TEXT PRIMARY KEY, at INTEGER, len INTEGER, info TEXT)");
      if (op === "/bk_get") {
        if (b.op === "get") { const day = String(b.day || ""); const m = this.sql.exec("SELECT day, at, len, info FROM bkmeta WHERE day = ?", day).toArray()[0]; if (!m) return Response.json({ ok: false, reason: "none" });
          return Response.json({ ok: true, day, at: m.at, data: this.sql.exec("SELECT v FROM bkday WHERE day = ? ORDER BY i", day).toArray().map((r) => r.v).join("") }); }
        return Response.json({ ok: true, list: this.sql.exec("SELECT day, at, len, info FROM bkmeta ORDER BY day DESC").toArray().map((r) => ({ day: r.day, at: r.at, len: r.len, info: JSON.parse(r.info || "{}") })) });
      }
      const day = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
      if (!b.force && this.sql.exec("SELECT day FROM bkmeta WHERE day = ?", day).toArray().length) return Response.json({ ok: true, skip: true, day });
      const SKIP = new Set(["bkday", "bkmeta", "mcsdir", "agimg", "pimg", "chatav", "hits", "useday", "usedev", "mcsfail", "ppfail", "entfail", "mcssess", "ppsess", "vtok"]);
      const db = {}, info = { tables: {} };
      for (const t of this.sql.exec("SELECT name FROM sqlite_master WHERE type = 'table'").toArray().map((r) => r.name)) {
        if (SKIP.has(t) || /^(_cf|sqlite_)/.test(t)) continue;
        try { const rows = this.sql.exec("SELECT * FROM " + t).toArray().map((r) => { const o = {}; for (const k in r) { const v = r[k]; o[k] = (k === "img" || k === "audio" || k === "file") && typeof v === "string" && v.length > 60000 ? "[media " + v.length + "]" : v; } return o; }); db[t] = rows; info.tables[t] = rows.length; } catch (e) { info.tables[t] = "err"; }
      }
      const K = "AIzaSyAvu8ymIZAGEPaYwd_LBJzKS2lZ3Q4_Mog", FB = "https://firestore.googleapis.com/v1/projects/my-city-shines/databases/(default)/documents";
      const fs = { live: {}, appConfig: [] };
      try {
        for (const col of ["services", "doctors"]) {
          const r = await fetch(FB + ":runQuery?key=" + K, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: col }], where: { fieldFilter: { field: { fieldPath: "mcsLive" }, op: "EQUAL", value: { booleanValue: true } } } } }) });
          if (!r.ok) throw new Error(col + " " + r.status);
          fs.live[col] = (await r.json()).filter((x) => x.document).map((x) => x.document); info[col + "Live"] = fs.live[col].length;
        }
        let tok = ""; do { const r = await fetch(FB + "/appConfig?key=" + K + "&pageSize=100" + (tok ? "&pageToken=" + tok : "")); if (!r.ok) throw new Error("appConfig " + r.status); const j = await r.json(); fs.appConfig.push(...(j.documents || [])); tok = j.nextPageToken || ""; } while (tok);
        info.appConfig = fs.appConfig.length;
      } catch (e) { info.fsErr = String(e.message || e); }
      let dir = ""; try { dir = this.sql.exec("SELECT v FROM mcsdir ORDER BY i").toArray().map((r) => r.v).join(""); info.dirCards = (JSON.parse((this.sql.exec("SELECT v FROM agcfg WHERE k = 'dirmeta'").toArray()[0] || {}).v || "{}").n) || 0; } catch (e) { dir = ""; }
      const raw = new TextEncoder().encode(JSON.stringify({ app: "My City Shines", kind: "full-backup", day, at: Date.now(), db, firestore: fs, dirGzipB64: dir }));
      const gz = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());
      let s = ""; for (let i = 0; i < gz.length; i += 0x8000) s += String.fromCharCode.apply(null, gz.subarray(i, i + 0x8000)); s = btoa(s);
      this.sql.exec("DELETE FROM bkday WHERE day = ?", day);
      for (let i = 0, P = 900000; i * P < s.length; i++) this.sql.exec("INSERT INTO bkday (day, i, v) VALUES (?, ?, ?)", day, i, s.slice(i * P, (i + 1) * P));
      info.raw = raw.length;
      this.sql.exec("INSERT INTO bkmeta (day, at, len, info) VALUES (?, ?, ?, ?) ON CONFLICT (day) DO UPDATE SET at = excluded.at, len = excluded.len, info = excluded.info", day, Date.now(), s.length, JSON.stringify(info));
      const keep = this.sql.exec("SELECT day FROM bkmeta ORDER BY day DESC LIMIT 30").toArray().map((r) => r.day);
      if (keep.length) { const old = this.sql.exec("SELECT day FROM bkmeta").toArray().map((r) => r.day).filter((d) => !keep.includes(d)); for (const d of old) { this.sql.exec("DELETE FROM bkday WHERE day = ?", d); this.sql.exec("DELETE FROM bkmeta WHERE day = ?", d); } }
      return Response.json({ ok: true, day, len: s.length, info });
    }
    if (op === "/ent_claim") {   /* گاہک: اپنی چابی (جی میل / موبائل) سے اس فون پر کھولنا — فون کی حد تک */
      const b = await request.json();
      const row = this.sql.exec("SELECT id FROM entkey WHERE k = ?", b.app + "|" + b.key).toArray()[0];
      if (!row) return Response.json({ ok: false, reason: "none" });
      const e = this.entGet(row.id); if (!e) return Response.json({ ok: false, reason: "none" });
      if (e.revoked) return Response.json({ ok: false, reason: "revoked" });
      e.claims = e.claims || [];
      const mine = e.claims.find((c) => c.dev === b.dev);
      if (!mine && b.key.startsWith("c:")) {   /* ACT-XXXXXX: ایکٹیویشن کوڈ — ایک ہی بار، ایک ہی فون؛ پہلی بار لگنے پر مدت شروع */
        if (!b.bind) return Response.json({ ok: false, reason: "not_bound" });
        if (e.pend && !e.redeemed) {
          const now = Date.now();
          e.devices = e.pend.devices || 1; e.life = !!e.pend.life; e.exp = e.life ? 0 : now + (e.pend.days || 0) * 864e5;
          e.redeemed = now; e.usedAt = now; e.claims = [{ dev: b.dev, at: now, via: "c" }];
          if (b.biz) e.biz = String(b.biz).slice(0, 60);   /* HD1711: یہ کوڈ اسی بزنس کا ہو گیا */
          this.entPut(e);
        } else if (!e.claims.length && e.redeemed) {   /* ڈویلپر نے «reset» کیا — اسی کوڈ سے نیا فون، مدت وہی */
          e.claims.push({ dev: b.dev, at: Date.now(), via: "c" }); this.entPut(e);
        } else if (e.redeemed && e.biz && b.biz && String(b.biz) === e.biz) {   /* HD1711: وہی بزنس، نیا / دوبارہ انسٹال فون — حد کے اندر (بھرا ہو تو سب سے پرانے کی جگہ)، مدت وہی */
          if (e.claims.length >= (e.devices || 1)) { e.claims.sort((x, y) => (x.seen || x.at || 0) - (y.seen || y.at || 0)); while (e.claims.length >= (e.devices || 1)) e.claims.shift(); }
          e.claims.push({ dev: b.dev, at: Date.now(), via: "c" }); this.entPut(e);
        } else return Response.json({ ok: false, reason: "used" });
      } else if (!mine) {
        if (!b.bind) return Response.json({ ok: false, reason: "not_bound" });
        /* AIO0411WE160: گاہک نے اپنے فون کا UID بھیجا ہو تو موبائل نمبر سے صرف وہی فون کھلے (نمبر کسی اور کو معلوم ہو تو جگہ نہ لے)؛ جی میل (گوگل سے تصدیق شدہ) کسی بھی فون پر */
        /* AIO0511TH173 (مالک کا حکم): نیا فون / دوبارہ انسٹال — جی میل (گوگل سے تصدیق شدہ) یا موبائل + اکاؤنٹ PIN ہو تو سب سے پرانے فون کی جگہ یہ فون (باقی دن وہی)؛ پرانا فون اگلی جانچ (30 منٹ) پر خود بند */
        const pinOk = !!(b.key.startsWith("p:") && e.pin && b.pin && String(b.pin) === String(e.pin));
        const trusted = b.key.startsWith("g:") || pinOk;
        if (b.key.startsWith("p:") && b.pin) {   /* غلط PIN: 15 منٹ میں 8 بار کے بعد روک */
          const pf = e.pf && Date.now() - e.pf.ts < 9e5 ? e.pf : { n: 0, ts: Date.now() };
          if (pf.n >= 8) return Response.json({ ok: false, reason: "pin_wait" });
          if (!pinOk) { pf.n++; e.pf = pf; this.entPut(e); return Response.json({ ok: false, reason: "bad_pin" }); }
          if (e.pf) delete e.pf;
        }
        if (e.uidLock && b.key.startsWith("p:") && !pinOk) return Response.json({ ok: false, reason: "phone_locked" });
        let moved = false;
        if (e.claims.length >= (e.devices || 1)) {
          if (!trusted) return Response.json({ ok: false, reason: "devices_full", devices: e.devices || 1 });
          e.claims.sort((x, y) => (x.seen || x.at || 0) - (y.seen || y.at || 0));
          while (e.claims.length >= (e.devices || 1)) e.claims.shift();
          moved = true;
        }
        e.claims.push({ dev: b.dev, at: Date.now(), via: pinOk ? "k" : b.key.slice(0, 1) });
        this.entPut(e);
        if (moved) { const o = this.entOut(e); delete o.keys; o.id = undefined; o.moved = true; return Response.json(o); }
      } else if (Date.now() - (mine.seen || mine.at || 0) > 864e5) { mine.seen = Date.now(); this.entPut(e); }   /* AIO0411WE162: ہر جانچ پر لکھنا نہیں — دن میں ایک بار */
      const o = this.entOut(e); delete o.keys; o.id = undefined; return Response.json(o);   /* گاہک کو دوسری چابیاں (جی میل / نمبر) نہیں */
    }
    if (op === "/ag_apply") {   /* ایجنٹ کی درخواست — ایک نمبر کی ایک (دوبارہ بھیجے تو تازہ، منظور شدہ کا کوڈ برقرار) */
      const b = await request.json(); const now = Date.now();
      const old = this.sql.exec("SELECT id, data FROM agent WHERE phone = ?", b.d.phone).toArray()[0];
      const prev = old ? JSON.parse(old.data) : null;
      const id = old ? old.id : "A" + now.toString(36) + Math.random().toString(36).slice(2, 5);
      { const st = this.agStaffCnic(b.d.cnic); if (st) return Response.json({ ok: false, reason: "cnic_staff", other: st }); } { const o = this.agCnicOwner(b.d.cnic, old ? old.id : null); if (o) return Response.json({ ok: false, reason: "cnic_taken" }); }   /* MCS0511TH145: ایک شناختی کارڈ پر ایک ہی ایجنٹ */
      if (b.d.bizRk) { const pr = this.sql.exec("SELECT paid, until FROM prof WHERE rec = ?", b.d.bizRk).toArray()[0];
        if (!pr || !(pr.paid > 0)) return Response.json({ ok: false, reason: "not_paid" }); }   /* MCS0511TH134: کاروبار کے ساتھ آئے تو وہ پروفائل خریدی ہو؛ MCS0911MO264: کاروبار کے بغیر (صرف ایجنٹ) بھی درخواست — noBiz */
      if (prev && prev.status === "pending" && b.d.full) return Response.json({ ok: false, reason: "pending" });   /* ایک وقت میں ایک ہی زیرِ غور درخواست */
      if (!b.d.bizRk) b.d.noBiz = 1;
      const d = Object.assign({}, b.d, { id, at: prev ? prev.at : now, upd: now, status: prev && prev.status === "approved" ? "approved" : "pending", code: prev ? prev.code || "" : "", pin: prev ? prev.pin || "" : "", note: prev ? prev.note || "" : "" });
      this.sql.exec("INSERT INTO agent (id, phone, data, ts) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET phone = excluded.phone, data = excluded.data, ts = excluded.ts", id, d.phone, JSON.stringify(d), now);
      for (const k of ["front", "back", "selfie"]) if (b.img && b.img[k]) this.sql.exec("INSERT INTO agimg (id, kind, data) VALUES (?, ?, ?) ON CONFLICT (id, kind) DO UPDATE SET data = excluded.data", id, k, b.img[k]);
      return Response.json({ ok: true, id, status: d.status, code: d.code });
    }
    if (op === "/aio_id") {   /* AIO0911MO190 (ہیلپ ڈیسک #193، مالک کا حکم): ملازم کا فون جوڑنا سادہ — AIO ID → مالک شامل کرے → ملازم کا فون خود جڑے */
      const b = await request.json(), now = Date.now();
      const get = (id) => { const r = this.sql.exec("SELECT dev, data FROM aioid WHERE id = ?", id).toArray()[0]; return r ? Object.assign(JSON.parse(r.data), { dev: r.dev }) : null; };
      if (b.op === "reg") {
        const old = this.sql.exec("SELECT id FROM aioid WHERE dev = ?", b.dev).toArray()[0];
        let id = old && old.id;
        if (!id) { for (let t = 0; t < 40 && !id; t++) { const c = "AIO" + String(10000 + Math.floor(Math.random() * 90000)); if (!this.sql.exec("SELECT id FROM aioid WHERE id = ?", c).toArray().length) id = c; } }
        if (!id) return Response.json({ ok: false, reason: "busy" });
        const d = { name: b.name, mobile: b.mobile, gmail: b.gmail, app: b.app, at: old ? (get(id) || {}).at || now : now, upd: now };
        this.sql.exec("INSERT INTO aioid (id, dev, data, ts) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data, ts = excluded.ts", id, b.dev, JSON.stringify(d), now);
        return Response.json({ ok: true, id });
      }
      if (b.op === "me" || b.op === "done" || b.op === "del") {
        const a = get(b.id); if (!a || a.dev !== b.dev) return Response.json({ ok: false, reason: "none" });
        if (b.op === "done") { this.sql.exec("DELETE FROM aioinv WHERE id = ?", b.id); return Response.json({ ok: true }); }
        if (b.op === "del") { this.sql.exec("DELETE FROM aioinv WHERE id = ?", b.id); this.sql.exec("DELETE FROM aioid WHERE id = ?", b.id); return Response.json({ ok: true }); }
        const iv = this.sql.exec("SELECT data FROM aioinv WHERE id = ?", b.id).toArray()[0];
        return Response.json({ ok: true, name: a.name, inv: iv ? JSON.parse(iv.data) : null });
      }
      if (b.op === "look" || b.op === "invite") {
        const fk = "aiol:" + b.by, fr = this.sql.exec("SELECT n, ts FROM mcsfail WHERE k = ?", fk).toArray()[0];
        const n = fr && now - fr.ts < 3600e3 ? fr.n : 0; if (n >= 60) return Response.json({ ok: false, reason: "wait" });
        this.sql.exec("INSERT INTO mcsfail (k, n, ts) VALUES (?, 1, ?) ON CONFLICT (k) DO UPDATE SET n = CASE WHEN ? - mcsfail.ts < 3600000 THEN mcsfail.n + 1 ELSE 1 END, ts = CASE WHEN ? - mcsfail.ts < 3600000 THEN mcsfail.ts ELSE excluded.ts END", fk, now, now, now);
        const a = get(b.id); if (!a) return Response.json({ ok: false, reason: "no_id" });
        if (b.op === "look") return Response.json({ ok: true, name: a.name, mobile: a.mobile, gmail: a.gmail });
        if (a.dev === b.by) return Response.json({ ok: false, reason: "self" });
        const d = { biz: b.biz, pin: b.pin, uname: b.uname, role: b.role, shop: b.shop, at: now };
        this.sql.exec("INSERT INTO aioinv (id, data, ts) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data, ts = excluded.ts", b.id, JSON.stringify(d), now);
        return Response.json({ ok: true, name: a.name });
      }
      return Response.json({ ok: false, reason: "op" });
    }
    if (op === "/ag_status") {   /* درخواست دینے والا: اپنے نمبر + فون (dev) سے حالت؛ MCS0511TH139: یا نمبر + PIN (مالک کا بنایا ایجنٹ — یہ فون جڑ جاتا ہے) */
      const b = await request.json();
      let viaAcct = false;
      if (b.th) {   /* MCS0911MO266: لاگ اِن اکاؤنٹ کا موبائل = منظور ایجنٹ کا موبائل → یہ فون جڑ جائے */
        const ss = this.sql.exec("SELECT id FROM mcssess WHERE tok = ?", b.th).toArray()[0]; const ur = ss && this.sql.exec("SELECT data FROM mcsuser WHERE id = ?", ss.id).toArray()[0];
        const m10 = ur ? String(JSON.parse(ur.data).mobile || "").replace(/\D/g, "").slice(-10) : ""; if (m10.length !== 10) return Response.json({ ok: false, reason: "none" });
        b.phone = "92" + m10; viaAcct = true;
      }
      const r = this.sql.exec("SELECT data FROM agent WHERE phone = ?", b.phone).toArray()[0];
      if (!r) return Response.json({ ok: false, reason: "none" });
      const d = JSON.parse(r.data);
      if (viaAcct) { if (d.status !== "approved") return Response.json({ ok: false, reason: "none" }); if (d.dev !== b.dev) { d.dev = b.dev; this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), d.id); }
        return Response.json({ ok: true, status: d.status, code: d.code || "", pin: "", phone: d.phone, name: d.name, note: "", docs: this.sql.exec("SELECT COUNT(*) AS n FROM agimg WHERE id = ?", d.id).toArray()[0].n >= 3, refs: d.code ? this.sql.exec("SELECT COUNT(*) AS n FROM agref WHERE code = ?", d.code).toArray()[0].n : 0 }); }
      if (b.pin) { if (d.status !== "approved" || !d.pin || d.pin !== b.pin) return Response.json({ ok: false, reason: "login" }); if (d.dev !== b.dev) { d.dev = b.dev; this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), d.id); } }
      else if (d.dev !== b.dev) return Response.json({ ok: false, reason: "none" });
      d.docs = this.sql.exec("SELECT COUNT(*) AS n FROM agimg WHERE id = ?", d.id).toArray()[0].n >= 3;
      return Response.json({ ok: true, status: d.status, code: d.code || "", pin: d.status === "approved" ? d.pin || "" : "", note: d.note || "", name: d.name, docs: !!d.docs, refs: d.code ? this.sql.exec("SELECT COUNT(*) AS n FROM agref WHERE code = ?", d.code).toArray()[0].n : 0 });
    }
    if (op === "/ag_ref") {   /* ایپ: اس کاروبار کو اس ایجنٹ کے نام لکھیں (صرف منظور ایجنٹ کا کوڈ) */
      const b = await request.json();
      const ag = this.agResolve(b.code, b.phone);
      if (!ag) return Response.json({ ok: false, reason: "bad_code" });
      b.code0 = b.code; b.code = ag.code;   /* ایجنٹ کا موبائل لکھا ہو تو بھی اسی کا ریفرل نمبر */
      const old = this.sql.exec("SELECT code FROM agref WHERE rk = ?", b.rk).toArray()[0];
      if (old && old.code !== b.code) return Response.json({ ok: false, reason: "taken" });   /* ایک کاروبار ایک ہی ایجنٹ کا */
      const via = String(b.code0 || "").replace(/\D/g, "").length === 13 ? "cnic" : b.phone ? "mobile" : "code";
      this.sql.exec("INSERT INTO agref (rk, code, data, ts) VALUES (?, ?, ?, ?) ON CONFLICT (rk) DO UPDATE SET data = excluded.data", b.rk, b.code, JSON.stringify(Object.assign({}, b.d || {}, { via })), Date.now());
      if (!old) this.agNote("A:" + ag.code, "ref", "🏪 نیا کاروبار آپ کے ریفرل کوڈ سے جڑا: " + ((b.d && b.d.name) || b.rk));
      return Response.json({ ok: true, code: ag.code, name: ag.name });
    }
    if (op === "/ag_portal") {   /* ایجنٹ پورٹل (موبائل + PIN) اور ایڈمن دونوں کا خلاصہ */
      const b = await request.json();
      let d = null;
      for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const x = JSON.parse(r.data); if (b.admin ? x.code === b.code : (x.phone === b.phone && x.status === "approved" && x.pin && x.pin === b.pin)) { d = x; break; } }
      if (!d) return Response.json({ ok: false, reason: "login" });
      const code = d.code, now = Date.now();
      if (b.act === "proof" && !b.admin) { this.sql.exec("INSERT INTO agproof (code, rk, note, img, ts) VALUES (?, ?, ?, ?, ?)", code, String(b.rk || "").slice(0, 60), String(b.note || "").slice(0, 400), String(b.img || "").slice(0, 700000), now); }
      if (b.act === "msg") { this.sql.exec("INSERT INTO agmsg (code, who, text, img, audio, ts) VALUES (?, ?, ?, ?, ?, ?)", code, b.admin ? "dev" : "agent", String(b.text || "").slice(0, 2000), String(b.img || "").slice(0, 700000), String(b.audio || "").slice(0, 900000), now); }
      const rate = parseInt((this.sql.exec("SELECT v FROM agcfg WHERE k = 'rate'").toArray()[0] || {}).v || "0", 10) || 0;
      const refs = this.sql.exec("SELECT rk, data, ts FROM agref WHERE code = ? ORDER BY ts DESC", code).toArray().map((r, i, A) => { const p = this.sql.exec("SELECT since, until, paid FROM prof WHERE rec = ?", r.rk).toArray()[0] || {}; return Object.assign(JSON.parse(r.data), { rk: r.rk, at: r.ts, until: p.until || 0, paid: p.paid || 0, rid: code + "-" + String(A.length - i).padStart(3, "0"), sid: this.sidGet(r.rk) }); });   /* MCS1111WE312: ایجنٹ کا ہر کاروبار AG-001-001، -002… */
      /* AGP0511TH011: کمیشن کے سال اب فروخت کے کھاتے (sale.who) سے — غیر فعال ہونے کے بعد کی تجدید اس کی نہیں؛ کھاتے سے پہلے کے پرانے سال (legacy) ویسے */
      let years = 0;
      for (const r of refs) { const rows = this.sql.exec("SELECT units, who FROM sale WHERE rec = ?", r.rk).toArray(); let all = 0, mine = 0; for (const x of rows) { all += x.units || 0; try { const w = JSON.parse(x.who || "{}"); if (w.by === "agent" && w.code === code) mine += x.units || 0; } catch (e) {} } years += mine + Math.max(0, (r.paid || 0) - all); }
      const pays = this.sql.exec("SELECT id, amount, note, ts FROM agpay WHERE code = ? ORDER BY ts DESC", code).toArray();
      const paidOut = pays.reduce((a, x) => a + (x.amount || 0), 0);
      const proofs = this.sql.exec("SELECT id, rk, note, done, ts" + (b.admin ? ", img" : "") + " FROM agproof WHERE code = ? ORDER BY ts DESC LIMIT 100", code).toArray();
      const msgs = this.sql.exec("SELECT id, who, text, img, audio, ts FROM agmsg WHERE code = ? ORDER BY ts DESC LIMIT 200", code).toArray().reverse();
      const fp = this.finPerson("A:" + code, this.finLines(""));   /* AGP0911MO018: کمیشن نئے حساب سے (9 نومبر سے پہلے کی فروخت پرانی شرح) */
      const unread = this.sql.exec("SELECT COUNT(*) AS n FROM agnote WHERE who = ? AND rd = 0", "A:" + code).toArray()[0].n;
      return Response.json({ ok: true, unread, agent: { name: d.name, phone: d.phone, code, biz: d.biz, city: d.city, okAt: d.okAt || d.ts || 0, off: !!d.off, wa: d.wa || "", email: d.email || "", yob: this.ppYob("agent", d.phone) }, rate, refs, years, due: fp.due, paidOut, balance: fp.due - paidOut, fin: fp, pays: fp.pays, proofs, msgs });
    }
    if (op === "/ua") {   /* MCS0511TH161: اکاؤنٹ — ورکر نے ان پٹ صاف / پاس ورڈ ہیش / گوگل تصدیق کر دی */
      const b = await request.json(), now = Date.now();
      const key = (k) => (this.sql.exec("SELECT id FROM mcsukey WHERE k = ?", k).toArray()[0] || {}).id || "";
      const get = (id) => { const r = this.sql.exec("SELECT data, pwh FROM mcsuser WHERE id = ?", id).toArray()[0]; if (!r) return null; const u = JSON.parse(r.data); u._pwh = r.pwh || ""; return u; };
      const pkOf = (u) => {   /* MCS1211TH333: ہر اکاؤنٹ کا پکا 4 ہندسوں کا پاس کوڈ — ایجنٹ کو رجسٹریشن کے لیے (ID + کوڈ سے ریکارڈ) */
        if (u.pk && /^\d{4}$/.test(u.pk)) return u.pk;
        u.pk = String(1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000));
        const d = Object.assign({}, u); delete d._pwh; this.sql.exec("UPDATE mcsuser SET data = ? WHERE id = ?", JSON.stringify(d), u.id); return u.pk;
      };
      const out = (u) => ({ id: u.id, sid: this.adminSlotOf(u.mobile) || this.staffSid(u.mobile) || this.sidGet(u.mobile) || "", mcsId: this.sidGet(u.mobile) || "", name: u.name, mobile: u.mobile, district: u.district || "", email: u.email || "", gmail: u.gmail || "", hasPw: !!u._pwh, hasYob: !!u.yob, ts: u.ts, pk: pkOf(u) });
      const sess = async (id, via) => { const raw = crypto.getRandomValues(new Uint8Array(24)); const tok = Array.from(raw).map((x) => x.toString(16).padStart(2, "0")).join(""); this.sql.exec("INSERT INTO mcssess (tok, id, via, ts, last) VALUES (?, ?, ?, ?, ?)", await uaTokHash(tok), id, via, now, now); return tok; };
      const failK = "f:" + (b.fk || ""), failR = this.sql.exec("SELECT n, ts FROM mcsfail WHERE k = ?", failK).toArray()[0];
      const fails = failR && now - failR.ts < 15 * 60e3 ? failR.n : 0;
      const fail = () => { this.sql.exec("INSERT INTO mcsfail (k, n, ts) VALUES (?, 1, ?) ON CONFLICT (k) DO UPDATE SET n = CASE WHEN ? - mcsfail.ts < 900000 THEN mcsfail.n + 1 ELSE 1 END, ts = excluded.ts", failK, now, now); };
      const bySess = () => { if (!b.th) return null; const r = this.sql.exec("SELECT id, via, ts FROM mcssess WHERE tok = ?", b.th).toArray()[0]; if (!r) return null; const u = get(r.id); if (!u || u.del) return null; if (now - (r.last || 0) > 864e5) this.sql.exec("UPDATE mcssess SET last = ? WHERE tok = ?", now, b.th); return { u, via: r.via, at: r.ts }; };
      if (b.act === "signup") {
        /* MCS1511SU445 (مالک کا حکم — «0320 پر اکاؤنٹ نہیں مگر لکھا آتا ہے پہلے سے بنا ہے»): چابی ہو مگر اکاؤنٹ ہے ہی نہیں (ٹوٹی چابی) یا حذف شدہ ہے تو وہ چابی خود صاف — صرف زندہ اکاؤنٹ ہی «پہلے سے بنا ہے» کہلائے */
        const live = (k) => { const id0 = key(k); if (!id0) return ""; const u0 = get(id0); if (u0 && !u0.del) return id0;
          try { this.sql.exec("DELETE FROM mcsukey WHERE k = ?", k); if (u0) { this.sql.exec("DELETE FROM mcsukey WHERE id = ?", id0); this.sql.exec("DELETE FROM mcssess WHERE id = ?", id0); this.sql.exec("DELETE FROM mcsuser WHERE id = ?", id0); } } catch (e) {} return ""; };
        if (live("m:" + b.mobile)) return Response.json({ ok: false, reason: "mobile_taken" });
        if (b.email && live("e:" + b.email)) return Response.json({ ok: false, reason: "email_taken" });
        if (b.gmail && (live("g:" + b.gmail) || live("e:" + b.gmail))) return Response.json({ ok: false, reason: "gmail_taken" });
        let n = parseInt((this.sql.exec("SELECT v FROM agcfg WHERE k = 'useq'").toArray()[0] || {}).v || "100000", 10) + 1 + Math.floor(Math.random() * 7);
        while (get("MCS-" + n)) n++;
        this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('useq', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", String(n));
        const u = { id: "MCS-" + n, name: b.name, mobile: b.mobile, district: b.district || "", email: b.email || b.gmail || "", gmail: b.gmail || "", ts: now, dev: b.dev || "", yob: b.yob || "" };
        this.sql.exec("INSERT INTO mcsuser (id, data, pwh, ts, seen) VALUES (?, ?, ?, ?, ?)", u.id, JSON.stringify(u), b.pwh || "", now, now);
        this.sql.exec("INSERT INTO mcsukey (k, id) VALUES (?, ?)", "m:" + u.mobile, u.id);
        this.sql.exec("INSERT INTO mcsukey (k, id) VALUES (?, ?)", "a:" + u.id, u.id);
        if (u.email) this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) VALUES (?, ?)", "e:" + u.email, u.id);
        if (u.gmail) this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) VALUES (?, ?)", "g:" + u.gmail, u.id);
        { if (!this.finCfg("sid352at", "")) this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('sid352at', ?) ON CONFLICT (k) DO NOTHING", String(now));
          const sid = (this.staffSid(u.mobile) && !this.adminSlotOf(u.mobile)) ? "" : this.sidFor(u.mobile, now); if (sid) this.sql.exec("INSERT OR REPLACE INTO mcsukey (k, id) VALUES (?, ?)", "a:" + sid, u.id); }   /* MCS1211TH352 (مالک کا حکم): سائن اپ ہوتے ہی MCS ID — رجسٹریشن فارم کی فہرست میں فوراً */
        u._pwh = b.pwh || "";
        return Response.json({ ok: true, tok: await sess(u.id, u.gmail ? "g" : "p"), user: out(u) });
      }
      if (b.act === "actmake") {   /* MCS1211TH334 (صرف ڈویلپر — ورکر نے جانچا): منظور رجسٹریشن کا ایکٹیویشن کوڈ XXXX-XXXX (بڑے حروف + ہندسے) */
        const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = "";
        for (let t = 0; t < 20; t++) { const r8 = crypto.getRandomValues(new Uint8Array(8)); let c = ""; for (let i = 0; i < 8; i++) { c += A[r8[i] % A.length]; if (i === 3) c += "-"; } if (!/\d/.test(c) || !/[A-Z]/.test(c)) continue; if (!this.sql.exec("SELECT code FROM actcode WHERE code = ?", c).toArray().length) { code = c; break; } }
        if (!code) return Response.json({ ok: false, reason: "busy" });
        const d = { mobile: b.mobile, name: b.name || "", rec: b.rec || "", kind: b.kind || "service", recId: b.recId || "", until: b.until || 0, prof: b.prof || "", cnic: b.cnic || "", district: b.district || "" };
        this.sql.exec("INSERT INTO actcode (code, data, ts, used, uid) VALUES (?, ?, ?, 0, '')", code, JSON.stringify(d), now);
        return Response.json({ ok: true, code });
      }
      if (b.act === "actuse") {   /* MCS1211TH334: ایجنٹ سے ملا کوڈ → اسی موبائل کا اکاؤنٹ (نہ ہو تو بنے) + لاگ اِن + کاروبار کی تفصیل */
        if (fails >= 8) return Response.json({ ok: false, reason: "wait" });
        const row = this.sql.exec("SELECT data, used, uid FROM actcode WHERE code = ?", b.code).toArray()[0];
        if (!row) { fail(); return Response.json({ ok: false, reason: fails + 1 >= 8 ? "wait" : "badcode" }); }
        if (row.used > 0) { fail(); return Response.json({ ok: false, reason: "used" }); }   /* MCS1211TH335: ایک بار استعمال کے بعد ختم — نیا فون «کاروبار واپس لائیں» سے */
        const d = JSON.parse(row.data); let id = key("m:" + d.mobile), u = id && get(id);
        if (!u || u.del) {
          let n = parseInt((this.sql.exec("SELECT v FROM agcfg WHERE k = 'useq'").toArray()[0] || {}).v || "100000", 10) + 1 + Math.floor(Math.random() * 7);
          while (get("MCS-" + n)) n++;
          this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('useq', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", String(n));
          u = { id: "MCS-" + n, name: d.name || "", mobile: d.mobile, district: "", email: "", gmail: "", ts: now, dev: b.dev || "" };
          this.sql.exec("INSERT INTO mcsuser (id, data, pwh, ts, seen) VALUES (?, ?, '', ?, ?)", u.id, JSON.stringify(u), now, now);
          this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) VALUES (?, ?)", "m:" + u.mobile, u.id);
          this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) VALUES (?, ?)", "a:" + u.id, u.id);
          { const sid = (this.staffSid(u.mobile) && !this.adminSlotOf(u.mobile)) ? "" : this.sidFor(u.mobile, now); if (sid) this.sql.exec("INSERT OR REPLACE INTO mcsukey (k, id) VALUES (?, ?)", "a:" + sid, u.id); }   /* MCS1211TH352 */
          u._pwh = "";
        }
        this.sql.exec("DELETE FROM mcsfail WHERE k = ?", failK);
        this.sql.exec("UPDATE actcode SET used = used + 1, uid = ? WHERE code = ?", u.id, b.code);
        { u.act = { rec: d.rec, kind: d.kind, recId: d.recId, prof: d.prof }; if (d.cnic) u.cnic = d.cnic; if (!u.district && d.district) u.district = d.district; if (!u.name && d.name) u.name = d.name;
          const dd = Object.assign({}, u); delete dd._pwh; this.sql.exec("UPDATE mcsuser SET data = ? WHERE id = ?", JSON.stringify(dd), u.id);
          if (d.rec) this.sql.exec("UPDATE prof SET key = '' WHERE rec = ?", d.rec); }   /* نیا فون اسی وقت کاروبار لے سکے */
        this.sql.exec("UPDATE mcsuser SET seen = ? WHERE id = ?", now, u.id);
        return Response.json({ ok: true, tok: await sess(u.id, "c"), user: out(u), act: d });
      }
      if (b.act === "relink") {   /* MCS1211TH335: نیا فون / دوبارہ انسٹال — نام، موبائل، ضلع، شناختی کارڈ ملیں تو لاگ اِن + کاروبار (ممبرشپ باقی ہو تو) */
        if (fails >= 8) return Response.json({ ok: false, reason: "wait" });
        const id = key("m:" + b.mobile), u = id && get(id);
        const nn = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, "");
        const cOk = u && u.cnic && String(u.cnic).replace(/\D/g, "") === String(b.cnic || "").replace(/\D/g, "");
        const nOk = u && nn(u.name) && (nn(u.name) === nn(b.name) || nn(u.name).startsWith(nn(b.name).slice(0, 4)) || nn(b.name).startsWith(nn(u.name).slice(0, 4)));
        const dOk = u && (!u.district || u.district === b.district);
        if (!u || u.del) { fail(); return Response.json({ ok: false, reason: "noacct" }); }
        if (!u.cnic) return Response.json({ ok: false, reason: "nocnic" });
        if (!cOk || !nOk || !dOk) { fail(); return Response.json({ ok: false, reason: fails + 1 >= 8 ? "wait" : "nomatch" }); }
        this.sql.exec("DELETE FROM mcsfail WHERE k = ?", failK);
        const a = u.act || null; let until = 0;
        if (a && a.rec) { const pr = this.sql.exec("SELECT until FROM prof WHERE rec = ?", a.rec).toArray()[0]; until = pr ? pr.until || 0 : 0; if (pr && until > now) this.sql.exec("UPDATE prof SET key = '' WHERE rec = ?", a.rec); }
        this.sql.exec("UPDATE mcsuser SET seen = ? WHERE id = ?", now, u.id);
        return Response.json({ ok: true, tok: await sess(u.id, "r"), user: out(u), act: a, until });
      }
      if (b.act === "staffcnic") {   /* MCS1211TH335 (صرف ڈویلپر): DEV / CODEV کا شناختی کارڈ — اس پر ایجنٹ کوڈ کبھی نہیں */
        b.who = refNorm(b.who); if (b.who !== "ADMIN1" && b.who !== "ADMIN2") return Response.json({ ok: false, reason: "who" });
        if (b.cnic) {
          const c = String(b.cnic).replace(/\D/g, ""); if (c.length !== 13) return Response.json({ ok: false, reason: "bad_cnic" });
          const ex = this.agCnicRow(c); if (ex && ex.code !== b.who) return Response.json({ ok: false, reason: "cnic_used", other: ex.code });
          this.sql.exec("DELETE FROM agcnic WHERE code = ?", b.who);
          this.sql.exec("INSERT INTO agcnic (cnic, code, id, ts) VALUES (?, ?, ?, ?) ON CONFLICT (cnic) DO UPDATE SET code = excluded.code, id = excluded.id", c, b.who, b.who, now);
        }
        const L = {}; for (const r of this.sql.exec("SELECT cnic, code FROM agcnic WHERE code IN ('DEV','CODEV','ADMIN1','ADMIN2')").toArray()) L[refNorm(r.code)] = r.cnic.slice(0, 5) + "-" + r.cnic.slice(5, 12) + "-" + r.cnic.slice(12);
        L.DEV = L.ADMIN1; L.CODEV = L.ADMIN2;   /* پرانی ایپ کے لیے */
        return Response.json({ ok: true, list: L });
      }
      if (b.act === "sidreset") {   /* MCS1211TH351 (مالک کا حکم): صرف رجسٹرڈ کاروبار کی MCS ID — باقی سب ختم؛ ترتیب ایڈمن کی دی ہوئی، ہر ایک کی پہلی ممبرشپ -01 */
        if (!b.admin) return Response.json({ ok: false, reason: "admin_only" });
        const L = (b.list || []).map((x) => ({ mob: this.sidMob(x.mob), name: String(x.name || "").slice(0, 80) })).filter((x) => x.mob);
        if (!L.length || new Set(L.map((x) => x.mob)).size !== L.length) return Response.json({ ok: false, reason: "bad_list" });
        return Response.json(this.sidResetCore(L, b.agentFirst || (L[0] && L[0].mob) || "", now));
      }
      if (b.act === "reglist") {   /* MCS1211TH347: ڈویلپر / کو-ڈویلپر / منظور ایجنٹ — سب سائن اپ شدہ IDs (نام، موبائل، ضلع) رجسٹریشن فارم کی ڈراپ ڈاؤن کے لیے */
        let ok = !!b.admin;
        if (!ok && b.phone && b.pin) {
          const ph = String(b.phone), pin = String(b.pin);
          for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { let x = {}; try { x = JSON.parse(r.data); } catch (e) {} if (x.phone === ph && x.status === "approved" && !x.off && x.pin && x.pin === pin) { ok = true; break; } }
          if (!ok) { const c = this.cdAuth(ph, pin); if (c && c.p.biz) ok = true; }
        }
        if (!ok) return Response.json({ ok: false, reason: "login" });
        /* MCS1211TH351 (مالک کا حکم): فہرست (رجسٹریشن فارم کی ID) = صرف رجسٹرڈ کاروبار (MCS00101…)؛ DEV / CODEV / PBT / AG ریفرل کی فہرست میں، یہاں نہیں */
        const L = [], uBy = (mob) => { const k2 = this.sql.exec("SELECT id FROM mcsukey WHERE k = ?", "m:" + mob).toArray()[0]; if (!k2) return null; const r2 = this.sql.exec("SELECT data FROM mcsuser WHERE id = ?", k2.id).toArray()[0]; try { return r2 ? JSON.parse(r2.data) : null; } catch (e) { return null; } };
        for (const r of this.sql.exec("SELECT mob, sid, subn FROM mcssid ORDER BY sid").toArray()) { const u = uBy(r.mob) || {}; L.push({ sid: r.sid, subid: r.subn ? r.sid + "M" + r.subn : "", name: u.name || this.finCfg("sidname_" + r.mob, "") || "", mobile: r.mob, district: u.district || "", kind: r.subn ? "reg" : "new" }); }   /* MCS1211TH352: نئے سائن اپ (kind new) بھی */
        return Response.json({ ok: true, list: L });
      }
      if (b.act === "reglook") {   /* MCS1211TH333: ایجنٹ / ڈویلپر — سائن اپ شدہ بندے کی ID (یا موبائل) + 4 ہندسوں کا کوڈ → نام، موبائل، ضلع (15 منٹ میں 8 غلط = روک) */
        if (fails >= 8) return Response.json({ ok: false, reason: "wait" });
        const id = b.ids.map((k) => key(k)).find(Boolean) || "";
        const u = id && get(id);
        if (!u || u.del || !u.pk || String(u.pk) !== String(b.pk || "")) { fail(); return Response.json({ ok: false, reason: fails + 1 >= 8 ? "wait" : "nomatch" }); }
        this.sql.exec("DELETE FROM mcsfail WHERE k = ?", failK);
        return Response.json({ ok: true, user: { sid: this.adminSlotOf(u.mobile) || this.staffSid(u.mobile) || this.sidGet(u.mobile) || "", mcsId: this.sidGet(u.mobile) || "", name: u.name, mobile: u.mobile, district: u.district || "" } });
      }
      if (b.act === "find") {   /* لاگ اِن: Account ID / موبائل / ای میل → ہیش واپس (ورکر جانچے) */
        if (fails >= 8) return Response.json({ ok: false, reason: "wait" });
        const id = b.ids.map((k) => key(k)).find(Boolean) || "";
        const u = id && get(id);
        if (!u || u.del) { fail(); return Response.json({ ok: false, reason: "login" }); }
        if (!u._pwh) return Response.json({ ok: false, reason: "no_pw", gmail: !!u.gmail });
        return Response.json({ ok: true, id: u.id, pwh: u._pwh });
      }
      if (b.act === "pwok") { const u = get(b.id); if (!u || u.del) return Response.json({ ok: false, reason: "login" }); this.sql.exec("DELETE FROM mcsfail WHERE k = ?", failK); this.sql.exec("UPDATE mcsuser SET seen = ? WHERE id = ?", now, u.id); return Response.json({ ok: true, tok: await sess(u.id, "p"), user: out(u) }); }
      if (b.act === "fyob") {   /* MCS1711TU505 (مالک کا حکم): PIN بھول گئے — موبائل + پیدائش کا سال = وہیں نیا PIN (ہیلپ ڈیسک کا انتظار نہیں)؛ 15 منٹ میں 6 غلط اور ایک نمبر پر دن میں 5 = روک */
        const mk = "fy:" + b.mobile, mr = this.sql.exec("SELECT n, ts FROM mcsfail WHERE k = ?", mk).toArray()[0], mfails = mr && now - mr.ts < 864e5 ? mr.n : 0;
        if (fails >= 6 || mfails >= 5) return Response.json({ ok: false, reason: "wait" });
        const bumpM = () => this.sql.exec("INSERT INTO mcsfail (k, n, ts) VALUES (?, 1, ?) ON CONFLICT (k) DO UPDATE SET n = CASE WHEN ? - mcsfail.ts < 86400000 THEN mcsfail.n + 1 ELSE 1 END, ts = CASE WHEN ? - mcsfail.ts < 86400000 THEN mcsfail.ts ELSE excluded.ts END", mk, now, now, now);
        const id = key("m:" + b.mobile), u = id ? get(id) : null;
        if (!u || u.del) { fail(); return Response.json({ ok: false, reason: "nomatch" }); }
        if (!u.yob) return Response.json({ ok: false, reason: "noyob" });
        if (String(u.yob) !== String(b.yob)) { fail(); bumpM(); return Response.json({ ok: false, reason: "nomatch" }); }
        this.sql.exec("UPDATE mcsuser SET pwh = ? WHERE id = ?", b.pwh, u.id); this.sql.exec("DELETE FROM mcssess WHERE id = ?", u.id); this.sql.exec("DELETE FROM mcsfail WHERE k = ?", failK);
        u._pwh = b.pwh; return Response.json({ ok: true, tok: await sess(u.id, "p"), user: out(u) });
      }
      if (b.act === "pwbad") { fail(); return Response.json({ ok: false, reason: fails + 1 >= 8 ? "wait" : "login" }); }
      if (b.act === "google") {
        const id = key("g:" + b.gmail) || key("e:" + b.gmail);
        const u = id && get(id);
        if (!u || u.del) return Response.json({ ok: false, reason: "new", gmail: b.gmail });
        if (!u.gmail) { u.gmail = b.gmail; this.sql.exec("UPDATE mcsuser SET data = ? WHERE id = ?", JSON.stringify(Object.assign({}, u, { _pwh: undefined })), u.id); this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) VALUES (?, ?)", "g:" + b.gmail, u.id); }
        this.sql.exec("UPDATE mcsuser SET seen = ? WHERE id = ?", now, u.id);
        return Response.json({ ok: true, tok: await sess(u.id, "g"), user: out(u) });
      }
      if (b.act === "glink") {   /* MCS1611MO476 (مالک کا حکم): Google سے آیا Gmail کسی اکاؤنٹ سے جڑا نہ ہو تو موبائل + PIN والے لاگ اِن کے فوراً بعد اسی اکاؤنٹ سے ہمیشہ کے لیے */
        const u = get(b.id); if (!u || u.del) return Response.json({ ok: false, reason: "login" });
        const other = key("g:" + b.gmail) || key("e:" + b.gmail);
        if (other && other !== u.id) return Response.json({ ok: false, reason: "gmail_taken" });
        if (u.gmail !== b.gmail) { u.gmail = b.gmail; this.sql.exec("UPDATE mcsuser SET data = ? WHERE id = ?", JSON.stringify(Object.assign({}, u, { _pwh: undefined })), u.id); }
        this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) VALUES (?, ?)", "g:" + b.gmail, u.id);
        return Response.json({ ok: true });
      }
      if (b.act === "acctadm") {   /* MCS1511SU444 (مالک کا حکم — «033 والا اکاؤنٹ ڈیلیٹ نہیں ہوتا، 0320 «پہلے سے بنا ہے» کہتا ہے، سرچ میں کہیں نہیں»): صرف ایڈمن — نمبر / MCS ID / ای میل سے سائن اپ اکاؤنٹ ڈھونڈو، یا پورا صاف کرو (اکاؤنٹ + چابیاں + سیشن + ٹوٹی چابی + MCS ID)؛ کاروبار / ممبرشپ کو ہاتھ نہیں لگتا */
        if (!b.admin) return Response.json({ ok: false, reason: "admin_only" });
        if (b.del) {
          const u = b.uid ? get(String(b.uid)) : null, mob = u ? String(u.mobile || "") : String(b.mob || "");
          let keys = 0, sidGone = "";
          if (u) { keys += this.sql.exec("SELECT COUNT(*) AS n FROM mcsukey WHERE id = ?", u.id).toArray()[0].n; this.sql.exec("DELETE FROM mcsukey WHERE id = ?", u.id); this.sql.exec("DELETE FROM mcssess WHERE id = ?", u.id); this.sql.exec("DELETE FROM mcsuser WHERE id = ?", u.id); }
          if (b.k) { const k0 = String(b.k), id0 = key(k0); if (id0 && !get(id0)) { this.sql.exec("DELETE FROM mcsukey WHERE k = ?", k0); keys++; } }
          if (mob) {
            const id1 = key("m:" + mob); if (id1 && !get(id1)) { this.sql.exec("DELETE FROM mcsukey WHERE k = ?", "m:" + mob); keys++; }
            try { const sid = this.sidGet(mob); if (sid && !this.adminSlotOf(mob) && !this.sql.exec("SELECT rec FROM prof").toArray().some((x) => this.sidMob(x.rec) === mob)) { this.sql.exec("DELETE FROM mcssid WHERE mob = ?", mob); this.sql.exec("DELETE FROM mcsukey WHERE k = ?", "a:" + sid); sidGone = sid; this.finLog("sidretire", { sid, why: "admin wipe" }); } } catch (e) {}
          }
          return Response.json({ ok: true, removed: u ? u.id : "", keys, sidGone });
        }
        const mobs = new Set((b.mobs || []).map(String)), idset = new Set(), orphans = [];
        for (const k of (b.keys || [])) { const id0 = key(k); if (!id0) continue; if (get(id0)) idset.add(id0); else orphans.push({ k, id: id0, mob: k.startsWith("m:") ? k.slice(2) : "" }); }
        for (const r of this.sql.exec("SELECT id, data FROM mcsuser").toArray()) { try { const d = JSON.parse(r.data); if (mobs.has(String(d.mobile))) idset.add(r.id); } catch (e) {} }
        const list = [];
        for (const id0 of idset) { const u = get(id0); if (!u) continue; list.push({ uid: u.id, name: u.name || "", mobile: u.mobile || "", sid: this.sidGet(u.mobile) || "", gmail: u.gmail || "", email: u.email || "", hasPw: !!u._pwh, soft: !!u.del }); }
        return Response.json({ ok: true, list, orphans });
      }
      const S = bySess();
      if (!S) return Response.json({ ok: false, reason: "session" });
      if (b.act === "me") return Response.json({ ok: true, user: out(S.u) });
      if (b.act === "setdist") { S.u.district = b.district || ""; const d = Object.assign({}, S.u); delete d._pwh; this.sql.exec("UPDATE mcsuser SET data = ? WHERE id = ?", JSON.stringify(d), S.u.id); return Response.json({ ok: true, user: out(S.u) }); }
      if (b.act === "setname") { S.u.name = b.name; const d = Object.assign({}, S.u); delete d._pwh; this.sql.exec("UPDATE mcsuser SET data = ? WHERE id = ?", JSON.stringify(d), S.u.id); return Response.json({ ok: true, user: out(S.u) }); }   /* MCS1711TU510: اکاؤنٹ کا نام بدلیں */
      if (b.act === "logout") { this.sql.exec("DELETE FROM mcssess WHERE tok = ?", b.th); return Response.json({ ok: true }); }
      if (b.act === "setyob") { S.u.yob = b.yob; const d = Object.assign({}, S.u); delete d._pwh; this.sql.exec("UPDATE mcsuser SET data = ? WHERE id = ?", JSON.stringify(d), S.u.id); return Response.json({ ok: true, user: out(S.u) }); }   /* MCS1711TU505 */
      if (b.act === "setpw") {   /* پاس ورڈ بدلیں — پرانا ٹھیک ہو، یا گوگل سے 15 منٹ کے اندر لاگ اِن ہوا ہو (پاس ورڈ بھول گئے) */
        const yobOk = !!(b.yob && S.u.yob && String(S.u.yob) === String(b.yob));   /* MCS1711TU505: پرانا PIN یاد نہ ہو تو پیدائش کا سال بھی چلتا ہے */
        if (S.u._pwh && !(S.via === "g" && now - S.at < 15 * 60e3) && !b.oldOk && !yobOk) return Response.json({ ok: false, reason: "old", pwh: S.u._pwh });
        if (b.yob && !S.u.yob) { S.u.yob = b.yob; const d = Object.assign({}, S.u); delete d._pwh; this.sql.exec("UPDATE mcsuser SET data = ? WHERE id = ?", JSON.stringify(d), S.u.id); }
        this.sql.exec("UPDATE mcsuser SET pwh = ? WHERE id = ?", b.pwh, S.u.id);
        this.sql.exec("DELETE FROM mcssess WHERE id = ? AND tok != ?", S.u.id, b.th);
        return Response.json({ ok: true });
      }
      if (b.act === "delete") {   /* پلے اسٹور کا اصول: اکاؤنٹ اور اس کی سب چابیاں / سیشن ختم */
        if (S.u._pwh && !(S.via === "g" && now - S.at < 15 * 60e3) && !b.oldOk) return Response.json({ ok: false, reason: "old", pwh: S.u._pwh });
        this.sql.exec("DELETE FROM mcsukey WHERE id = ?", S.u.id); this.sql.exec("DELETE FROM mcssess WHERE id = ?", S.u.id); this.sql.exec("DELETE FROM mcsuser WHERE id = ?", S.u.id);
        try { for (const k0 of ["m:" + S.u.mobile, S.u.email ? "e:" + S.u.email : "", S.u.gmail ? "g:" + S.u.gmail : "", S.u.gmail ? "e:" + S.u.gmail : ""]) if (k0) this.sql.exec("DELETE FROM mcsukey WHERE k = ?", k0); } catch (e) {}   /* MCS1511SU445: حذف پر موبائل / ای میل کی چابی ہر حال میں آزاد */
        /* MCS1511SU443 (مالک کا حکم — «MCS008 بالکل ختم»): اکاؤنٹ حذف ہو اور اس موبائل کی کوئی ممبرشپ نہ ہو تو اس کی MCS ID بھی ریٹائر (دوبارہ سائن اپ پر نئی ID؛ پرانا نمبر کسی کو دوبارہ نہیں)؛ ایڈمن کی MCS001 / MCS002 کبھی نہیں */
        try { const mob = this.sidMob(S.u.mobile); const sid = mob ? this.sidGet(mob) : "";
          if (sid && !this.adminSlotOf(mob) && !this.sql.exec("SELECT rec FROM prof").toArray().some((x) => this.sidMob(x.rec) === mob)) {
            this.sql.exec("DELETE FROM mcssid WHERE mob = ?", mob); this.sql.exec("DELETE FROM mcsukey WHERE k = ?", "a:" + sid); this.finLog("sidretire", { sid, why: "account deleted" }); } } catch (e) {}
        return Response.json({ ok: true });
      }
      return Response.json({ ok: false, reason: "bad_act" });
    }
    if (op === "/mc_chat") {   /* MCS0911MO251 (مالک کا حکم): 💬 My Chats — صارف ↔ PBT، ایجنٹ ↔ PBT، ایجنٹ ↔ اپنے کاروبار والے صارف۔
         عملہ (ڈویلپر / کو-ڈویلپر) کا ہر جواب who='dev' = «PBT Code Labs» — کس نے دیا (`by`) صرف اندر، کسی کو نظر نہیں۔ ایجنٹ ↔ ایجنٹ کوئی راستہ نہیں۔
         دھاگے (agmsg.code): U-<صارف ID> · <ایجنٹ کوڈ> (پرانا پورٹل والا) · B-<ایجنٹ کوڈ>~<صارف ID>؛ CD-… (کو-ڈویلپر ↔ ڈویلپر) یہاں نہیں */
      const b = await request.json(), now = Date.now();
      try { this.sql.exec("ALTER TABLE agmsg ADD COLUMN byw TEXT"); } catch (e) {}
      try { this.sql.exec("ALTER TABLE agmsg ADD COLUMN file TEXT"); } catch (e) {}
      try { this.sql.exec("ALTER TABLE agmsg ADD COLUMN fname TEXT"); } catch (e) {}
      const cfg = (k) => (this.sql.exec("SELECT v FROM agcfg WHERE k = ?", k).toArray()[0] || {}).v;
      const setCfg = (k, v) => this.sql.exec("INSERT INTO agcfg (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", k, String(v));
      const getU = (id) => { const r = this.sql.exec("SELECT data FROM mcsuser WHERE id = ?", id).toArray()[0]; if (!r) return null; const u = JSON.parse(r.data); return u.del ? null : u; };
      const d10 = (x) => String(x || "").replace(/\D/g, "").slice(-10);
      const agents = () => this.sql.exec("SELECT data FROM agent").toArray().map((r) => JSON.parse(r.data)).filter((x) => x.code && x.status === "approved" && !x.off);
      /* اس ایجنٹ کے کاروبار (agref) — مالک کا موبائل کاروبار کی چابی p<10 ہندسے> سے */
      const bizOf = (code) => this.sql.exec("SELECT rk, data FROM agref WHERE code = ?", code).toArray().map((r) => { let d = {}; try { d = JSON.parse(r.data || "{}"); } catch (e) {} const m = /^p(\d{10})/.exec(r.rk || ""); return { rk: r.rk, ph: m ? m[1] : "", name: d.name || d.nameUr || d.biz || "" }; });
      const uidByPh = (ph) => ph ? (this.sql.exec("SELECT id FROM mcsukey WHERE k = ?", "m:92" + ph).toArray()[0] || {}).id || "" : "";
      const linked = (code, uid) => { const u = getU(uid); if (!u) return false; const ph = d10(u.mobile); return !!ph && bizOf(code).some((x) => x.ph === ph); };
      /* — کون؟ — */
      let me = null;
      if (b.as === "dev" && b.admin) me = { staff: true, by: "D" };
      else if (b.as === "cd") { const r = this.cdAuth(b.phone, b.pin); if (r && r.p.chat) me = { staff: true, by: "C:" + b.phone }; }
      else if (b.as === "agent") { const a = agents().find((x) => x.phone === b.phone && x.pin && x.pin === b.pin); if (a) me = { agent: a.code, name: a.name }; }
      else if (b.as === "biz" && b.rec && b.key) { const r = this.sql.exec("SELECT key, data FROM prof WHERE rec = ?", b.rec).toArray()[0]; if (r && r.key && r.key === b.key) { me = { biz: b.rec }; if (b.bn && cfg("bn_" + b.rec) !== b.bn) setCfg("bn_" + b.rec, b.bn); } }   /* MCS1111WE294 (#217): کاروبار کی چابی = اسی فون کا مالک؛ دھاگہ P-<rec> */
      else if (b.as === "user" && b.th) { const r = this.sql.exec("SELECT id FROM mcssess WHERE tok = ?", b.th).toArray()[0]; const u = r && getU(r.id); if (u) me = { uid: u.id, u }; }
      if (!me) return Response.json({ ok: false, reason: "login" });
      const PBT = "PBT Code Labs";
      /* MCS0911MO254 (مالک کا حکم): گول تصویریں — عملہ (D / C:<نمبر>) اور ایجنٹ (A:<کوڈ>) کی؛ عام صارف کو عملے کی تصویر کبھی نہیں (وہاں «PBT Code Labs»)؛ ایجنٹ کو PBT کے ہر جواب پر ڈویلپر (کمپنی) کی تصویر */
      try { this.sql.exec("CREATE TABLE IF NOT EXISTS chatav (k TEXT PRIMARY KEY, img TEXT, ts INTEGER)"); } catch (e) {}
      const myAv = me.by || (me.agent ? "A:" + me.agent : "");
      if (b.op === "av") {
        if (!myAv) return Response.json({ ok: false, reason: "no_av" });
        const img = String(b.img || ""); if (!/^data:image\/(jpeg|png|webp);base64,/.test(img) || img.length > 80000) return Response.json({ ok: false, reason: "bad_img" });
        this.sql.exec("INSERT INTO chatav (k, img, ts) VALUES (?, ?, ?) ON CONFLICT (k) DO UPDATE SET img = excluded.img, ts = excluded.ts", myAv, img, now);
        return Response.json({ ok: true });
      }
      const avOut = (keys) => { const o = {}; for (const k of new Set(keys.filter(Boolean))) { const r = this.sql.exec("SELECT img FROM chatav WHERE k = ?", k).toArray()[0]; if (r) o[k] = r.img; } return o; };
      const acc = (th) => {   /* r = پڑھ سکے، w = لکھ سکے، side = اپنی طرف کا who */
        th = String(th || ""); if (!th) return null;
        if (th.startsWith("CD-")) {   /* MCS0911MO253: ڈویلپر ↔ کو-ڈویلپر — صرف یہی دو (ایجنٹ / صارف کبھی نہیں) */
          if (me.by === "D") return { r: 1, w: 1, side: "dev", cd: 1 };
          if (me.by === "C:" + b.phone && th === "CD-" + b.phone) return { r: 1, w: 1, side: "agent", cd: 1 };
          return null; }
        if (me.staff) { if (th.startsWith("B-")) return { r: 1, w: 0, side: "dev" }; return { r: 1, w: 1, side: "dev" }; }
        if (me.agent) { if (th === me.agent) return { r: 1, w: 1, side: "agent" }; if (th.startsWith("B-" + me.agent + "~") && linked(me.agent, th.slice(3 + me.agent.length))) return { r: 1, w: 1, side: "agent" }; return null; }
        if (me.biz) return th === "P-" + me.biz ? { r: 1, w: 1, side: "user" } : null;
        if (me.uid) { if (th === "U-" + me.uid) return { r: 1, w: 1, side: "user" }; const m = /^B-(.+)~(.+)$/.exec(th); if (m && m[2] === me.uid && linked(m[1], me.uid)) return { r: 1, w: 1, side: "user" }; return null; }
        return null;
      };
      const rdKey = (th) => me.staff && !(th.startsWith("CD-") && me.by !== "D") ? "rd_" + th : "ru_" + (me.agent || me.uid || me.biz || me.by) + "_" + th;
      const sumOf = (th, side) => {
        const lm = this.sql.exec("SELECT who, text, img, audio, ts FROM agmsg WHERE code = ? ORDER BY ts DESC, id DESC LIMIT 1", th).toArray()[0] || null;
        const rd = parseInt(cfg(rdKey(th)) || "0", 10);
        const nw = this.sql.exec("SELECT COUNT(*) AS n FROM agmsg WHERE code = ? AND who != ? AND ts > ?", th, side, rd).toArray()[0].n;
        return { last: lm ? lm.ts : 0, lt: lm ? String(lm.text || (lm.img ? "🖼️" : lm.audio ? "🎤" : "📎")).slice(0, 80) : "", mine: lm ? lm.who === side : false, nw };
      };
      const cdName = (ph) => (this.sql.exec("SELECT name FROM codev WHERE phone = ?", ph).toArray()[0] || {}).name || "";
      const label = (th) => {   /* عملے کے لیے دھاگے کا نام */
        if (th.startsWith("CD-")) return me.by === "D" ? { k: "cd", title: "👥 " + (cdName(th.slice(3)) || "کو-ڈویلپر"), sub: "کو-ڈویلپر · 0" + d10(th.slice(3)) } : { k: "cd", title: "👨‍💻 ڈویلپر", sub: "صرف آپ اور ڈویلپر" };
        if (th.startsWith("P-")) { const rec = th.slice(2); let d = {}; try { d = JSON.parse((this.sql.exec("SELECT data FROM prof WHERE rec = ?", rec).toArray()[0] || {}).data || "{}"); } catch (e) {} const ph = (/^p(\d{10})/.exec(rec) || [])[1] || ""; return { k: "user", title: "🏪 " + (cfg("bn_" + rec) || d.nameUr || ("0" + ph)), sub: "کاروبار · 0" + ph + " · " + rec }; }
        if (th.startsWith("U-")) { const u = getU(th.slice(2)); return { k: "user", title: u ? u.name : th.slice(2), sub: u ? "0" + d10(u.mobile) + " · " + u.id : "" }; }
        if (th.startsWith("B-")) { const m = /^B-(.+)~(.+)$/.exec(th) || []; const a = agents().find((x) => x.code === m[1]); const u = getU(m[2] || ""); return { k: "biz", title: "🤝 " + (a ? a.name : m[1]) + " ↔ " + (u ? u.name : ""), sub: (m[1] || "") + " · " + (u ? "0" + d10(u.mobile) : "") }; }
        const a = agents().find((x) => x.code === th) || (() => { for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code === th) return x; } return null; })();
        return { k: "agent", title: "🤝 " + (a ? a.name : th), sub: th + (a && a.phone ? " · 0" + d10(a.phone) : "") };
      };
      if (b.op === "list") {
        let L = [];
        if (me.staff) {
          L = this.sql.exec("SELECT code, MAX(ts) AS last FROM agmsg GROUP BY code ORDER BY last DESC LIMIT 400").toArray().filter((t) => !String(t.code).startsWith("CD-")).map((t) => Object.assign({ th: t.code }, label(t.code), sumOf(t.code, "dev")));
          if (me.by === "D") for (const r of this.sql.exec("SELECT phone FROM codev").toArray()) { const th = "CD-" + r.phone; L.push(Object.assign({ th }, label(th), sumOf(th, "dev"))); }
          else { const th = "CD-" + b.phone; L.push(Object.assign({ th }, label(th), sumOf(th, "agent"), { pin: 1 })); }
        } else if (me.agent) {
          L.push(Object.assign({ th: me.agent, k: "pbt", title: PBT, sub: "سوال، مسئلہ، مدد" }, sumOf(me.agent, "agent")));
          const seen = new Set();
          for (const x of bizOf(me.agent)) { if (!x.ph || seen.has(x.ph)) continue; seen.add(x.ph); const uid = uidByPh(x.ph); const u = uid && getU(uid);
            if (u) { const th = "B-" + me.agent + "~" + uid; L.push(Object.assign({ th, k: "biz", title: x.name || u.name, sub: u.name + " · 0" + x.ph }, sumOf(th, "agent"))); }
            else L.push({ th: "", k: "biz", title: x.name || ("0" + x.ph), sub: "0" + x.ph + " · ابھی ایپ میں اکاؤنٹ نہیں", off: 1 }); }
        } else if (me.biz) {
          L.push(Object.assign({ th: "P-" + me.biz, k: "pbt", title: PBT, sub: "سوال، مسئلہ، مشورہ" }, sumOf("P-" + me.biz, "user")));
        } else {
          L.push(Object.assign({ th: "U-" + me.uid, k: "pbt", title: PBT, sub: "سوال، مسئلہ، مشورہ" }, sumOf("U-" + me.uid, "user")));
          const ph = d10(me.u.mobile), done = new Set();
          if (ph) for (const r of this.sql.exec("SELECT code FROM agref WHERE rk LIKE ?", "p" + ph + "%").toArray()) { if (done.has(r.code)) continue; done.add(r.code); const a = agents().find((x) => x.code === r.code); if (!a) continue; const th = "B-" + a.code + "~" + me.uid; L.push(Object.assign({ th, k: "agent", title: "🤝 " + a.name, sub: "آپ کا MCS ایجنٹ" }, sumOf(th, "user"))); }
        }
        L.sort((x, y) => (x.k === "pbt" || x.pin ? -1 : 0) - (y.k === "pbt" || y.pin ? -1 : 0) || (y.last || 0) - (x.last || 0));
        for (const x of L) { const th = x.th || "";
          if (me.uid || me.biz) x.av = "";
          else if (me.agent) x.av = x.k === "pbt" ? "D" : "";
          else if (th.startsWith("CD-")) x.av = me.by === "D" ? "C:" + th.slice(3) : "D";
          else if (th.startsWith("B-")) { const m = /^B-(.+)~/.exec(th); x.av = m ? "A:" + m[1] : ""; }
          else if (!th.startsWith("U-") && !th.startsWith("P-")) x.av = "A:" + th;
          else x.av = ""; }
        return Response.json({ ok: true, staff: !!me.staff, list: L, nw: L.reduce((n, x) => n + (x.nw || 0), 0), avs: avOut(L.map((x) => x.av)) });
      }
      if (b.op === "find") {   /* MCS0911MO255 (ہیلپ ڈیسک #168): ➕ نئی چیٹ — عملہ کسی بھی صارف (نام / موبائل / ID / کاروبار کا نمبر) یا ایجنٹ کو ڈھونڈ کر چیٹ شروع کرے */
        if (!me.staff) return Response.json({ ok: false, reason: "no_access" });
        const q = String(b.text || "").trim().toLowerCase(), qd = q.replace(/\D/g, ""), out = [];
        for (const a of agents()) { const hay = [a.name, a.code, a.phone, a.city].join(" ").toLowerCase(); if (!q || hay.includes(q) || (qd.length >= 4 && String(a.phone || "").includes(qd.slice(-10)))) out.push({ th: a.code, k: "agent", title: "🤝 " + a.name, sub: a.code + " · 0" + d10(a.phone) + (a.city ? " · " + a.city : ""), av: "A:" + a.code }); }
        const phones = String(b.phones || "").split(",").map((x) => x.replace(/\D/g, "").slice(-10)).filter((x) => x.length === 10).slice(0, 40);
        const seen = new Set();
        const addU = (u, why) => { if (!u || u.del || seen.has(u.id)) return; seen.add(u.id); out.push({ th: "U-" + u.id, k: "user", title: u.name || u.id, sub: (why ? why + " · " : "") + "0" + d10(u.mobile) + " · " + u.id, av: "" }); };
        for (const ph of phones) { const id = uidByPh(ph); if (id) addU(getU(id), (b.pn || {})[ph] || ""); }
        if (q) { for (const r of this.sql.exec("SELECT data FROM mcsuser ORDER BY ts DESC LIMIT 3000").toArray()) { if (out.length >= 60) break; let u; try { u = JSON.parse(r.data); } catch (e) { continue; }
            const hay = [u.name, u.id, u.email].join(" ").toLowerCase(); if (hay.includes(q) || (qd.length >= 4 && String(u.mobile || "").includes(qd.length > 10 ? qd.slice(-10) : qd))) addU(u, ""); } }
        else for (const r of this.sql.exec("SELECT data FROM mcsuser ORDER BY ts DESC LIMIT 25").toArray()) { try { addU(JSON.parse(r.data), ""); } catch (e) {} }
        return Response.json({ ok: true, list: out.slice(0, 80), avs: avOut(out.map((x) => x.av)) });
      }
      const A = acc(b.thr); if (!A) return Response.json({ ok: false, reason: "no_access" });
      if (b.op === "send") {
        if (!A.w) return Response.json({ ok: false, reason: "read_only" });
        if (!(b.text || b.img || b.audio || b.file)) return Response.json({ ok: false, reason: "empty" });
        this.sql.exec("INSERT INTO agmsg (code, who, text, img, audio, ts, byw, file, fname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", b.thr, A.side, String(b.text || "").slice(0, 2000), String(b.img || ""), String(b.audio || ""), now, me.by || me.agent || me.uid || me.biz || "", String(b.file || ""), String(b.fname || "").slice(0, 120));
      }
      setCfg(rdKey(b.thr), now);
      const rows = this.sql.exec("SELECT id, who, text, img, audio, ts, byw, file, fname FROM agmsg WHERE code = ? ORDER BY ts DESC, id DESC LIMIT 200", b.thr).toArray().reverse();
      const th0 = String(b.thr);
      const avOf = (m) => {
        if (me.uid || me.biz) return "";   /* عام صارف: کسی کی تصویر نہیں */
        if (th0.startsWith("CD-")) return m.who === "dev" ? "D" : "C:" + th0.slice(3);
        if (m.who === "agent") { if (th0.startsWith("B-")) { const x = /^B-(.+)~/.exec(th0); return x ? "A:" + x[1] : ""; } return "A:" + th0; }
        if (m.who === "dev") return me.agent ? "D" : (m.byw && /^(D|C:\d+)$/.test(m.byw) ? m.byw : "D");
        return ""; };
      const nameOf = (who) => A.cd ? (who === "dev" ? "👨‍💻 ڈویلپر" : "👥 " + (cdName(String(b.thr).slice(3)) || "کو-ڈویلپر")) : who === "dev" ? PBT : who === "agent" ? "🤝 MCS ایجنٹ" : "صارف";
      const out = rows.map((m) => ({ id: m.id, mine: m.who === A.side, who: m.who, name: nameOf(m.who), av: avOf(m), text: m.text || "", img: m.img || "", audio: m.audio || "", file: m.file || "", fname: m.fname || "", ts: m.ts }));
      return Response.json({ ok: true, w: A.w, cd: !!A.cd, title: me.staff ? label(b.thr).title : null, msgs: out, avs: avOut(out.map((m) => m.mine ? "" : m.av)) });
    }
    if (op.startsWith("/pp_")) return this.ppOp(op, await request.json());
    if (op === "/fin2") return this.fin2(await request.json());
    if (op === "/cd_login") {   /* کو-ڈویلپر: موبائل + PIN → نام (صرف جانچ موڈ کھلتا ہے) */
      const b = await request.json();
      const r = this.cdAuth(b.phone, b.pin);
      if (!r) return Response.json({ ok: false, reason: "login" });
      const day = Math.floor(Date.now() / 864e5); if (r.seen !== day) this.sql.exec("UPDATE codev SET seen = ? WHERE phone = ?", day, b.phone);
      return Response.json({ ok: true, name: r.name, perms: r.p });
    }
    if (op === "/cd_chat") {   /* AGP0511TH006 (مالک کا حکم): کو-ڈویلپر ↔ ڈویلپر چیٹ — صرف اپنا دھاگہ (code = CD-<نمبر>) */
      const b = await request.json();
      const r = this.cdAuth(b.phone, b.pin);
      if (!r) return Response.json({ ok: false, reason: "login" });
      const code = "CD-" + b.phone;
      if (b.act === "msg") this.sql.exec("INSERT INTO agmsg (code, who, text, img, audio, ts) VALUES (?, 'agent', ?, ?, ?, ?)", code, String(b.text || "").slice(0, 2000), String(b.img || ""), String(b.audio || ""), Date.now());
      return Response.json({ ok: true, name: r.name, msgs: this.sql.exec("SELECT id, who, text, img, audio, ts FROM agmsg WHERE code = ? ORDER BY ts DESC LIMIT 200", code).toArray().reverse() });
    }
    if (op === "/cd_fin") {   /* AGP0511TH005 (مالک کا حکم): کو-ڈویلپر — کمپنی کا حساب صرف دیکھنا (کچھ بدل نہیں سکتا) */
      const b = await request.json();
      const r = this.cdAuth(b.phone, b.pin);
      if (!r) return Response.json({ ok: false, reason: "login" });
      if (!r.p.company) return Response.json({ ok: false, reason: "no_perm" });   /* MCS1511SU458: کمپنی کا کل حساب صرف اجازت سے */
      return Response.json(Object.assign(this.finData(b.mon), { name: r.name }));
    }
    if (op === "/cd_admin") {   /* مالک (MCS ایڈمن): فہرست / شامل (نیا PIN) / ہٹائیں */
      const b = await request.json();
      /* MCS1511SU458 (مالک کا حکم): add = نیا ایڈمن (یا نیا PIN)، off = ایڈمن کا کردار ختم (پچھلی کمائی محفوظ، آگے حصہ نہیں)، on = بحال (نیا PIN)، perms = اجازتیں */
      const now = Date.now(), ex = this.sql.exec("SELECT phone FROM codev WHERE phone = ?", b.phone).toArray().length;
      if (b.op === "add" || b.op === "on") { this.splitEnsure("auto: admin " + b.op); const pin = String(100000 + Math.floor(Math.random() * 900000));
        if (ex) { const o = this.sql.exec("SELECT offp FROM codev WHERE phone = ?", b.phone).toArray()[0]; let p = []; try { p = JSON.parse((o && o.offp) || "[]") || []; } catch (e) {} if (p.length && !p[p.length - 1][1]) p[p.length - 1][1] = now;
          this.sql.exec("UPDATE codev SET pin = ?, off = 0, offts = NULL, offp = ?" + (b.name ? ", name = ?" : "") + " WHERE phone = ?", ...(b.name ? [pin, JSON.stringify(p), b.name, b.phone] : [pin, JSON.stringify(p), b.phone])); }
        else if (b.op === "add") this.sql.exec("INSERT INTO codev (phone, name, pin, ts, seen, perms) VALUES (?, ?, ?, ?, 0, ?)", b.phone, b.name, pin, now, JSON.stringify(b.perms || { biz: 1, chat: 1, help: 1, accounts: 1 }));
        this.finLog("admin_" + b.op, { phone: b.phone, name: b.name }); }
      if (b.op === "off" && ex) { this.splitEnsure("auto: admin off"); const o = this.sql.exec("SELECT offp, COALESCE(off, 0) AS off FROM codev WHERE phone = ?", b.phone).toArray()[0]; let p = []; try { p = JSON.parse((o && o.offp) || "[]") || []; } catch (e) {} if (!o.off) p.push([now, 0]);
        this.sql.exec("UPDATE codev SET off = 1, offts = ?, offp = ?, pin = '' WHERE phone = ?", now, JSON.stringify(p), b.phone); this.finLog("admin_off", { phone: b.phone }); }
      if (b.op === "perms" && ex) { const p = {}; for (const k of McsStats.CD_PERMS) p[k] = b.perms && b.perms[k] ? 1 : 0; this.sql.exec("UPDATE codev SET perms = ? WHERE phone = ?", JSON.stringify(p), b.phone); this.finLog("admin_perms", { phone: b.phone, p }); }
      if (b.op === "del") this.sql.exec("DELETE FROM codev WHERE phone = ?", b.phone);
      return Response.json({ ok: true, list: this.sql.exec("SELECT phone, name, pin, ts, seen, perms, COALESCE(off, 0) AS off, offts FROM codev ORDER BY ts DESC").toArray().map((r) => Object.assign(r, { perms: this.cdPerms(r) })) });
    }
    if (!this._agMig) { this._agMig = 1; try { this.idFmt1(); } catch (e) {} try { this.admCode1(); } catch (e) {} try { this.agSlots430(); } catch (e) {} try { this.agSlot486(); } catch (e) {} try { if (!this._af431) { this._af431 = 1; this.adminFix431(); } } catch (e) {} try { this.agMigrate(); } catch (e) {} try { this.agMigrate3(); } catch (e) {} try { this.subFix450(); } catch (e) {} }
    if (op === "/ag_free") {   /* MCS1611MO487: خالی (پہلے الاٹ ہو کر آزاد ہوئے) AG نمبر — صرف نمبر، کوئی ذاتی معلومات نہیں */
      return Response.json({ ok: true, free: this.agFreeList() });
    }
    if (op === "/ag_find") {   /* MCS0511TH142: کوڈ / پرانا کوڈ / موبائل → ایجنٹ کا اصل کوڈ اور نام (لکھنا کچھ نہیں) */
      const b = await request.json(); const ag = this.agResolve(b.code, b.phone);
      return Response.json(ag ? { ok: true, code: ag.code, name: ag.name } : { ok: false, reason: "bad_code" });
    }
    if (op === "/ag_propose") {   /* MCS0511TH139: کو-ڈویلپر ایجنٹ تجویز کرے → ⏳ نئی درخواست، منظوری صرف مالک */
      const b = await request.json(); const c = b.c || {};
      const cd = this.cdAuth(b.cphone, b.cpin);
      if (!cd) return Response.json({ ok: false, reason: "login" });
      if (!cd.p.agents) return Response.json({ ok: false, reason: "no_perm" });
      if (this.sql.exec("SELECT id FROM agent WHERE phone = ?", c.phone).toArray().length) return Response.json({ ok: false, reason: "exists" });
      for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code === c.code || x.bizRk === c.code) return Response.json({ ok: false, reason: "code_taken" }); }
      { const st = this.agStaffCnic(c.cnic); if (st) return Response.json({ ok: false, reason: "cnic_staff", other: st }); } { const o = this.agCnicOwner(c.cnic); if (o) return Response.json({ ok: false, reason: "cnic_taken", other: o.name }); }
      const now = Date.now(), id = "A" + now.toString(36) + Math.random().toString(36).slice(2, 5);
      const d = { id, name: c.name, phone: c.phone, city: c.city, biz: c.biz || "", bizRk: c.code, code: "", pin: "", status: "pending", at: now, upd: now, byCodev: cd.name, dev: "", ref: refNorm(String(c.ref || "").slice(0, 40)), mcsId: String(c.mcsId || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 20), cnic: c.cnic || "", father: "", address: "", wa: "", email: "", exp: "👥 کو-ڈویلپر " + cd.name + " نے تجویز کیا", note: "" };
      this.sql.exec("INSERT INTO agent (id, phone, data, ts) VALUES (?, ?, ?, ?)", id, c.phone, JSON.stringify(d), now);
      return Response.json({ ok: true });
    }
    if (op === "/ag_docs") {   /* MCS0511TH139: ایجنٹ خود (نمبر + PIN + اسی فون) شناختی کارڈ نمبر اور تین تصویریں لگائے */
      const b = await request.json();
      const r = this.sql.exec("SELECT data FROM agent WHERE phone = ?", b.phone).toArray()[0]; if (!r) return Response.json({ ok: false, reason: "login" });
      const d = JSON.parse(r.data); if (!d.pin || d.pin !== b.pin || d.dev !== b.dev) return Response.json({ ok: false, reason: "login" });
      { const st = this.agStaffCnic(b.cnic); if (st) return Response.json({ ok: false, reason: "cnic_staff", other: st }); } { const o = this.agCnicOwner(b.cnic, d.id), row = this.agCnicRow(b.cnic); if (o || (row && row.code !== d.code)) return Response.json({ ok: false, reason: "cnic_taken" }); }
      d.cnic = b.cnic; if (b.father) d.father = b.father; d.docsAt = Date.now();
      if (d.code) this.sql.exec("INSERT OR IGNORE INTO agcnic (cnic, code, id, ts) VALUES (?, ?, ?, ?)", String(b.cnic).replace(/\D/g, ""), d.code, d.id, Date.now());
      this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), d.id);
      for (const k of ["front", "back", "selfie"]) this.sql.exec("INSERT INTO agimg (id, kind, data) VALUES (?, ?, ?) ON CONFLICT (id, kind) DO UPDATE SET data = excluded.data", d.id, k, b.img[k]);
      return Response.json({ ok: true });
    }
    if (op === "/ag_admin") {   /* ایڈمن: فہرست، تصویریں، منظور (کوڈ MCS-AG-0001…)، رد، حذف */
      const b = await request.json();
      if (b.op === "list") return Response.json({ ok: true, list: this.sql.exec("SELECT data FROM agent ORDER BY ts DESC LIMIT 1000").toArray().map((r) => { const d = JSON.parse(r.data); if (d.code) { d.refs = this.sql.exec("SELECT COUNT(*) AS n FROM agref WHERE code = ?", d.code).toArray()[0].n; d.newProofs = this.sql.exec("SELECT COUNT(*) AS n FROM agproof WHERE code = ? AND done = 0", d.code).toArray()[0].n; } return d; }), rate: parseInt((this.sql.exec("SELECT v FROM agcfg WHERE k = 'rate'").toArray()[0] || {}).v || "0", 10) || 0 });
      if (b.op === "fin") return Response.json(this.finData(b.mon));
      if (b.op === "recode") return Response.json(this.agRecode(String(b.id || "")));
      /* AGP0511TH006: ڈویلپر کا سب چیٹس والا ڈبہ — ہر ایجنٹ / کو-ڈویلپر کا الگ دھاگہ، نئے پیغام گنتی */
      if (b.op === "inbox") {
        const names = {}; for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code) names[x.code] = x.name; }
        for (const r of this.sql.exec("SELECT phone, name FROM codev").toArray()) names["CD-" + r.phone] = r.name;
        const list = this.sql.exec("SELECT code, MAX(ts) AS last FROM agmsg GROUP BY code ORDER BY last DESC").toArray().map((t) => {
          const rd = parseInt((this.sql.exec("SELECT v FROM agcfg WHERE k = ?", "rd_" + t.code).toArray()[0] || {}).v || "0", 10);
          const lm = this.sql.exec("SELECT who, text, img, audio FROM agmsg WHERE code = ? ORDER BY ts DESC LIMIT 1", t.code).toArray()[0] || {};
          const nw = this.sql.exec("SELECT COUNT(*) AS n FROM agmsg WHERE code = ? AND who != 'dev' AND ts > ?", t.code, rd).toArray()[0].n;
          return { code: t.code, cd: t.code.startsWith("CD-"), name: names[t.code] || "", last: t.last, nw, lt: String(lm.text || (lm.img ? "🖼️" : lm.audio ? "🎤" : "")).slice(0, 80), lw: lm.who };
        });
        const cds = this.sql.exec("SELECT phone, name FROM codev").toArray().map((r) => ({ code: "CD-" + r.phone, name: r.name, cd: true }));
        return Response.json({ ok: true, list, cds });
      }
      if (b.op === "thread") {
        if (b.text || b.img || b.audio) this.sql.exec("INSERT INTO agmsg (code, who, text, img, audio, ts) VALUES (?, 'dev', ?, ?, ?, ?)", b.code, String(b.text || "").slice(0, 2000), String(b.img || ""), String(b.audio || ""), Date.now());
        this.sql.exec("INSERT INTO agcfg (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", "rd_" + b.code, String(Date.now()));
        return Response.json({ ok: true, msgs: this.sql.exec("SELECT id, who, text, img, audio, ts FROM agmsg WHERE code = ? ORDER BY ts DESC LIMIT 200", b.code).toArray().reverse() });
      }   /* MCS0511TH158: مہینے کا کمپنی حساب */
      if (b.op === "gcut") { const mon = String(b.mon || "").replace(/[^0-9_]/g, "").slice(0, 7); if (b.amount === "" || b.amount == null) this.sql.exec("DELETE FROM agcfg WHERE k = ?", "gcut_" + mon); else this.sql.exec("INSERT INTO agcfg (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", "gcut_" + mon, String(Math.max(0, parseInt(b.amount, 10) || 0))); return Response.json({ ok: true }); }
      if (b.op === "rate") { this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('rate', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", String(Math.max(0, parseInt(b.amount, 10) || 0))); return Response.json({ ok: true }); }
      if (b.op === "pay") { this.sql.exec("INSERT INTO agpay (code, amount, note, ts) VALUES (?, ?, ?, ?)", String(b.code || ""), parseInt(b.amount, 10) || 0, String(b.note || "").slice(0, 200), Date.now()); return Response.json({ ok: true }); }
      if (b.op === "unpay") { this.sql.exec("DELETE FROM agpay WHERE id = ?", parseInt(b.pid, 10) || 0); return Response.json({ ok: true }); }
      if (b.op === "create") {   /* MCS0511TH139: مالک خود ایجنٹ بنائے — نام، موبائل، پروفائل ID، شہر؛ فوراً منظور + PIN؛ تصویریں بعد میں ایجنٹ خود */
        const c = b.c || {};
        if (this.sql.exec("SELECT id FROM agent WHERE phone = ?", c.phone).toArray().length) return Response.json({ ok: false, reason: "exists" });
        if (c.code) for (const r of this.sql.exec("SELECT data FROM agent").toArray()) if (JSON.parse(r.data).bizRk === c.code) return Response.json({ ok: false, reason: "code_taken" });
        { const st = this.agStaffCnic(c.cnic); if (st) return Response.json({ ok: false, reason: "cnic_staff", other: st }); } { const o = this.agCnicOwner(c.cnic); if (o) return Response.json({ ok: false, reason: "cnic_taken", other: o.name + (o.code ? " (" + o.code + ")" : "") }); }
        const now = Date.now(), id = "A" + now.toString(36) + Math.random().toString(36).slice(2, 5);
        if (!this.agBizOf(c.code, c.phone)) return Response.json({ ok: false, reason: "no_biz" });   /* MCS1111WE312: ایجنٹ وہی جس کا کاروبار جڑا ہو */
        const d = { id, name: c.name, phone: c.phone, city: c.city, biz: c.biz || "", bizRk: c.code, code: this.agCodeFor(c.cnic, c.code, id, c.phone), pin: String(100000 + Math.floor(Math.random() * 900000)), status: "approved", okAt: now, at: now, upd: now, byOwner: 1, dev: "", ref: refNorm(String(c.ref || "").slice(0, 40)), mcsId: String(c.mcsId || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 20), cnic: c.cnic || "", father: c.father || "", address: c.address || "", wa: c.wa || "", email: c.email || "", exp: "", note: "", noBiz: c.code ? 0 : 1 };
        this.sql.exec("INSERT INTO agent (id, phone, data, ts) VALUES (?, ?, ?, ?)", id, c.phone, JSON.stringify(d), now);
        for (const k of ["front", "back", "selfie"]) if (c.img && c.img[k]) this.sql.exec("INSERT INTO agimg (id, kind, data) VALUES (?, ?, ?) ON CONFLICT (id, kind) DO UPDATE SET data = excluded.data", id, k, c.img[k]);
        return Response.json({ ok: true, agent: d });
      }
      if (b.op === "agpin") {   /* AGP0511TH012: ڈویلپر — ایجنٹ کا PIN دیکھیں یا نیا بنائیں (ایجنٹ بھول جائے) */
        for (const r of this.sql.exec("SELECT id, data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code && x.code === b.code) { if (b.note === "new" || !x.pin) { x.pin = String(100000 + Math.floor(Math.random() * 900000)); this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(x), r.id); } return Response.json({ ok: true, pin: x.pin, phone: x.phone, name: x.name }); } }
        return Response.json({ ok: false, reason: "none" });
      }
      if (b.op === "free") {   /* MCS1611MO487 (مالک کا حکم): ایجنٹ ختم — AG نمبر آزاد، اگلے نئے ایجنٹ کو ملے؛ MCS ID / شناختی کارڈ ویسے؛ پرانا حساب الگ محفوظ کوڈ پر */
        for (const r of this.sql.exec("SELECT id, data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code && x.code === b.code) { const fc = this.agFreeCode(x); return Response.json({ ok: !!fc, free: this.agFreeList(), reason: fc ? "" : "admin_code" }); } }
        return Response.json({ ok: false, reason: "none" });
      }
      if (b.op === "deact" || b.op === "react") {   /* AGP0511TH011: ایجنٹ غیر فعال / دوبارہ فعال (کوڈ اور پرانا حساب ویسا) */
        for (const r of this.sql.exec("SELECT id, data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code && x.code === b.code) { if (x.freedCode && b.op === "react") return Response.json({ ok: false, reason: "freed" }); x.off = b.op === "deact"; x.offAt = x.off ? Date.now() : 0; this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(x), r.id); this.agNote("A:" + x.code, "status", x.off ? "⛔ آپ کا ایجنٹ اکاؤنٹ عارضی طور پر غیر فعال کر دیا گیا" : "✅ آپ کا ایجنٹ اکاؤنٹ دوبارہ فعال"); return Response.json({ ok: true, off: x.off }); } }
        return Response.json({ ok: false, reason: "none" });
      }
      if (b.op === "proofdone") { this.sql.exec("UPDATE agproof SET done = 1 WHERE id = ?", parseInt(b.pid, 10) || 0); return Response.json({ ok: true }); }
      const r = this.sql.exec("SELECT data FROM agent WHERE id = ?", b.id).toArray()[0]; if (!r) return Response.json({ ok: false, reason: "none" });
      const d = JSON.parse(r.data);
      if (b.op === "imgs") return Response.json({ ok: true, img: Object.fromEntries(this.sql.exec("SELECT kind, data FROM agimg WHERE id = ?", b.id).toArray().map((x) => [x.kind, x.data])) });
      if (b.op === "delete") { try { this.agFreeCode(d); } catch (e) {} this.sql.exec("DELETE FROM agent WHERE id = ?", b.id); this.sql.exec("DELETE FROM agimg WHERE id = ?", b.id); return Response.json({ ok: true }); }   /* MCS1611MO487: حذف = AG نمبر آزاد (پرانا حساب الگ محفوظ کوڈ پر) */
      if (b.op === "approve") {
        { const st = this.agStaffCnic(d.cnic); if (st) return Response.json({ ok: false, reason: "cnic_staff", other: st }); } { const o = this.agCnicOwner(d.cnic, d.id); if (o && o.status === "approved") return Response.json({ ok: false, reason: "cnic_taken", other: o.name + " (" + o.code + ")" }); }
        if (!d.code || /^p\d/.test(d.code)) { if (String(d.cnic || "").replace(/\D/g, "").length !== 13) return Response.json({ ok: false, reason: "bad_cnic" }); d.code = this.agCodeFor(d.cnic, d.bizRk, d.id, d.phone); if (!d.code) return Response.json({ ok: false, reason: "no_biz" }); }   /* MCS1111WE312: AG-<سسٹم ID کا نمبر>؛ کاروبار لازمی */
        if (!d.pin) d.pin = String(100000 + Math.floor(Math.random() * 900000));
        d.status = "approved"; d.okAt = Date.now();
      } else if (b.op === "reject") { d.status = "rejected"; d.note = String(b.note || "").slice(0, 300); }
      else if (b.op === "pending") d.status = "pending";
      else return Response.json({ ok: false, reason: "bad_op" }, { status: 400 });
      this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), b.id);
      return Response.json({ ok: true, agent: d });
    }
    if (op === "/ent_codefail") {   /* غلط کوڈ کی گنتی — ایک فون سے 15 منٹ میں 10 غلط کے بعد روک */
      const b = await request.json(); const now = Date.now();
      this.sql.exec("CREATE TABLE IF NOT EXISTS entfail (dev TEXT PRIMARY KEY, n INTEGER, ts INTEGER)");
      const r = this.sql.exec("SELECT n, ts FROM entfail WHERE dev = ?", b.dev).toArray()[0];
      const cur = r && now - r.ts < 9e5 ? r.n : 0;
      if (b.act === "check") return Response.json({ blocked: cur >= 10 });
      if (b.act === "clear") { this.sql.exec("DELETE FROM entfail WHERE dev = ?", b.dev); return Response.json({ ok: true }); }
      this.sql.exec("INSERT INTO entfail (dev, n, ts) VALUES (?, ?, ?) ON CONFLICT (dev) DO UPDATE SET n = excluded.n, ts = excluded.ts", b.dev, cur + 1, r && now - r.ts < 9e5 ? r.ts : now);
      return Response.json({ ok: true });
    }
    if (op === "/ent_dev") {   /* AIO0411WE161: ڈویلپر نے یہ فون (UID) جوڑا ہے؟ — گاہک کا فون خود کھلے */
      const b = await request.json();
      for (const r of this.sql.exec("SELECT data FROM ent WHERE app = ?", b.app).toArray()) {
        const e = JSON.parse(r.data); const c = (e.claims || []).find((x) => x.dev === b.dev);
        if (!c || e.revoked) continue;
        if (Date.now() - (c.seen || c.at || 0) > 864e5) { c.seen = Date.now(); this.entPut(e); }
        const o = this.entOut(e); const key = (e.keys || []).find((k) => k.startsWith("p:")) || (e.keys || [])[0] || ""; delete o.keys; o.id = undefined; o.key = key; return Response.json(o);
      }
      return Response.json({ ok: false, reason: "none" });
    }
    if (op === "/ent_admin") {   /* ڈویلپر: دینا / بڑھانا، فہرست، بند، فون صاف، حذف */
      const b = await request.json();
      const now = Date.now();
      if (b.op === "list") return Response.json({ ok: true, list: this.sql.exec("SELECT data FROM ent WHERE app = ? ORDER BY ts DESC LIMIT 1000", b.app).toArray().map((r) => { const e = JSON.parse(r.data); return Object.assign(this.entOut(e), { note: e.note || "", at: e.at || 0, claims: e.claims || [], pin: e.pin || "", pend: e.pend || null, redeemed: e.redeemed || 0, label: e.label || "", code: e.code || ((e.keys || []).find((k) => k.startsWith("c:")) || "").slice(2), pkgId: e.pkgId || "", pkgName: e.pkgName || "", usedAt: e.usedAt || 0, biz: e.biz || "" }); }) });
      if (b.op === "pkglist") return Response.json({ ok: true, list: this.entPkgList(b.app) });
      if (b.op === "pkgsave") {   /* پیکج بنانا / بدلنا — id خالی ہو تو نیا */
        this.entPkgList(b.app);
        const p = b.pkg || {};
        const prefix = String(p.prefix || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").replace(/^-+|-+$/g, "").slice(0, 14);
        const days = Math.max(0, Math.min(36500, parseInt(p.days, 10) || 0)), devices = Math.max(1, Math.min(20, parseInt(p.devices, 10) || 1)), life = !!p.life;
        if (prefix.replace(/-/g, "").length < 2) return Response.json({ ok: false, reason: "bad_prefix" });
        if (!life && !days) return Response.json({ ok: false, reason: "no_days" });
        const dup = this.entPkgList(b.app).find((x) => x.prefix === prefix && x.id !== p.id);
        if (dup) return Response.json({ ok: false, reason: "prefix_taken" });
        const id = String(p.id || "").replace(/[^a-z0-9-]/g, "").slice(0, 40) || ("p" + now.toString(36));
        const old = this.entPkgList(b.app).find((x) => x.id === id) || {};
        const d = { id, prefix, name: String(p.name || prefix).slice(0, 80), days: life ? 0 : days, devices, life, sku: old.sku || "", active: p.active !== false, sort: old.sort || (this.entPkgList(b.app).length + 1) };
        this.sql.exec("INSERT INTO entpkg (k, app, data, ts) VALUES (?, ?, ?, ?) ON CONFLICT (k) DO UPDATE SET data = excluded.data, ts = excluded.ts", b.app + "|" + id, b.app, JSON.stringify(d), now);
        return Response.json({ ok: true, pkg: d });
      }
      if (b.op === "pkgdel") { this.sql.exec("DELETE FROM entpkg WHERE k = ?", b.app + "|" + String(b.pkgId || "").slice(0, 40)); return Response.json({ ok: true }); }
      /* MCS1711TU500 (مالک کا حکم): MCS کا کوڈ ایک ہی بندے کا — MCS نمبر سے: کوڈ = ممبرشپ ID + 6 خفیہ حروف (MCS008M1-K7Q9XA)، صرف اسی موبائل کے کاروبار پر چلے؛ «12M» / تاریخ نہیں */
      const mcsLook = (v) => {
        const m = /^(MCS\d{1,5})(M\d{1,2})?$/.exec(String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "")); if (!m) return null;
        const num = m[1].slice(3).padStart(3, "0"), s = this.sql.exec("SELECT mob, sid, subn FROM mcssid").toArray().find((r) => String(r.sid).replace(/[^A-Z0-9]/gi, "").toUpperCase() === "MCS" + num); if (!s) return null;
        const recs = this.sql.exec("SELECT rec, until FROM prof WHERE rec LIKE ?", "p" + String(s.mob).slice(2) + "_%").toArray();
        let sub = m[2] ? "MCS" + num + m[2] : ""; if (!sub) for (const r of recs) { const x = String(this.subOf(r.rec) || "").replace(/-/g, ""); if (x) { sub = x; break; } }
        if (!sub) sub = "MCS" + num + "M1";   /* ابھی کوئی ممبرشپ نہیں = پہلی (M1) — کوڈ لگتے ہی یہی نمبر اسی کاروبار کو (/pcode) */
        const k2 = this.sql.exec("SELECT id FROM mcsukey WHERE k = ?", "m:" + s.mob).toArray()[0], r2 = k2 && this.sql.exec("SELECT data FROM mcsuser WHERE id = ?", k2.id).toArray()[0];
        let u = {}; try { u = r2 ? JSON.parse(r2.data) : {}; } catch (e) {}
        const live = recs.reduce((a, r) => Math.max(a, r.until || 0), 0);
        return { sid: "MCS" + num, sub, mob: s.mob, name: u.name || this.finCfg("sidname_" + s.mob, "") || "", until: live };
      };
      if (b.op === "mcslook") { const x = mcsLook(b.sid); return Response.json(x ? Object.assign({ ok: true }, x) : { ok: false, reason: "no_sid" }); }
      if (b.op === "gencode" && b.app === "MCS") {
        const x = mcsLook(b.sid); if (!x) return Response.json({ ok: false, reason: "no_sid" });
        const out = [];
        for (let i = 0; i < Math.min(5, b.count || 1); i++) {
          let rnd = "", canon = "";
          const SKIPW = /^(MUHAMMAD|MUHAMMED|MOHAMMAD|MOHAMMED|MOHAMAD|MUHAMAD|MOHD|MHD|MUHD|M|MD|SYED|SAYED|SAYYID|SYEDA|HAFIZ|HAFEEZ|MALIK|RANA|CH|CHAUDHRY|CHAUDHARY|CHOUDHRY|CHAUDRY|MIAN|MIA|SHEIKH|SHAIKH|SH|MIR|MIRZA|KHAWAJA|KHWAJA|SARDAR|RAJA|PIR|SYD|ABDUL|ABD|MR|MRS|MS|DR|ENGR|ENG|PROF|HAJI|ALHAJ|QARI|MAULANA|MOLANA|MUFTI|SAHIB|SAB)$/;   /* MCS1711TU502 (مالک کا حکم): عام سابقے چھوڑ کر اصل نام — Muhammad Habib Shahbaz → HABIB */
          const words = String(b.label || x.name || "").toUpperCase().replace(/[^A-Z\s]/g, " ").split(/\s+/).filter(Boolean);
          const tag = (words.find((w) => !SKIPW.test(w) && w.length >= 2) || words[0] || "").slice(0, 8);   /* MCS1711TU501 (مالک کا حکم): کوڈ میں بندے کا نام بھی — MCS008M1HABIB-K7Q9XA (اردو نام ہو تو نام نہیں) */
          for (let tries = 0; tries < 20; tries++) { rnd = [...crypto.getRandomValues(new Uint8Array(6))].map((y) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[y % 31]).join(""); canon = x.sub + tag + rnd; if (!this.sql.exec("SELECT id FROM entkey WHERE k = ?", "MCS|c:" + canon).toArray()[0]) break; canon = ""; }
          if (!canon) continue;
          const code = x.sub + tag + "-" + rnd;
          const e = { id: "E" + now.toString(36) + Math.random().toString(36).slice(2, 6), app: "MCS", keys: ["c:" + canon], code, claims: [], exp: 0, at: now, devices: 1, pend: { days: 365, life: false, devices: 1 }, pkgId: "mcs-1y", pkgName: "1 Year Registration", label: (b.label || x.name || "").slice(0, 60), note: b.note || "", by: "dev", revoked: false, bindMob: x.mob, bindSub: x.sub };
          this.entPut(e); out.push({ id: e.id, code, label: e.label, pkgName: e.pkgName, days: 365, devices: 1, name: x.name, sid: x.sid });
        }
        return Response.json({ ok: true, codes: out });
      }
      if (b.op === "gencode") {   /* ایکٹیویشن کوڈ بنانا — پیکج چن کر؛ کوڈ = پیکج کا نام + 6 حروف، مثلاً 1P1-6M-K7Q9XA۔ ایک ہی بار استعمال */
        const out = [];
        const pk = b.pkgId ? this.entPkgList(b.app).find((x) => x.id === b.pkgId) : null;
        if (b.pkgId && (!pk || pk.active === false)) return Response.json({ ok: false, reason: "no_pkg" });
        const prefix = pk ? pk.prefix : "ACT", days = pk ? pk.days : b.days, life = pk ? !!pk.life : !!b.life, devices = pk ? pk.devices : b.devices;
        for (let i = 0; i < b.count; i++) {
          let rnd = "", canon = "";
          for (let tries = 0; tries < 20; tries++) {
            rnd = [...crypto.getRandomValues(new Uint8Array(6))].map((x) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[x % 31]).join("");
            canon = prefix === "ACT" ? "ACT-" + rnd : prefix.replace(/-/g, "") + rnd;
            if (!this.sql.exec("SELECT id FROM entkey WHERE k = ?", b.app + "|c:" + canon).toArray()[0]) break; canon = "";
          }
          if (!canon) continue;
          const code = prefix + "-" + rnd;
          const e = { id: "E" + now.toString(36) + Math.random().toString(36).slice(2, 6), app: b.app, keys: ["c:" + canon], code, claims: [], exp: 0, at: now, devices, pend: { days, life, devices }, pkgId: pk ? pk.id : "", pkgName: pk ? pk.name : "", label: b.label || "", note: b.note || "", by: "dev", revoked: false };
          this.entPut(e); out.push({ id: e.id, code, label: e.label, pkgName: e.pkgName, days, life, devices });
        }
        return Response.json({ ok: true, codes: out });
      }
      if (b.op === "grant") {
        let id = b.id || "";
        if (!id) for (const k of b.keys) { const r = this.sql.exec("SELECT id FROM entkey WHERE k = ?", b.app + "|" + k).toArray()[0]; if (r) { id = r.id; break; } }
        let e = id ? this.entGet(id) : null;
        if (!e) e = { id: "E" + now.toString(36) + Math.random().toString(36).slice(2, 6), app: b.app, keys: [], claims: [], exp: 0, at: now };
        b.keys.forEach((k) => { if (!e.keys.includes(k)) e.keys.push(k); });
        if (b.name) e.name = b.name; if (b.note !== undefined) e.note = b.note;
        if (b.devices) e.devices = b.devices; if (!e.devices) e.devices = 1;
        if (b.life) e.life = true; else if (b.days) e.exp = Math.max(now, e.exp || 0) + b.days * 864e5;
        if (b.setExp) e.exp = b.setExp;
        /* AIO0411WE160: گاہک کے فون کا UID — پہلے سے جوڑ دو (اسی فون پر فوراً کھلے) */
        if (b.bindDev) { e.claims = e.claims || []; e.uidLock = true; if (!e.claims.some((c) => c.dev === b.bindDev)) { if (e.claims.length >= (e.devices || 1)) e.claims.shift(); e.claims.push({ dev: b.bindDev, at: now, via: "u" }); } }
        e.revoked = false; e.by = "dev";
        if (!e.pin) e.pin = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));   /* AIO0511TH173: اکاؤنٹ PIN — موبائل نمبر + PIN سے نیا فون */
        this.entPut(e);
        return Response.json(Object.assign(this.entOut(e), { pin: e.pin }));
      }
      const e = this.entGet(b.id); if (!e) return Response.json({ ok: false, reason: "none" });
      if (b.op === "revoke") { e.revoked = true; this.entPut(e); return Response.json(this.entOut(e)); }
      if (b.op === "unrevoke") { e.revoked = false; this.entPut(e); return Response.json(this.entOut(e)); }
      if (b.op === "reset") { e.claims = []; this.entPut(e); return Response.json(this.entOut(e)); }
      if (b.op === "newpin") { e.pin = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)); this.entPut(e); return Response.json(Object.assign(this.entOut(e), { pin: e.pin })); }
      if (b.op === "delete") { this.sql.exec("DELETE FROM ent WHERE id = ?", e.id); this.sql.exec("DELETE FROM entkey WHERE id = ?", e.id); return Response.json({ ok: true }); }
      return Response.json({ ok: false, reason: "bad_op" }, { status: 400 });
    }
    if (op === "/vtoken") {   /* ایڈمن: دکان کا خفیہ لنک کوڈ (پہلے سے ہو تو وہی) */
      const { rec } = await request.json();
      let row = this.sql.exec("SELECT tok FROM vtok WHERE rec = ?", rec).toArray()[0];
      if (!row) { const tok = [...crypto.getRandomValues(new Uint8Array(9))].map((b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join(""); this.sql.exec("INSERT INTO vtok (rec, tok, ts) VALUES (?, ?, ?)", rec, tok, Date.now()); row = { tok }; }
      return Response.json({ tok: row.tok });
    }
    if (op === "/vsubmit") {  /* دکاندار: تصدیق یا ترمیم کی درخواست */
      const b = await request.json();
      const row = this.sql.exec("SELECT tok FROM vtok WHERE rec = ?", b.rec).toArray()[0];
      if (!row || row.tok !== b.tok) return Response.json({ error: "bad_token" }, { status: 403 });
      if (b.edit) this.sql.exec("INSERT INTO edits (rec, ts, body) VALUES (?, ?, ?)", b.rec, Date.now(), JSON.stringify(b.edit).slice(0, 4000));
      else this.sql.exec("INSERT INTO verified (rec, ts) VALUES (?, ?) ON CONFLICT (rec) DO UPDATE SET ts = excluded.ts", b.rec, Date.now());
      return Response.json({ ok: true });
    }
    if (op === "/adreq") {   /* MCS1711TU504: اشتہار کی درخواست — دکاندار / ایجنٹ / ایڈمن بنائیں، منظوری صرف ایڈمن 1 */
      const b = await request.json();
      this.sql.exec("CREATE TABLE IF NOT EXISTS adreq (id TEXT PRIMARY KEY, uid TEXT, data TEXT, img TEXT, st TEXT, note TEXT, ts INTEGER, upd INTEGER)");
      const o = b.op, now = Date.now();
      if (o === "add") {
        const last = this.sql.exec("SELECT ts FROM adreq WHERE uid = ? ORDER BY ts DESC LIMIT 1", b.uid).toArray()[0];
        if (last && now - last.ts < 120000) return Response.json({ ok: false, reason: "wait" });
        const id = "ar" + now.toString(36) + Math.random().toString(36).slice(2, 6);
        this.sql.exec("INSERT INTO adreq (id, uid, data, img, st, note, ts, upd) VALUES (?, ?, ?, ?, 'new', '', ?, ?)", id, b.uid, JSON.stringify(b.data || {}), b.img || "", now, now);
        const n = this.sql.exec("SELECT COUNT(*) AS n FROM adreq").toArray()[0].n; if (n > 2000) this.sql.exec("DELETE FROM adreq WHERE st IN ('ok','rej') AND upd < ?", now - 90 * 864e5);
        return Response.json({ ok: true, id });
      }
      if (o === "mine") return Response.json({ ok: true, list: this.sql.exec("SELECT id, data, st, note, ts, upd FROM adreq WHERE uid = ? ORDER BY ts DESC LIMIT 20", b.uid).toArray().map((r) => ({ id: r.id, st: r.st, note: r.note, ts: r.ts, upd: r.upd, data: JSON.parse(r.data || "{}") })) });
      if (o === "list") return Response.json({ ok: true, list: this.sql.exec("SELECT id, data, st, note, ts, upd, LENGTH(img) AS il FROM adreq WHERE st = 'new' OR upd > ? ORDER BY ts", now - 3 * 864e5).toArray().map((r) => ({ id: r.id, st: r.st, note: r.note, ts: r.ts, upd: r.upd, hasImg: r.il > 0 ? 1 : 0, data: JSON.parse(r.data || "{}") })) });
      if (o === "img") { const r = this.sql.exec("SELECT img FROM adreq WHERE id = ?", b.id).toArray()[0]; return Response.json({ ok: !!r, img: r ? r.img : "" }); }
      if (o === "set") { if (!["ok", "rej", "new"].includes(b.st)) return Response.json({ ok: false, reason: "bad_st" }); const r = this.sql.exec("SELECT id FROM adreq WHERE id = ?", b.id).toArray()[0]; if (!r) return Response.json({ ok: false, reason: "not_found" }); this.sql.exec("UPDATE adreq SET st = ?, note = ?, upd = ? WHERE id = ?", b.st, b.note || "", now, b.id); return Response.json({ ok: true }); }
      return Response.json({ ok: false, reason: "bad_op" });
    }
    if (op === "/preq") {   /* MCS1111WE330 */
      const b = await request.json();
      this.sql.exec("CREATE TABLE IF NOT EXISTS preq (rec TEXT PRIMARY KEY, data TEXT, st TEXT, note TEXT, ts INTEGER, upd INTEGER)");
      const o = b.op, now = Date.now();
      if (o === "add") {
        const old = this.sql.exec("SELECT st, ts FROM preq WHERE rec = ?", b.rec).toArray()[0];
        if (old && now - old.ts < 60000) return Response.json({ ok: true, again: 1 });
        this.sql.exec("INSERT OR REPLACE INTO preq (rec, data, st, note, ts, upd) VALUES (?, ?, 'new', '', ?, ?)", b.rec, JSON.stringify(b.data || {}), now, now);
        const n = this.sql.exec("SELECT COUNT(*) AS n FROM preq").toArray()[0].n; if (n > 3000) this.sql.exec("DELETE FROM preq WHERE st IN ('done','rej') AND upd < ?", now - 90 * 864e5);
        return Response.json({ ok: true });
      }
      if (o === "mine") { const r = this.sql.exec("SELECT st, note, ts, upd FROM preq WHERE rec = ?", b.rec).toArray()[0];
        /* MCS1511SU427 (مالک کا حکم): ادا شدہ (GPA لگا) کاروبار کے مالک کو «منظوری کا انتظار» کبھی نہیں — ایڈمن کا جائزہ پس منظر میں؛ ایڈمن نے معلومات مانگی ہوں (info) یا رد کیا ہو تو وہی دکھے */
        if (this.paidActive(b.rec) && (!r || r.st === "new" || r.st === "pend")) return Response.json({ ok: true, st: "done", note: "", ts: r ? r.ts : 0, upd: r ? r.upd : 0 });
        return Response.json(r ? { ok: true, st: r.st, note: r.note, ts: r.ts, upd: r.upd } : { ok: true, st: "" }); }
      if (o === "list") { const L = this.sql.exec("SELECT rec, data, st, note, ts, upd FROM preq WHERE st NOT IN ('done','rej') OR upd > ? ORDER BY ts", now - 3 * 864e5).toArray(); const pr = {}; for (const r of this.sql.exec("SELECT rec, since, until, pend FROM prof").toArray()) pr[r.rec] = r; return Response.json({ ok: true, list: L.map((r) => Object.assign({ rec: r.rec, st: r.st, note: r.note, ts: r.ts, upd: r.upd, data: JSON.parse(r.data || "{}") }, pr[r.rec] ? { since: pr[r.rec].since, until: pr[r.rec].until, pend: pr[r.rec].pend ? 1 : 0, has: 1 } : { has: 0 }, this.sidGet(r.rec) ? { sid: this.sidGet(r.rec) } : {})) }); }
      if (o === "set") { if (!["new", "pend", "info", "done", "rej"].includes(b.st)) return Response.json({ ok: false, reason: "bad_st" }); const r = this.sql.exec("SELECT rec FROM preq WHERE rec = ?", b.rec).toArray()[0]; if (!r) this.sql.exec("INSERT INTO preq (rec, data, st, note, ts, upd) VALUES (?, '{}', ?, ?, ?, ?)", b.rec, b.st, b.note || "", now, now); else this.sql.exec("UPDATE preq SET st = ?, note = ?, upd = ? WHERE rec = ?", b.st, b.note || "", now, b.rec); return Response.json({ ok: true }); }
      return Response.json({ ok: false, reason: "bad_op" });
    }
    if (op === "/plist") { try { for (const x of this.sql.exec("SELECT rec FROM prof WHERE COALESCE(until, 0) < ?", Date.now() + 30 * 864e5).toArray()) if (this.adminFree(x.rec)) this.sql.exec("UPDATE prof SET until = ? WHERE rec = ?", Date.now() + ADMIN_FREE_MS, x.rec); } catch (e) {}   /* MCS1511SU427: ایڈمن کا کاروبار کبھی ختم نہ ہو */
      const subs = {}; for (const x of this.sql.exec("SELECT rec, subid FROM sale WHERE subid IS NOT NULL AND COALESCE(void, 0) = 0 ORDER BY ts").toArray()) subs[x.rec] = x.subid;
      return Response.json(Object.fromEntries(this.sql.exec("SELECT rec, since, until, ts, pend FROM prof").toArray().map((r) => { const sid = this.sidGet(r.rec); { const so = sid ? this.subOf(r.rec) : ""; if (so) subs[r.rec] = so; }   /* MCS1511SU450: کاروبار کا پکا نمبر پہلے */ if (sid && !subs[r.rec] && (r.until || 0) > Date.now()) { const q = this.sql.exec("SELECT subn FROM mcssid WHERE sid = ?", sid).toArray()[0]; if (q && q.subn) { const usedN = Object.values(subs).filter((v) => String(v).startsWith(sid + "M")).map((v) => parseInt(String(v).slice(sid.length + 1), 10) || 0); let n = 1; while (usedN.includes(n)) n++; subs[r.rec] = sid + "M" + n; } }   /* MCS1211TH353: ایک موبائل کی دوسری ممبرشپ -02 */ return [r.rec, Object.assign({ since: r.since, until: r.until, ts: r.ts }, r.pend ? { pend: 1 } : {}, sid ? { sid } : {}, subs[r.rec] ? { subid: subs[r.rec] } : {})]; }))); }
    if (op === "/mcs_sid") {   /* MCS1111WE312: کارڈ کی «پرانی ID کی جگہ سسٹم ID» — اس موبائل کی MCS-NNN (نہ ہو تو اگلی) */
      const b = await request.json(); const sid = b.assign ? this.sidFor(b.mob) : this.sidGet(b.mob);
      if (b.assign && sid) this.finLog("sid", { mob: this.sidMob(b.mob), sid, by: b.by || "" });
      return Response.json({ ok: !!sid, sid });
    }
    if (op === "/pget") {
      const { rec } = await request.json();
      let r = this.sql.exec("SELECT data, since, until, ts, pend FROM prof WHERE rec = ?", rec).toArray()[0];
      if (!r) return Response.json({ none: true });
      if ((r.until || 0) < Date.now() + 180 * 864e5 && this.adminFree(rec)) { r.until = Date.now() + ADMIN_FREE_MS; this.sql.exec("UPDATE prof SET until = ? WHERE rec = ?", r.until, rec); }   /* MCS1511SU427 */
      const imgs = this.sql.exec("SELECT id, ts FROM pimg WHERE rec = ? ORDER BY id", rec).toArray();
      let data = {}; try { data = JSON.parse(r.data || "{}"); } catch (e) {}
      return Response.json({ rec, data, since: r.since, until: r.until, ts: r.ts, imgs, pend: r.pend ? 1 : 0 });
    }
    if (op === "/pimg") { const { id } = await request.json(); const r = this.sql.exec("SELECT data FROM pimg WHERE id = ?", id).toArray()[0]; return Response.json({ data: r ? r.data : "" }); }
    if (op === "/pstatus") {   /* MCS1511SU428: کاروبار کی موجودہ حالت — ایپ کی چیک لسٹ / مبارکباد / کارڈ کے لیے (کوئی راز نہیں؛ آرڈر نمبر آدھا چھپا) */
      const b = await request.json(), rec = String(b.rec || ""), now = Date.now();
      const r = this.sql.exec("SELECT since, until, pend, paid FROM prof WHERE rec = ?", rec).toArray()[0];
      if (!r) return Response.json({ ok: true, exists: false, steps: [{ k: "biz", ok: false }] });
      const mb = this.sql.exec("SELECT gpa, free, exp, sku FROM mbuy WHERE rec = ? ORDER BY ts DESC LIMIT 1", rec).toArray()[0];
      const sid = this.sidGet(rec) || "", sl = this.sql.exec("SELECT subid FROM sale WHERE rec = ? AND subid IS NOT NULL AND COALESCE(void, 0) = 0 ORDER BY id DESC LIMIT 1", rec).toArray()[0];
      try { this.subFix450(); } catch (e) {} let subid = this.subOf(rec) || (sl ? sl.subid : "");
      const adm = this.adminFree(rec), active = (r.until || 0) > now, kind = adm ? "admin" : mb ? (mb.free ? "promo" : "paid") : "";
      const days = Math.max(0, Math.round(((r.until || 0) - now) / 864e5));
      const gm = mb && mb.gpa ? String(mb.gpa).replace(/^(GPA\.)\d{4}-\d{4}-\d{4}-(\d{5})$/, "$1••••-••••-••••-$2") : "";
      const steps = [{ k: "pay", ok: !!mb || adm, v: kind }, { k: "gpa", ok: !!(mb && mb.gpa) || adm, v: gm }, { k: "biz", ok: true }, { k: "active", ok: active, v: days }, { k: "id", ok: !!sid && !!subid, v: subid || sid }];
      return Response.json({ ok: true, exists: true, active, kind, until: r.until || 0, days, sid, subid, gpa: gm, pend: r.pend ? 1 : 0, steps });
    }
    if (op === "/pbuy_probe") {   /* MCS1511SU427: یہ ٹوکن (مثلاً Play Store میں ریڈیم کوڈ سے لی ہوئی سبسکرپشن) کسی کاروبار سے جڑ چکا؟ */
      const b = await request.json(); const r = this.sql.exec("SELECT rec FROM mbuy WHERE tok = ?", String(b.tok || "")).toArray()[0];
      return Response.json({ ok: true, linked: !!r, rec: r ? r.rec : "" });
    }
    if (op === "/pbuy") {   /* MCS0411WE147 / MCS1511SU427: گوگل سے تصدیق شدہ خریداری → اسی ممبرشپ کی مدت؛ ٹوکن ایک بار جس ممبرشپ سے جڑا، ہمیشہ اسی کا؛ نئی خریداری پر GPA لازمی */
      const b = await request.json();
      const row = this.sql.exec("SELECT rec, exp, free FROM mbuy WHERE tok = ?", b.tok).toArray()[0];
      /* MCS1511SU450: ٹوکن اسی موبائل کے پرانے کاروبار سے جڑا ہو اور اب نئے کارڈ سے خرید / بحالی ہو — مدت، خریداری، نمبر نئے پر (پیسہ ضائع نہ ہو) */
      if (row && b.rec && b.rec !== row.rec && this.sidMob(b.rec) && this.sidMob(b.rec) === this.sidMob(row.rec) && this.recMove450(row.rec, b.rec)) row.rec = b.rec;
      const rec = row ? row.rec : b.rec;
      if (!rec) return Response.json({ ok: false, error: "no_rec" });
      const o = this.sql.exec("SELECT until, paid FROM prof WHERE rec = ?", rec).toArray()[0];
      if (!o) return Response.json({ ok: false, error: "no_prof" });
      if (!row) {   /* نئی خریداری: آرڈر نمبر کے بغیر رجسٹر نہیں؛ ایک آرڈر نمبر ایک ہی بار */
        if (!b.gpa) return Response.json({ ok: false, error: "gpa_needed" });
        if (this.sql.exec("SELECT tok FROM mbuy WHERE gpa = ? LIMIT 1", b.gpa).toArray().length) return Response.json({ ok: false, error: "gpa_used" });
      }
      const now = Date.now(), prevExp = row ? (row.exp || 0) : 0, free = b.free ? 1 : 0;
      let subid = "";
      if (!row) this.sql.exec("INSERT INTO mbuy (tok, rec, sku, exp, ts, gpa, free) VALUES (?, ?, ?, ?, ?, ?, ?)", b.tok, rec, b.sku, b.exp, now, b.gpa || null, free);
      let until = o.until || 0;
      if (b.days > 0) {   /* MCS1511SU461: ایک بار کی خریداری — ہر نیا ٹوکن = اتنے دن مزید (اسی ٹوکن پر دوبارہ کچھ نہیں) */
        if (!row) { until = Math.max(until, now) + b.days * 864e5; this.sql.exec("UPDATE mbuy SET exp = ? WHERE tok = ?", until, b.tok);
          if (free) { this.sql.exec("UPDATE prof SET until = ? WHERE rec = ?", until, rec); try { subid = this.subNext(rec); } catch (e) {} }
          else { this.sql.exec("UPDATE prof SET until = ? WHERE rec = ?", until, rec); this.saleAdd(rec, "play", Math.round(b.days / 365 * 100) / 100); } }
      } else if (b.exp > prevExp) {
        const yrs = Math.max(row ? 0 : 1, Math.round((b.exp - Math.max(prevExp, now)) / (365 * 864e5)));
        /* پہلی بار: باقی دن ضائع نہیں — پرانی مدت (یا آج) سے آگے خریدی مدت؛ تجدید پر گوگل کی نئی تاریخ جتنا فرق */
        until = row ? until + (b.exp - prevExp) : Math.max(until, now) + (b.exp - now);
        const conv = !!(row && row.free && !free);   /* ریڈیم / ٹرائل کے بعد پہلی اصل ادائیگی = اب سیل */
        if (free) {
          this.sql.exec("UPDATE prof SET until = ? WHERE rec = ?", until, rec);   /* ریڈیم کوڈ / مفت: مدت ملتی ہے، سیل / کمیشن نہیں */
          if (!row) { try { subid = this.subNext(rec); } catch (e) {} }
        } else {
          const add = conv ? Math.max(1, yrs) : yrs;
          this.sql.exec("UPDATE prof SET until = ?, paid = COALESCE(paid, 0) + ? WHERE rec = ?", until, add, rec);
          if (add > 0) this.saleAdd(rec, "play", add);
        }
        if (row) this.sql.exec("UPDATE mbuy SET exp = ?, ts = ?, free = ? WHERE tok = ?", b.exp, now, free, b.tok);
      }
      if (!row) {   /* MCS1511SU427: ادائیگی ہوتے ہی فارم ایڈمن کے «جائزے» کی فہرست میں (منظوری نہیں — کاروبار پہلے ہی لائیو) */
        const note = (b.test ? "🧪 ٹیسٹ رجسٹریشن (سیل نہیں)" : free ? "🎁 ریڈیم / پروموشن کوڈ" : "✅ Google Play سے ادا شدہ") + " — " + (b.gpa || "") + " — جائزہ برائے ایڈمن (منظوری درکار نہیں؛ کاروبار فعال)";
        const old = this.sql.exec("SELECT st FROM preq WHERE rec = ?", rec).toArray()[0];
        if (old) { if (old.st === "new" || old.st === "pend") this.sql.exec("UPDATE preq SET note = ?, upd = ? WHERE rec = ?", note, now, rec); }
        else this.sql.exec("INSERT INTO preq (rec, data, st, note, ts, upd) VALUES (?, ?, 'new', ?, ?, ?)", rec, JSON.stringify({ paid: free ? 0 : 1, free: free, gpa: b.gpa || "", sku: b.sku || "", src: "play" }), note, now, now);
        this.finLog("pbuy", { rec, gpa: b.gpa || "", sku: b.sku, free, until });
      }
      if (!subid) { const q = this.sql.exec("SELECT subid FROM sale WHERE rec = ? AND subid IS NOT NULL AND COALESCE(void, 0) = 0 ORDER BY id DESC LIMIT 1", rec).toArray()[0]; subid = q ? q.subid : ""; }
      return Response.json({ ok: true, rec, until, sku: row ? this.sql.exec("SELECT sku FROM mbuy WHERE tok = ?", b.tok).toArray()[0].sku : b.sku, subid, sid: this.sidGet(rec) || "", first: !row, free: !!free });
    }
    if (op === "/pclaim") {
      const b = await request.json(); const now = Date.now();
      const r = this.sql.exec("SELECT key, since, until FROM prof WHERE rec = ?", b.rec).toArray()[0];
      if (r && r.key && !b.admin) return Response.json({ error: "taken" }, { status: 409 });
      const key = [...crypto.getRandomValues(new Uint8Array(18))].map((x) => "abcdefghjkmnpqrstuvwxyz23456789"[x % 31]).join("");
      if (!r) {   /* MCS1511SU454 (مالک کا حکم — فی الحال ایک موبائل ایک کاروبار): اسی موبائل کا کوئی اور کاروبار ابھی فعال ہو تو نیا نہیں */
        const mob = this.sidMob(b.rec);
        if (mob && this.sql.exec("SELECT rec FROM prof WHERE rec LIKE ? AND rec <> ? AND COALESCE(until, 0) > ? LIMIT 1", "p" + mob.slice(2) + "_%", b.rec, now).toArray().length) return Response.json({ error: "one_biz" }, { status: 409 });
      }
      if (r) this.sql.exec("UPDATE prof SET key = ? WHERE rec = ?", key, b.rec);
      else {
        /* MCS1511SU427 (مالک کا حکم): زیرو سے آغاز — کوئی بھی مفت کاروبار نہیں (نہ 15 دن، نہ «منظوری کا انتظار»)؛ مدت 0 = ادائیگی (Google Play GPA) یا ایڈمن کی دی ہوئی مدت سے شروع۔
           صرف ایڈمن (MCS-001 / MCS-002 / DEV / CODEV) کا اپنا فیڈ کیا کاروبار مفت */
        const af = this.adminFree(b.rec);
        this.sql.exec("INSERT INTO prof (rec, data, key, since, until, ts, pend) VALUES (?, '{}', ?, ?, ?, ?, 0)", b.rec, key, now, af ? now + ADMIN_FREE_MS : now, now);
        if (af) { this.finLog("adminfree", { rec: b.rec });
          if (this.adminSlotOf(b.rec)) { try { const sb = this.subNext(b.rec); this.finLog("adminsub", { rec: b.rec, subid: sb }); } catch (e) {} } }   /* MCS1511SU428: ایڈمن کا نیا کاروبار — MCS-001-01 / MCS-002-01 فوراً */
      }
      const x = this.sql.exec("SELECT since, until, pend FROM prof WHERE rec = ?", b.rec).toArray()[0];
      const sd = this.sidGet(b.rec), sq = sd ? this.sql.exec("SELECT subn FROM mcssid WHERE sid = ?", sd).toArray()[0] : null;
      return Response.json({ key, since: x.since, until: x.until, pend: 0, sid: sd || "", subid: sd ? this.subOf(b.rec) : "" });
    }
    if (op === "/pcode") {   /* MCS1711TU499 (مالک کا حکم): ایک سال کا رجسٹریشن کوڈ — جو بھی ڈالے (مالک / ایڈمن 2 / ایجنٹ / دکاندار)، کاروبار فوراً ایکٹو؛ کوڈ ایک ہی بار */
      const b = await request.json(); const now = Date.now();
      this.sql.exec("CREATE TABLE IF NOT EXISTS entfail (dev TEXT PRIMARY KEY, n INTEGER, ts INTEGER)");
      const fk = "pc:" + String(b.ip || ""), fr = this.sql.exec("SELECT n, ts FROM entfail WHERE dev = ?", fk).toArray()[0], cur = fr && now - fr.ts < 9e5 ? fr.n : 0;
      if (cur >= 10) return Response.json({ ok: false, reason: "wait" });
      const bad = (reason) => { this.sql.exec("INSERT INTO entfail (dev, n, ts) VALUES (?, ?, ?) ON CONFLICT (dev) DO UPDATE SET n = excluded.n, ts = excluded.ts", fk, cur + 1, fr && now - fr.ts < 9e5 ? fr.ts : now); return Response.json({ ok: false, reason }); };
      const row = this.sql.exec("SELECT id FROM entkey WHERE k = ?", "MCS|c:" + b.code).toArray()[0], e = row && this.entGet(row.id);
      if (!e) return bad("none");
      if (e.revoked) return bad("revoked");
      if (e.redeemed && e.biz !== b.rec) return bad("used");
      if (e.bindMob && this.sidMob(b.rec) !== e.bindMob) return bad("other_biz");   /* MCS1711TU500: کوڈ صرف اسی بندے (MCS نمبر) کے کاروبار پر */
      if (!e.redeemed) {
        const days = (e.pend && e.pend.life) ? 36500 : ((e.pend && e.pend.days) || 365), yrs = Math.max(1, Math.round(days / 365));
        let p = this.sql.exec("SELECT until FROM prof WHERE rec = ?", b.rec).toArray()[0];
        if (!p) { const mob = this.sidMob(b.rec); if (mob && this.sql.exec("SELECT rec FROM prof WHERE rec LIKE ? AND rec <> ? AND COALESCE(until, 0) > ? LIMIT 1", "p" + mob.slice(2) + "_%", b.rec, now).toArray().length) return Response.json({ ok: false, reason: "one_biz" });
          this.sql.exec("INSERT INTO prof (rec, data, key, since, until, ts, pend) VALUES (?, '{}', '', ?, ?, ?, 0)", b.rec, now, now, now); p = { until: now }; }   /* چابی خالی — دکاندار کا فون بعد میں /pclaim سے جڑ سکے */
        const until = Math.max(p.until || 0, now) + days * 864e5;
        this.sql.exec("UPDATE prof SET until = ?, pend = 0, paid = COALESCE(paid, 0) + ? WHERE rec = ?", until, yrs, b.rec);
        try {   /* MCS1711TU500: کوڈ پر لکھا ممبرشپ نمبر (MCS008M1) ہی اس کاروبار کو — نمبر اور کوڈ ہمیشہ ایک جیسے */
          const sid = this.sidFor(b.rec), bs = String(e.bindSub || ""), m = /M(\d+)$/.exec(bs);
          if (sid && m && bs === String(sid).replace(/-/g, "") + "M" + m[1] && !this.subOf(b.rec)) {
            const taken = this.sql.exec("SELECT rec FROM prof WHERE rec LIKE ? AND rec <> ?", "p" + this.sidMob(b.rec).slice(2) + "_%", b.rec).toArray().some((r) => (this.subOf(r.rec) || "") === bs);
            if (!taken) { this.subSet(b.rec, bs); this.sql.exec("UPDATE mcssid SET subn = MAX(COALESCE(subn, 0), ?) WHERE sid = ?", parseInt(m[1], 10), sid); }
          }
        } catch (er) {}
        try { this.saleAdd(b.rec, "code", yrs); } catch (er) { this.finLog("pcode_sale_err", { e: String(er) }); }
        e.redeemed = now; e.usedAt = now; e.biz = b.rec; e.claims = [{ dev: "rec:" + b.rec, at: now, via: "pcode", by: String(b.by || "").slice(0, 40) }];
        this.entPut(e); this.finLog("pcode", { rec: b.rec, code: e.code, by: b.by || "" });
      }
      this.sql.exec("DELETE FROM entfail WHERE dev = ?", fk);
      const x = this.sql.exec("SELECT since, until FROM prof WHERE rec = ?", b.rec).toArray()[0], sd = this.sidGet(b.rec);
      return Response.json({ ok: true, since: x.since, until: x.until, sid: sd || "", subid: sd ? this.subOf(b.rec) : "" });
    }
    if (op === "/psave") {
      const b = await request.json();
      const r = this.sql.exec("SELECT key FROM prof WHERE rec = ?", b.rec).toArray()[0];
      if (!r) return Response.json({ error: "no_profile" }, { status: 404 });
      if (!b.admin && (!b.key || b.key !== r.key)) return Response.json({ error: "bad_key" }, { status: 403 });
      const now = Date.now();
      if (b.data) this.sql.exec("UPDATE prof SET data = ?, ts = ? WHERE rec = ?", JSON.stringify(b.data), now, b.rec);
      for (const [slot, img] of Object.entries(b.imgs || {})) {
        const id = b.rec + "_" + slot;
        if (img) this.sql.exec("INSERT INTO pimg (id, rec, data, ts) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data, ts = excluded.ts", id, b.rec, img, now);
        else this.sql.exec("DELETE FROM pimg WHERE id = ?", id);
      }
      this.sql.exec("UPDATE prof SET ts = ? WHERE rec = ?", now, b.rec);
      return Response.json({ ok: true, ts: now });
    }
    if (op === "/padmin") {   /* ایڈمن: مدت بدلیں، فون سے آزاد کریں، یا پوری پروفائل ہٹائیں */
      const b = await request.json();
      if (b.act === "until") {   /* MCS0511TH134: جتنے سال بڑھے، اتنے «خریدے سال» (ایجنٹ کا کمیشن انہی سے) */
        const o = this.sql.exec("SELECT until FROM prof WHERE rec = ?", b.rec).toArray()[0];
        const yrs = o ? Math.max(0, Math.round((b.until - Math.max(o.until || 0, Date.now())) / (365 * 864e5))) : 0;
        this.sql.exec("UPDATE prof SET until = ?, paid = COALESCE(paid, 0) + ? WHERE rec = ?", b.until, yrs, b.rec);
        if (yrs > 0) this.saleAdd(b.rec, "manual", yrs);
      }
      else if (b.act === "approve") { const now = Date.now(); this.sql.exec("UPDATE prof SET since = ?, pend = 0 WHERE rec = ?", now, b.rec); }   /* MCS1511SU427 (مالک کا حکم): منظوری پر مفت دن نہیں — مدت صرف ادائیگی (یا ایڈمن کے «مدت بدلیں») سے */
      else if (b.act === "gift") { if (b.until > 0) { this.sql.exec("UPDATE prof SET until = ? WHERE rec = ?", b.until, b.rec); this.finLog("gift", { rec: b.rec, until: b.until }); } }   /* MCS1511SU427: ایڈمن کی مفت مدت — سیل / کمیشن نہیں */
      else if (b.act === "reject") this.sql.exec("UPDATE prof SET pend = 0 WHERE rec = ?", b.rec);
      else if (b.act === "free") this.sql.exec("UPDATE prof SET key = '' WHERE rec = ?", b.rec);
      else if (b.act === "del") { this.sql.exec("DELETE FROM prof WHERE rec = ?", b.rec); this.sql.exec("DELETE FROM pimg WHERE rec = ?", b.rec);
        /* MCS1211TH354 (مالک کا حکم): کاروبار / ممبرشپ حذف = اس کی ID بھی ختم — اسی موبائل کی کوئی اور ممبرشپ یا اکاؤنٹ نہ ہو تو MCS ID ریٹائر (دوبارہ کسی کو نہیں) */
        try { const mob = this.sidMob(b.rec), sid = mob && this.sidGet(mob);
          if (sid && !this.sql.exec("SELECT rec FROM prof").toArray().some((r) => this.sidMob(r.rec) === mob) && !this.sql.exec("SELECT id FROM mcsukey WHERE k = ?", "m:" + mob).toArray().length) {
            this.sql.exec("DELETE FROM mcssid WHERE mob = ?", mob); this.sql.exec("DELETE FROM mcsukey WHERE k = ?", "a:" + sid); this.finLog("sidretire", { sid, rec: b.rec }); }
          this.sql.exec("UPDATE sale SET subid = NULL WHERE rec = ? AND COALESCE(void, 0) = 0", b.rec);
        } catch (e) {} }
      return Response.json({ ok: true });
    }
    if (op === "/vlist") return Response.json(Object.fromEntries(this.sql.exec("SELECT rec, ts FROM verified").toArray().map((r) => [r.rec, r.ts])));
    if (op === "/vunset") { const { rec } = await request.json(); this.sql.exec("DELETE FROM verified WHERE rec = ?", rec); return Response.json({ ok: true }); }
    if (op === "/edits") return Response.json(this.sql.exec("SELECT id, rec, ts, body, done FROM edits ORDER BY done ASC, id DESC LIMIT 200").toArray());
    if (op === "/editdone") { const { id } = await request.json(); this.sql.exec("UPDATE edits SET done = 1 WHERE id = ?", id); return Response.json({ ok: true }); }
    if (request.method === "POST") {
      const b = await request.json();
      this.sql.exec("INSERT INTO hits (day, rec, kind, n) VALUES (?, ?, ?, 1) ON CONFLICT (day, rec, kind) DO UPDATE SET n = n + 1", b.day, b.rec, b.kind);
      return new Response("ok");
    }
    const since = u.searchParams.get("since") || "00000000";
    const today = u.searchParams.get("today") || "";
    if (u.searchParams.get("mode") === "admin") {
      const days = this.sql.exec("SELECT day, kind, SUM(n) AS n FROM hits WHERE day >= ? GROUP BY day, kind ORDER BY day DESC", since).toArray();
      const topMonth = this.sql.exec("SELECT rec, SUM(CASE WHEN kind IN ('call','wa','sms') THEN n ELSE 0 END) AS c, SUM(CASE WHEN kind='call' THEN n ELSE 0 END) AS call, SUM(CASE WHEN kind='wa' THEN n ELSE 0 END) AS wa, SUM(CASE WHEN kind='sms' THEN n ELSE 0 END) AS sms FROM hits WHERE day >= ? AND rec != '_app' GROUP BY rec ORDER BY c DESC LIMIT 25", since).toArray();
      const topToday = this.sql.exec("SELECT rec, SUM(CASE WHEN kind IN ('call','wa','sms') THEN n ELSE 0 END) AS c FROM hits WHERE day = ? AND rec != '_app' GROUP BY rec ORDER BY c DESC LIMIT 25", today).toArray();
      return Response.json({ days, topMonth, topToday });
    }
    const recs = (u.searchParams.get("recs") || "").split(",").filter(Boolean).slice(0, 80);
    const out = {};
    for (const r of recs) {
      const rows = this.sql.exec("SELECT kind, SUM(n) AS n, SUM(CASE WHEN day = ? THEN n ELSE 0 END) AS t FROM hits WHERE rec = ? AND day >= ? GROUP BY kind", today, r, since).toArray();
      if (rows.length) { out[r] = {}; rows.forEach((x) => { out[r][x.kind] = x.n; if (x.t) out[r][x.kind + "Today"] = x.t; }); }
    }
    return Response.json(out);
  }
}
function pkDay(d) { const t = new Date((d || Date.now()) + 5 * 3600e3); return t.toISOString().slice(0, 10).replace(/-/g, ""); }
async function handleStat(request, env) {
  if (!env.MCS_STATS) return reply({ error: "stats_not_ready" }, 503);
  const stub = env.MCS_STATS.get(env.MCS_STATS.idFromName("mcs"));
  const today = pkDay();
  if (request.method === "POST") {
    let b = {};
    try { b = JSON.parse(await request.text()); } catch (e) { return reply({ error: "bad_json" }, 400); }
    const rec = String(b.rec || "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40);
    const kind = String(b.kind || "");
    if (!rec || !STAT_KINDS.includes(kind)) return reply({ error: "bad" }, 400);
    await stub.fetch("https://s/hit", { method: "POST", body: JSON.stringify({ day: today, rec, kind }) });
    return reply({ ok: true });
  }
  const u = new URL(request.url);
  const days = Math.min(400, Math.max(1, parseInt(u.searchParams.get("days") || "30", 10)));
  const since = pkDay(Date.now() - (days - 1) * 864e5);
  const q = new URLSearchParams({ since, today });
  if (u.searchParams.get("mode") === "admin") q.set("mode", "admin");
  if (u.searchParams.get("recs")) q.set("recs", u.searchParams.get("recs"));
  const r = await stub.fetch("https://s/q?" + q.toString());
  return new Response(await r.text(), { headers: { "Content-Type": "application/json", ...CORS } });
}

/* ایڈمن کی پہچان: Firebase لاگ ان کا ID ٹوکن (my-city-shines) — گوگل کی چابیوں سے دستخط کی جانچ */
const MCS_ADMIN_EMAILS = ["pbtcodelabs@gmail.com"];
let fbJwks = null, fbJwksAt = 0;
function b64uToBytes(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }
let PP_ENV = null;   /* AGP0911MO015: ڈویلپر کا PIN سیشن (pps.…) بھی ایڈمن مانا جاتا ہے */
async function verifyFirebaseAdmin(request) {
  try {
    const h = request.headers.get("Authorization") || ""; const jwt = h.replace(/^Bearer\s+/i, "");
    if (/^pps\.[0-9a-f]{48}$/.test(jwt)) { if (!PP_ENV || !PP_ENV.MCS_STATS) return false; const st = PP_ENV.MCS_STATS.get(PP_ENV.MCS_STATS.idFromName("mcs")); const r = await (await st.fetch("https://s/pp_check", { method: "POST", body: JSON.stringify({ role: "dev", tok: jwt }) })).json(); return !!r.ok; }
    const parts = jwt.split(".");
    if (parts.length !== 3) return false;
    const head = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[0]))), pl = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[1])));
    const now = Date.now() / 1000;
    if (pl.aud !== "my-city-shines" || pl.iss !== "https://securetoken.google.com/my-city-shines" || pl.exp < now || !MCS_ADMIN_EMAILS.includes(String(pl.email || "").toLowerCase())) return false;
    if (!fbJwks || Date.now() - fbJwksAt > 3600e3) { const r = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"); fbJwks = (await r.json()).keys || []; fbJwksAt = Date.now(); }
    const jwk = fbJwks.find((k) => k.kid === head.kid); if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64uToBytes(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  } catch (e) { return false; }
}
/* SM1611MO276: سبزی منڈی کا ڈویلپر — sabzi-mandi-143e6 فائربیس کا ID ٹوکن (ڈویلپر پینل والی ای میل)، گوگل کی چابیوں سے جانچ */
const SM_DEV_EMAILS = ["piarybhai@gmail.com"];
/* AIODR1611MO173: AIO Direct کا ڈویلپر — aio-pos-backup فائربیس (ڈویلپر پینل والا اکاؤنٹ) */
const DR_DEV_EMAILS = ["developer@aioposdirect.app"];
async function verifySmDev(request, proj, emails) {
  proj = proj || "sabzi-mandi-143e6"; emails = emails || SM_DEV_EMAILS;
  try {
    const jwt = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, ""), parts = jwt.split(".");
    if (parts.length !== 3) return false;
    const head = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[0]))), pl = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[1])));
    if (pl.aud !== proj || pl.iss !== "https://securetoken.google.com/" + proj || pl.exp < Date.now() / 1000 || !emails.includes(String(pl.email || "").toLowerCase())) return false;
    if (!fbJwks || Date.now() - fbJwksAt > 3600e3) { const r = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"); fbJwks = (await r.json()).keys || []; fbJwksAt = Date.now(); }
    const jwk = fbJwks.find((k) => k.kid === head.kid); if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64uToBytes(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  } catch (e) { return false; }
}
/* =====================================================================
   🔑 اکاؤنٹ سبسکرپشن — جی میل (گوگل سائن اِن، ٹوکن یہاں جانچا جاتا ہے) یا موبائل نمبر؛ فون کی حد؛ صرف ڈویلپر دے سکتا ہے
   /entclaim {app, kind:'g'|'p', idToken | phone, dev}  — نیا فون جوڑتا ہے (حد تک)
   /entstatus {app, key, dev} — پہلے سے جڑا فون (تجدید / بند ہونے کی خبر)
   /entadmin  (Authorization: MCS ایڈمن کا فائربیس ٹوکن) {op:'grant'|'list'|'revoke'|'unrevoke'|'reset'|'delete', ...}
   ===================================================================== */
const ENT_APPS = ["AIO", "MCS"];   /* MCS1711TU499: My City Shines کے ایک سال کے رجسٹریشن کوڈ بھی اسی جدول میں (چھڑانا /pcode سے) */
const GOOGLE_CLIENT_IDS = ["954131537356-2be2rne30mje71l9qibosblvj3j0eqoj.apps.googleusercontent.com"];
let gJwks = null, gJwksAt = 0;
async function verifyGoogleIdToken(jwt) {
  try {
    const parts = String(jwt || "").split("."); if (parts.length !== 3) return "";
    const head = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[0]))), pl = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[1])));
    if (!GOOGLE_CLIENT_IDS.includes(pl.aud) || !["accounts.google.com", "https://accounts.google.com"].includes(pl.iss) || pl.exp < Date.now() / 1000 || !pl.email || pl.email_verified === false || pl.email_verified === "false") return "";
    if (!gJwks || Date.now() - gJwksAt > 3600e3) { const r = await fetch("https://www.googleapis.com/oauth2/v3/certs"); gJwks = (await r.json()).keys; gJwksAt = Date.now(); }
    const jwk = gJwks.find((k) => k.kid === head.kid); if (!jwk) return "";
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return (await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64uToBytes(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]))) ? String(pl.email).toLowerCase() : "";
  } catch (e) { return ""; }
}
function entPhone(v) { let d = String(v || "").replace(/[۰-۹]/g, (c) => "۰۱۲۳۴۵۶۷۸۹".indexOf(c)).replace(/\D/g, ""); if (d.startsWith("0092")) d = d.slice(2); if (d.startsWith("0")) d = "92" + d.slice(1); if (d.length === 10 && d.startsWith("3")) d = "92" + d; return /^92\d{10}$/.test(d) ? d : ""; }
function entEmail(v) { const e = String(v || "").trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) ? e : ""; }
/* ===== 🔐 MCS ایپ کا لاگ اِن (MCS0511TH161، ہیلپ ڈیسک #95) — پاس ورڈ PBKDF2-SHA256 (p2$iter$salt$hash)، گوگل ID ٹوکن یہیں جانچا، SMS OTP نہیں (مالک کا فیصلہ) ===== */
const UA_ITER = 30000;
const hex = (u8) => Array.from(u8).map((x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (h) => new Uint8Array((String(h).match(/../g) || []).map((x) => parseInt(x, 16)));
async function uaHash(pw, saltHex, iter) {
  const salt = saltHex ? unhex(saltHex) : crypto.getRandomValues(new Uint8Array(16)), it = iter || UA_ITER;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: it }, k, 256);
  return "p2$" + it + "$" + hex(salt) + "$" + hex(new Uint8Array(bits));
}
async function uaCheck(pw, stored) {
  const p = String(stored || "").split("$"); if (p[0] !== "p2" || p.length !== 4) return false;
  const h = await uaHash(pw, p[2], parseInt(p[1], 10)); const a = h.split("$")[3], b = p[3];
  if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0;
}
async function uaTokHash(tok) { return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("ua:" + tok)))).slice(0, 48); }
async function handleMcsAuth(request, env) {
  if (!env.MCS_STATS) return reply({ error: "not_ready" }, 503);
  const stub = env.MCS_STATS.get(env.MCS_STATS.idFromName("mcs"));
  const call = async (body) => (await stub.fetch("https://s/ua", { method: "POST", body: JSON.stringify(body) })).json();
  let b = {}; try { b = JSON.parse(await request.text()); } catch (e) { return reply({ error: "bad_json" }, 400); }
  const S = (v, n) => String(v == null ? "" : v).replace(/[<>"]/g, "").replace(/\s+/g, " ").slice(0, n).trim();
  const pw = String(b.pw || ""), op = String(b.op || "");
  const pwOk = (p) => p.length >= 5 && p.length <= 64;   /* MCS1111WE312: 5–6 ہندسوں کا PIN بھی */
  const yobV = (() => { const y = String(b.yob || "").replace(/\D/g, ""); const n = parseInt(y, 10), cy = new Date().getUTCFullYear(); return y.length === 4 && n >= 1920 && n <= cy - 8 ? y : ""; })();   /* MCS1711TU505: پیدائش کا سال */
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const th = b.tok ? await uaTokHash(String(b.tok).slice(0, 80)) : "";
  const dev = String(b.dev || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  let r;
  if (op === "signup") {
    const name = S(b.name, 60), mobile = entPhone(b.mobile), email = b.email ? entEmail(b.email) : "";
    if (name.length < 2) return reply({ ok: false, reason: "name" });
    if (!mobile) return reply({ ok: false, reason: "mobile" });
    if (b.email && !email) return reply({ ok: false, reason: "email" });
    let gmail = "";
    if (b.gtoken) { gmail = await verifyGoogleIdToken(b.gtoken); if (!gmail) return reply({ ok: false, reason: "google" }); }
    if (!gmail && !pwOk(pw)) return reply({ ok: false, reason: "pw" });
    if (gmail && !pwOk(pw)) return reply({ ok: false, reason: "pw" });   /* MCS1511SU450 (مالک کا حکم): گوگل سے بھی PIN لازمی — موبائل + PIN ہمیشہ چلے */
    const district = S(b.district, 60);   /* MCS1111WE312: ضلع اختیاری (مالک: سائن اپ پر صرف نام، موبائل، PIN) */
    r = await call({ act: "signup", name, mobile, district, email: email || "", gmail, pwh: pw ? await uaHash(pw) : "", dev, yob: yobV });
  } else if (op === "login") {
    const id = S(b.id, 80).toLowerCase(), ids = [];
    if (/^mcs-?\d{6,}$/.test(id)) ids.push("a:" + id.replace(/^mcs-?/, "MCS-").toUpperCase());
    else if (/^mcs-?\d{1,5}$/.test(id)) ids.push("a:MCS" + id.replace(/\D/g, "").padStart(3, "0"));   /* MCS1511SU429: نئی ID MCS001 */
    if (entPhone(id)) ids.push("m:" + entPhone(id));
    if (entEmail(id)) ids.push("e:" + entEmail(id), "g:" + entEmail(id));
    if (!ids.length || !pw) return reply({ ok: false, reason: "login" });
    const fk = ip + "|" + ids[0];
    r = await call({ act: "find", ids, fk });
    const uid0 = r.ok ? r.id : "";
    if (r.ok) r = (await uaCheck(pw, r.pwh)) ? await call({ act: "pwok", id: r.id, fk }) : await call({ act: "pwbad", fk });
    if (r.ok && uid0 && b.gtoken) {   /* MCS1611MO476: «Continue with Google» والا Gmail اسی اکاؤنٹ سے جوڑیں */
      const gm = await verifyGoogleIdToken(b.gtoken);
      if (gm) { const lr = await call({ act: "glink", id: uid0, gmail: gm }); r.glink = lr && lr.ok ? gm : ((lr && lr.reason) || "no"); }
    }
  } else if (op === "actmake") {   /* MCS1211TH334: صرف ڈویلپر (My City Shines ایڈمن) */
    if (!(await verifyFirebaseAdmin(request))) return reply({ ok: false, reason: "admin_only" }, 403);
    const mobile = entPhone(b.mobile); if (!mobile) return reply({ ok: false, reason: "mobile" });
    r = await call({ act: "actmake", mobile, name: S(b.name, 60), rec: S(b.rec, 80), kind: b.kind === "doctor" ? "doctor" : "service", recId: S(b.recId, 80), until: Number(b.until) || 0, prof: S(b.prof, 100), cnic: String(b.cnic || "").replace(/\D/g, "").slice(0, 13), district: S(b.district, 60) });
  } else if (op === "relink") {   /* MCS1211TH335 */
    const mobile = entPhone(b.mobile); if (!mobile) return reply({ ok: false, reason: "mobile" });
    r = await call({ act: "relink", mobile, name: S(b.name, 60), district: S(b.district, 60), cnic: String(b.cnic || "").replace(/\D/g, "").slice(0, 13), fk: ip + "|rl2" });
  } else if (op === "staffcnic") {   /* MCS1211TH335 */
    if (!(await verifyFirebaseAdmin(request))) return reply({ ok: false, reason: "admin_only" }, 403);
    r = await call({ act: "staffcnic", who: String(b.who || ""), cnic: String(b.cnic || "").replace(/\D/g, "").slice(0, 13) });
  } else if (op === "actuse") {   /* MCS1211TH334 */
    const c = String(b.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length !== 8) return reply({ ok: false, reason: "badcode" });
    r = await call({ act: "actuse", code: c.slice(0, 4) + "-" + c.slice(4), fk: ip + "|ac", dev });
  } else if (op === "sidreset") {   /* MCS1211TH351 — صرف ڈویلپر */
    if (!(await verifyFirebaseAdmin(request))) return reply({ ok: false, reason: "admin_only" }, 403);
    r = await call({ act: "sidreset", admin: true, list: Array.isArray(b.list) ? b.list.slice(0, 50) : [], agentFirst: String(b.agentFirst || "") });
  } else if (op === "reglist") {   /* MCS1211TH347 */
    const admin = !!(await verifyFirebaseAdmin(request));
    r = await call({ act: "reglist", admin, phone: S(b.phone, 20), pin: S(b.pin, 12) });
  } else if (op === "reglook") {   /* MCS1211TH333 */
    const id = S(b.id, 40).toLowerCase(), ids = [], pk = String(b.pk || "").replace(/\D/g, "").slice(0, 4);
    if (/^mcs-?\d{1,5}$/.test(id)) ids.push("a:MCS" + id.replace(/\D/g, "").padStart(3, "0"));
    else if (/^mcs-?\d{6,}$/.test(id)) ids.push("a:" + id.replace(/^mcs-?/, "MCS-").toUpperCase());
    if (entPhone(id)) ids.push("m:" + entPhone(id));
    if (!ids.length || pk.length !== 4) return reply({ ok: false, reason: "nomatch" });
    r = await call({ act: "reglook", ids, pk, fk: ip + "|rl" });
  } else if (op === "acctadm") {   /* MCS1511SU444 — صرف ایڈمن: سائن اپ اکاؤنٹ ڈھونڈو / صاف کرو */
    if (!(await verifyFirebaseAdmin(request))) return reply({ ok: false, reason: "admin_only" }, 403);
    const keys = [], mobs = [];
    for (const q0 of (Array.isArray(b.q) ? b.q : []).slice(0, 12)) {
      const q = S(q0, 80).toLowerCase();
      if (/^mcs-?\d{6,}$/.test(q)) keys.push("a:" + q.replace(/^mcs-?/, "MCS-").toUpperCase());
      else if (/^mcs-?\d{1,5}$/.test(q)) keys.push("a:MCS" + q.replace(/\D/g, "").padStart(3, "0"));
      if (entPhone(q)) { keys.push("m:" + entPhone(q)); mobs.push(entPhone(q)); }
      if (entEmail(q)) keys.push("e:" + entEmail(q), "g:" + entEmail(q));
    }
    r = await call({ act: "acctadm", admin: true, keys, mobs, del: b.del === true, uid: S(b.uid, 40), mob: entPhone(b.mob) || "", k: S(b.k, 120) });
  } else if (op === "google") {
    const gmail = await verifyGoogleIdToken(b.gtoken); if (!gmail) return reply({ ok: false, reason: "google" });
    r = await call({ act: "google", gmail });
  } else if (op === "setdist") {
    const district = S(b.district, 60); if (!district) return reply({ ok: false, reason: "district" });
    r = await call({ act: "setdist", th, district });
  } else if (op === "setname") {   /* MCS1711TU510 */
    const name = S(b.name, 60); if (name.length < 2) return reply({ ok: false, reason: "name" });
    r = await call({ act: "setname", th, name });
  } else if (op === "setyob") {   /* MCS1711TU505 */
    if (!yobV) return reply({ ok: false, reason: "yob" });
    r = await call({ act: "setyob", th, yob: yobV });
  } else if (op === "forgot") {   /* MCS1711TU505: موبائل + پیدائش کا سال → نیا PIN */
    const mobile = entPhone(b.mobile); if (!mobile) return reply({ ok: false, reason: "mobile" });
    if (!yobV) return reply({ ok: false, reason: "yob" }); if (!pwOk(pw)) return reply({ ok: false, reason: "pw" });
    r = await call({ act: "fyob", mobile, yob: yobV, pwh: await uaHash(pw), fk: ip + "|fy" });
  } else if (["me", "logout"].includes(op)) {
    r = await call({ act: op, th });
  } else if (op === "setpw" || op === "delete") {
    if (op === "setpw" && !pwOk(pw)) return reply({ ok: false, reason: "pw" });
    const body = { act: op, th, pwh: op === "setpw" ? await uaHash(pw) : "", yob: op === "setpw" ? yobV : "" };
    r = await call(body);
    if (!r.ok && r.reason === "old") { r = (b.old && await uaCheck(String(b.old), r.pwh)) ? await call(Object.assign(body, { oldOk: 1 })) : { ok: false, reason: "old" }; }
  } else return reply({ ok: false, reason: "bad_op" }, 400);
  if (r && r.pwh) delete r.pwh;
  return reply(r);
}
/* ===== 🤝 MCS کمیشن ایجنٹ (MCS0411WE131) ===== */
async function handleAgent(request, env, path) {
  if (!env.MCS_STATS) return reply({ error: "not_ready" }, 503);
  const stub = env.MCS_STATS.get(env.MCS_STATS.idFromName("mcs"));
  const fwd = async (op, body) => { const r = await stub.fetch("https://s" + op, { method: "POST", body: JSON.stringify(body || {}) }); return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json", ...CORS } }); };
  let b = {}; try { b = JSON.parse(await request.text()); } catch (e) { return reply({ error: "bad_json" }, 400); }
  const S = (v, n) => String(v == null ? "" : v).replace(/[<>]/g, "").slice(0, n).trim();
  const dev = String(b.dev || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  if (path === "/agapply") {
    const phone = entPhone(b.phone); if (!phone) return reply({ ok: false, reason: "bad_phone" });
    const cnic = String(b.cnic || "").replace(/\D/g, ""); if (cnic.length !== 13) return reply({ ok: false, reason: "bad_cnic" });
    if (dev.length < 6) return reply({ error: "bad_dev" }, 400);
    const img = {}; for (const k of ["front", "back", "selfie"]) { const v = String((b.img || {})[k] || ""); if (!/^data:image\/(jpeg|png|webp);base64,/.test(v) || v.length > 700000) return reply({ ok: false, reason: "bad_img", which: k }); img[k] = v; }
    /* MCS0911MO264 (ہیلپ ڈیسک #172، مالک کی ⚡ منظوری): «Earn with MCS» کا سیدھا فارم — اپنا کاروبار نہ ہو تب بھی درخواست (bizRk خالی = noBiz)، منظوری مالک کی؛ کوڈ AG-001 */
    const d = { name: S(b.name, 80), father: S(b.father, 80), cnic: cnic.replace(/^(\d{5})(\d{7})(\d)$/, "$1-$2-$3"), phone, wa: entPhone(b.wa) || "", email: S(b.email, 80), city: S(b.city, 60), address: S(b.address, 200), biz: S(b.biz, 120), bizRk: S(b.bizRk, 60), exp: S(b.exp, 400), dev, full: b.full ? 1 : 0, ref: refNorm(S(b.ref, 40).replace(/[^A-Za-z0-9_\-]/g, "")), mcsId: S(b.mcsId, 20).replace(/[^A-Za-z0-9]/g, "") };   /* MCS1511SU430: کس کے ریفرل سے + اس کی MCS ID */
    if (!d.name || !d.city) return reply({ ok: false, reason: "missing" });
    if (d.full && (!d.father || !d.address || !/@/.test(d.email))) return reply({ ok: false, reason: "missing" });   /* MCS0911MO264: پورے فارم میں سب خانے لازمی */   /* MCS0511TH139: والد کا نام / پتہ اختیاری (آسان فارم) */
    return fwd("/ag_apply", { d, img });
  }
  if (path === "/agfree") return fwd("/ag_free", {});
  if (path === "/agfind") { const code = S(b.code, 60); if (!code) return reply({ ok: false, reason: "bad_code" }); return fwd("/ag_find", { code, phone: (() => { const dd = code.replace(/\D/g, ""); return dd.length >= 10 && dd.length <= 12 && /^0?3\d{9}$/.test(dd.slice(-11)) ? entPhone(code) : ""; })() }); }
  if (path === "/agref") { const code = S(b.code, 60), rk = S(b.rk, 60); if (!code || !rk) return reply({ ok: false, reason: "missing" }); return fwd("/ag_ref", { code, phone: (() => { const dd = code.replace(/\D/g, ""); return dd.length >= 10 && dd.length <= 12 && /^0?3\d{9}$/.test(dd.slice(-11)) ? entPhone(code) : ""; })(), rk, d: { name: S(b.name, 80), phone: S(b.phone, 20), cat: S(b.cat, 60), city: S(b.city, 60) } }); }
  if (path === "/agportal") {
    const admin = b.admin ? await verifyFirebaseAdmin(request) : false;
    if (b.admin && !admin) return reply({ error: "admin_only" }, 403);
    const phone = entPhone(b.phone); if (!admin && (!phone || !b.pin)) return reply({ ok: false, reason: "login" });
    const media = (v, n) => { v = String(v || ""); return /^data:(image|audio)\/[a-z0-9.+-]+(;codecs=[a-z0-9.]+)?;base64,/.test(v) && v.length <= n ? v : ""; };
    return fwd("/ag_portal", { admin: !!admin, code: S(b.code, 60), phone, pin: S(b.pin, 10), act: S(b.act, 10), rk: S(b.rk, 60), note: S(b.note, 400), text: S(b.text, 2000), img: media(b.img, 700000), audio: media(b.audio, 900000) });
  }
  if (path === "/cdchat") { const phone = entPhone(b.phone); if (!phone || !b.pin) return reply({ ok: false, reason: "login" }); const media = (v, n) => { v = String(v || ""); return /^data:(image|audio)\/[a-z0-9.+-]+(;codecs=[a-z0-9.]+)?;base64,/.test(v) && v.length <= n ? v : ""; }; return fwd("/cd_chat", { phone, pin: S(b.pin, 10), act: S(b.act, 10), text: S(b.text, 2000), img: media(b.img, 700000), audio: media(b.audio, 900000) }); }
  if (path === "/fin2") {   /* AGP0911MO018: MCS کا حساب — ڈویلپر (ایڈمن ٹوکن / PIN سیشن)، ایجنٹ / کو-ڈویلپر (موبائل + PIN) */
    const as = ["dev", "agent", "cd"].includes(b.as) ? b.as : ""; if (!as) return reply({ ok: false, reason: "login" });
    const adminOk = as === "dev" ? await verifyFirebaseAdmin(request) : false;
    const img = (v, n) => { v = String(v || ""); return /^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length <= n ? v : ""; };
    const acct = b.acct && typeof b.acct === "object" ? { method: S(b.acct.method, 40), title: S(b.acct.title, 80), number: S(b.acct.number, 40), iban: S(b.acct.iban, 40), bank: S(b.acct.bank, 60), qr: img(b.acct.qr, 400000) } : null;
    return fwd("/fin2", { as, adminOk: !!adminOk, phone: as === "dev" ? "" : entPhone(b.phone), pin: S(b.pin, 10), op: S(b.op, 10), mon: S(b.mon, 7), acct, kind: S(b.kind, 4), amount: b.amount, rk: S(b.rk, 60), ref: S(b.ref, 20), biz: S(b.biz, 80), note: S(b.note, 200), who: S(b.who, 40), method: S(b.method, 40), acctNo: S(b.acctNo, 60), img: img(b.img, 700000), id: S(b.id, 20), why: S(b.why, 200), code: S(b.code, 40) });
  }
  if (path === "/pplogin") {   /* AGP0911MO015: {op: login|yob|devpin|forgot, role, pin, phone, yob, newpin, tok} */
    const op = String(b.op || "login"); if (!["login", "yob", "devpin", "forgot", "chpin"].includes(op)) return reply({ ok: false, reason: "bad_op" });
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const adminOk = (op === "devpin" || (op === "yob" && b.role === "dev" && !b.tok)) ? await verifyFirebaseAdmin(request) : false;
    return fwd("/pp_" + op, { role: S(b.role, 8), pin: S(b.pin, 10).replace(/\D/g, ""), phone: b.phone ? entPhone(b.phone) : "", yob: S(b.yob, 4), newpin: S(b.newpin, 10).replace(/\D/g, ""), tok: S(b.tok, 60), key: (dev || "x") + "|" + ip, adminOk: !!adminOk });
  }
  if (path === "/cdfin") { const phone = entPhone(b.phone); if (!phone || !b.pin) return reply({ ok: false, reason: "login" }); return fwd("/cd_fin", { phone, pin: S(b.pin, 10), mon: S(b.mon, 7) }); }
  if (path === "/codev") { const phone = entPhone(b.phone); if (!phone || !b.pin) return reply({ ok: false, reason: "login" }); return fwd("/cd_login", { phone, pin: S(b.pin, 10) }); }
  if (path === "/codevadmin") {
    if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403);
    const op = String(b.op || "list"); if (!["list", "add", "del", "off", "on", "perms"].includes(op)) return reply({ error: "bad_op" }, 400);
    const phone = op === "list" ? "" : entPhone(b.phone); if (op !== "list" && !phone) return reply({ ok: false, reason: "bad_phone" });
    if (op === "add" && !S(b.name, 60)) return reply({ ok: false, reason: "missing" });
    if (op === "add" && phone === "923206793793") return reply({ ok: false, reason: "self" });   /* ایڈمن 1 خود */
    const perms = b.perms && typeof b.perms === "object" ? b.perms : null;
    return fwd("/cd_admin", { op, phone, name: S(b.name, 60), perms });
  }
  if (path === "/aioid") {   /* AIO0911MO190: AIO ID — رجسٹر / حالت / ڈھونڈنا / ملازم شامل */
    const op = S(b.op, 10), id = S(b.id, 12).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (op === "reg") {
      const name = S(b.name, 60), mobile = String(b.mobile || "").replace(/\D/g, "").slice(-11), gmail = S(b.gmail, 80).toLowerCase();
      if (dev.length < 6 || name.length < 2 || mobile.length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)) return reply({ ok: false, reason: "missing" });
      return fwd("/aio_id", { op, dev, name, mobile, gmail, app: S(b.app, 8) || "AIO" });
    }
    if (!/^AIO\d{5}$/.test(id)) return reply({ ok: false, reason: "bad_id" });
    if (op === "me" || op === "done" || op === "del") { if (dev.length < 6) return reply({ ok: false, reason: "none" }); return fwd("/aio_id", { op, id, dev }); }
    const by = String(b.by || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64); if (by.length < 6) return reply({ ok: false, reason: "bad_by" });
    if (op === "look") return fwd("/aio_id", { op, id, by });
    if (op === "invite") {
      const biz = S(b.biz, 24).toUpperCase(), pin = String(b.pin || "").replace(/\D/g, "").slice(0, 8);
      if (!/^BIZ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(biz) || pin.length < 4) return reply({ ok: false, reason: "missing" });
      return fwd("/aio_id", { op, id, by, biz, pin, uname: S(b.uname, 40), role: b.role === "admin" ? "admin" : "salesman", shop: S(b.shop, 60) });
    }
    return reply({ ok: false, reason: "op" });
  }
  if (path === "/agstatus" && b.tok && !b.pin) { if (dev.length < 6) return reply({ ok: false, reason: "none" }); return fwd("/ag_status", { th: await uaTokHash(String(b.tok).slice(0, 80)), dev }); }   /* MCS0911MO266: مالک کا بنایا ایجنٹ — اسی موبائل والے اکاؤنٹ کے فون پر خود ایجنٹ (PIN کے بغیر، PIN نہیں لوٹتا) */
  if (path === "/agstatus") { const phone = entPhone(b.phone); if (!phone || dev.length < 6) return reply({ ok: false, reason: "none" }); return fwd("/ag_status", { phone, dev, pin: S(b.pin, 10) }); }
  if (path === "/agpropose") {
    const cc = b.c || {}, cn = String(cc.cnic || "").replace(/\D/g, ""), c = { name: S(cc.name, 80), phone: entPhone(cc.phone), code: S(cc.code, 60), city: S(cc.city, 60), biz: S(cc.biz, 120), cnic: cn.length === 13 ? cn.replace(/^(\d{5})(\d{7})(\d)$/, "$1-$2-$3") : "" };
    if (!c.name || !c.phone || !/^p\d{10}/.test(c.code)) return reply({ ok: false, reason: "missing" });
    if (!c.cnic) return reply({ ok: false, reason: "bad_cnic" });
    return fwd("/ag_propose", { cphone: entPhone(b.cphone), cpin: S(b.cpin, 10), c });
  }
  if (path === "/agdocs") {
    const phone = entPhone(b.phone); if (!phone || !b.pin || dev.length < 6) return reply({ ok: false, reason: "login" });
    const cnic = String(b.cnic || "").replace(/\D/g, ""); if (cnic.length !== 13) return reply({ ok: false, reason: "bad_cnic" });
    const img = {}; for (const k of ["front", "back", "selfie"]) { const v = String((b.img || {})[k] || ""); if (!/^data:image\/(jpeg|png|webp);base64,/.test(v) || v.length > 700000) return reply({ ok: false, reason: "bad_img", which: k }); img[k] = v; }
    return fwd("/ag_docs", { phone, pin: S(b.pin, 10), dev, cnic: cnic.replace(/^(\d{5})(\d{7})(\d)$/, "$1-$2-$3"), father: S(b.father, 80), img });
  }
  if (path === "/smcode") {   /* SM1611MO275 (مالک کا حکم): سبزی منڈی کے چھوٹے 6 ہندسوں کے کوڈ — NB نیا کاروبار / SB تجدید (دکاندار ← ڈویلپر)، JS ملازم ← مالک */
    const op = S(b.op, 8), code = String(b.code || "").replace(/\D/g, "").slice(-6), app = b.app === "DR" ? "DR" : "SM";
    let kind = String(b.kind || "").toUpperCase();
    if (!["put", "get", "set", "me", "proof"].includes(op)) return reply({ ok: false, reason: "bad_op" });
    if (op !== "put" && code.length !== 6) return reply({ ok: false, reason: "bad_code" });
    if (op === "put" && !(app === "DR" ? ["NB", "SB"] : ["NB", "SB", "JS"]).includes(kind)) return reply({ ok: false, reason: "bad_kind" });
    if (app === "DR" && kind) kind = "D" + kind;   /* AIODR1611MO173: AIO Direct کے کوڈ الگ (DNB / DSB) — سبزی منڈی سے کبھی نہیں ملتے */
    const uid = String(b.uid || "").replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 80);
    if ((op === "put" || op === "me" || op === "proof" || (op === "set" && b.st === "joined")) && uid.length < 16) return reply({ ok: false, reason: "bad_uid" });   /* SM1611MO276: فون کی لمبی خفیہ چابی، چھوٹا device UID نہیں */
    let dev = (op === "get" || op === "set") && (request.headers.get("Authorization") || "").length > 20 ? (app === "DR" ? await verifySmDev(request, "aio-pos-backup", DR_DEV_EMAILS) : await verifySmDev(request)) : false;
    if (!dev && app === "SM" && (op === "get" || op === "set") && b.devpw) {   /* SM1611MO280: سبزی منڈی کے ڈویلپر پینل والا پاس ورڈ (SHA-256 ایپ کے DEFAULT_DEV_PANEL_PASSWORD_HASH جیسا) */
      const hx = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(b.devpw).trim().slice(0, 100))))).map((x) => x.toString(16).padStart(2, "0")).join("");
      dev = hx === "8de8edb14148430ed24a4ffb0b9050acf152f1b85f3e39f7ca54278b110d625f";
    }
    const js = (v, n) => { const s = typeof v === "string" ? v : JSON.stringify(v || {}); return s.length > n ? null : s; };
    const data = js(b.data, 6000), res = js(b.res, 3000); if (data === null || res === null) return reply({ ok: false, reason: "too_big" });
    return fwd("/sm_code", { op, code, kind, app, data, res, uid, dev, st: S(b.st, 10), tid: S(b.tid, 80), shot: op === "proof" && /^data:image\/(jpeg|png|webp);base64,/.test(String(b.shot || "")) && String(b.shot).length < 400000 ? String(b.shot) : "", ip: request.headers.get("CF-Connecting-IP") || "" });
  }
  if (path === "/mcscity") {   /* MCS1711TU494: شہر کی تصویر — دیکھنا سب، لگانا / ہٹانا صرف ایڈمن */
    const op = ["put", "del", "list", "ver"].includes(b.op) ? b.op : "get";
    if ((op === "put" || op === "del") && !(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403);
    return fwd("/mcs_city", { op, city: String(b.city || ""), img: op === "put" ? String(b.img || "") : "" });
  }
  if (path === "/mcsdir") {   /* MCS1611MO466: غیر رجسٹرڈ کارڈوں کی نقل — پڑھنا سب، لکھنا صرف ایڈمن 1 */
    if (b.op === "put") { if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403); return fwd("/mcs_dir", { op: "put", data: String(b.data || ""), n: b.n }); }
    return fwd("/mcs_dir", { op: b.op === "get" ? "get" : "ver" });
  }
  if (path === "/mcsbackup") {   /* AGP1711TU036: روز کا بیک اپ — صرف ڈویلپر (فہرست / ڈاؤن لوڈ / ابھی بنائیں) */
    if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403);
    if (b.op === "run") return fwd("/bk_run", { force: true });
    return fwd("/bk_get", { op: b.op === "get" ? "get" : "list", day: String(b.day || "").slice(0, 10) });
  }
  if (path === "/mcsuse") {   /* MCS0911MO254: 📊 استعمال — ایپ گنتی بھیجے (add)؛ پڑھنا صرف ایڈمن */
    if (b.op === "add") return fwd("/mcs_use", { op: "add", r: b.r, w: b.w, d: b.d, dev });
    if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403);
    return fwd("/mcs_use", { op: "get", fresh: !!b.fresh });
  }
  if (path === "/mcschat") {   /* MCS0911MO251: 💬 My Chats */
    const as = String(b.as || ""); if (!["user", "agent", "cd", "dev", "biz"].includes(as)) return reply({ ok: false, reason: "login" });
    const op = String(b.op || ""); if (!["list", "thread", "send", "av", "find"].includes(op)) return reply({ error: "bad_op" }, 400);
    const admin = as === "dev" ? await verifyFirebaseAdmin(request) : false; if (as === "dev" && !admin) return reply({ ok: false, reason: "login" });
    const media = (v, n) => { v = String(v || ""); return /^data:(image|audio)\/[a-z0-9.+-]+(;codecs=[a-z0-9.]+)?;base64,/.test(v) && v.length <= n ? v : ""; };
    const bizRec = as === "biz" && /^p\d{10}(_[a-z0-9]{2,12})?$/.test(String(b.rec || "")) ? String(b.rec) : "";   /* MCS1111WE294 (ہیلپ ڈیسک #217): کاروبار والا — اکاؤنٹ کے بغیر، کاروبار کی چابی سے */
    return fwd("/mc_chat", { as, op, admin: !!admin, rec: bizRec, key: as === "biz" ? S(b.key, 40) : "", bn: as === "biz" ? S(b.bn, 60) : "", phone: entPhone(b.phone) || "", pin: S(b.pin, 10), th: as === "user" && b.tok ? await uaTokHash(String(b.tok).slice(0, 80)) : "", thr: S(b.thr, 120), text: S(b.text, 2000), img: media(b.img, op === "av" ? 80000 : 700000), audio: media(b.audio, 900000), file: (() => { const v = String(b.file || ""); return /^data:[a-z]+\/[a-z0-9.+-]+;base64,/i.test(v) && v.length <= 950000 ? v : ""; })(), fname: S(b.fname, 120), phones: S(b.phones, 600), pn: (b.pn && typeof b.pn === "object") ? Object.fromEntries(Object.entries(b.pn).slice(0, 40).map(([k, v]) => [String(k).replace(/\D/g, "").slice(-10), S(v, 60)])) : {} });
  }
  if (path === "/agadmin") {
    if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403);
    const op = String(b.op || ""); if (!["list", "imgs", "approve", "reject", "pending", "delete", "rate", "pay", "unpay", "proofdone", "create", "fin", "gcut", "inbox", "thread", "deact", "react", "agpin", "recode", "free"].includes(op)) return reply({ error: "bad_op" }, 400);
    let c;
    if (op === "create") { const cc = b.c || {}, cn = String(cc.cnic || "").replace(/\D/g, ""); c = { name: S(cc.name, 80), phone: entPhone(cc.phone), code: S(cc.code, 60), city: S(cc.city, 60), biz: S(cc.biz, 120), cnic: cn.length === 13 ? cn.replace(/^(\d{5})(\d{7})(\d)$/, "$1-$2-$3") : "", father: S(cc.father, 80), address: S(cc.address, 200), email: S(cc.email, 80), wa: entPhone(cc.wa) || "" };
      if (cc.img && typeof cc.img === "object") { c.img = {}; for (const k of ["front", "back", "selfie"]) { const v = String(cc.img[k] || ""); if (/^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length <= 700000) c.img[k] = v; } }   /* MCS0911MO266: ڈویلپر کے فارم کی تصویریں (اختیاری) */
      if (!c.name || !c.phone) return reply({ ok: false, reason: "missing" }); if (!c.cnic) return reply({ ok: false, reason: "bad_cnic" }); }
    const media = (v, n) => { v = String(v || ""); return /^data:(image|audio)\/[a-z0-9.+-]+(;codecs=[a-z0-9.]+)?;base64,/.test(v) && v.length <= n ? v : ""; };
    return fwd("/ag_admin", { op, id: String(b.id || "").slice(0, 40), note: b.note, code: S(b.code, 60), amount: b.amount, pid: b.pid, c, mon: S(b.mon, 7), text: S(b.text, 2000), img: media(b.img, 700000), audio: media(b.audio, 900000) });
  }
  return reply({ error: "not_found" }, 404);
}
async function handleEnt(request, env, path) {
  if (!env.MCS_STATS) return reply({ error: "not_ready" }, 503);
  const stub = env.MCS_STATS.get(env.MCS_STATS.idFromName("mcs"));
  const fwd = async (op, body) => { const r = await stub.fetch("https://s" + op, { method: "POST", body: JSON.stringify(body || {}) }); return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json", ...CORS } }); };
  let b = {}; try { b = JSON.parse(await request.text()); } catch (e) { return reply({ error: "bad_json" }, 400); }
  const app = String(b.app || ""); if (!ENT_APPS.includes(app)) return reply({ error: "bad_app" }, 400);
  if (path === "/entdev") {
    const dev = String(b.dev || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64); if (dev.length < 6) return reply({ error: "bad_dev" }, 400);
    return fwd("/ent_dev", { app, dev });
  }
  if (path === "/entclaim" || path === "/entstatus") {
    const dev = String(b.dev || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64); if (dev.length < 6) return reply({ error: "bad_dev" }, 400);
    let key = "";
    if (path === "/entstatus") key = String(b.key || "").slice(0, 120);
    else if (b.kind === "g") { const em = await verifyGoogleIdToken(b.idToken); if (!em) return reply({ ok: false, reason: "google_failed" }); key = "g:" + em; }
    else if (b.kind === "p") { const ph = entPhone(b.phone); if (!ph) return reply({ ok: false, reason: "bad_phone" }); key = "p:" + ph; }
    else if (b.kind === "c") {   /* ایکٹیویشن کوڈ ACT-XXXXXX (خالی جگہ / چھوٹے حروف / ڈیش کے بغیر بھی چلے) */
      /* HD1711: کوڈ = پیکج کا نام + 6 حروف (مثلاً 1P1-6M-K7Q9XA)، پرانا ACT-XXXXXX بھی چلتا ہے؛ ڈیش / خالی جگہ / چھوٹے حروف کی پرواہ نہیں */
      const c = String(b.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (c.length < 8 || c.length > 32) return reply({ ok: false, reason: "bad_code" });
      if ((await (await fwd("/ent_codefail", { dev, act: "check" })).json()).blocked) return reply({ ok: false, reason: "wait" });
      key = (c.startsWith("ACT") && c.length === 9) ? "c:ACT-" + c.slice(3) : "c:" + c;
    }
    if (!/^[gpc]:/.test(key)) return reply({ error: "bad_key" }, 400);
    const pin = b.kind === "p" ? String(b.pin || "").replace(/[^0-9]/g, "").slice(0, 8) : "";
    const r = await fwd("/ent_claim", { app, key, dev, bind: path === "/entclaim", pin, biz: String(b.biz || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60) });
    const out = await r.json(); out.key = key;
    if (b.kind === "c" && path === "/entclaim") { if (out.ok) await fwd("/ent_codefail", { dev, act: "clear" }); else if (out.reason === "none" || out.reason === "used") await fwd("/ent_codefail", { dev, act: "fail" }); }
    return reply(out);
  }
  if (path === "/entadmin") {
    /* HD1711: ایڈمن = My City Shines کا فائربیس ایڈمن، یا ہیلپ ڈیسک کا مالک (sabzi-mandi فائربیس، ڈویلپر ای میل) */
    if (!(await verifyFirebaseAdmin(request)) && !(await verifySmDev(request)) && !(await verifySmDev(request, "pbt-help-desk", SM_DEV_EMAILS))) return reply({ error: "admin_only" }, 403);   /* HD1711TU112: ہیلپ ڈیسک کا اپنا فائربیس (pbt-help-desk) بھی مالک کے لیے */
    const op = String(b.op || "");
    if (op === "grant") {
      const keys = [].concat((b.emails || []).map(entEmail).filter(Boolean).map((e) => "g:" + e), (b.phones || []).map(entPhone).filter(Boolean).map((p) => "p:" + p));
      if (!keys.length && !b.id) return reply({ ok: false, reason: "no_keys" });
      const days = Math.max(0, Math.min(3650, parseInt(b.days, 10) || 0)), devices = Math.max(1, Math.min(20, parseInt(b.devices, 10) || 1));
      if (!days && !b.life && !b.id) return reply({ ok: false, reason: "no_days" });
      return fwd("/ent_admin", { op, app, id: String(b.id || "").slice(0, 40), keys, days, life: !!b.life, devices, name: String(b.name || "").slice(0, 80), note: b.note === undefined ? undefined : String(b.note).slice(0, 300), setExp: parseInt(b.setExp, 10) || 0, bindDev: String(b.uid || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64).replace(/^(.{0,5})$/, "") });
    }
    if (op === "pkglist") return fwd("/ent_admin", { op, app });
    if (op === "pkgsave") return fwd("/ent_admin", { op, app, pkg: b.pkg && typeof b.pkg === "object" ? b.pkg : {} });
    if (op === "pkgdel") return fwd("/ent_admin", { op, app, pkgId: String(b.pkgId || "").slice(0, 40) });
    if (app === "MCS" && (op === "gencode" || op === "mcslook")) {   /* MCS1711TU500: MCS نمبر سے بندے کا کوڈ */
      const sid = String(b.sid || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
      if (!/^MCS\d{1,5}(M\d{1,2})?$/.test(sid)) return reply({ ok: false, reason: "no_sid" });
      return fwd("/ent_admin", { op, app, sid, count: 1, label: String(b.label || "").slice(0, 60), note: String(b.note || "").slice(0, 300) });
    }
    if (op === "gencode" && b.pkgId) {   /* HD1711: موجودہ پیکج چن کر — مدت / فون / نام سرور کی پیکج فہرست سے */
      const count = Math.max(1, Math.min(50, parseInt(b.count, 10) || 1));
      return fwd("/ent_admin", { op, app, pkgId: String(b.pkgId).slice(0, 40), count, label: String(b.label || "").slice(0, 60), note: String(b.note || "").slice(0, 300) });
    }
    if (op === "gencode") {
      const days = Math.max(0, Math.min(3650, parseInt(b.days, 10) || 0)), devices = Math.max(1, Math.min(20, parseInt(b.devices, 10) || 1)), count = Math.max(1, Math.min(50, parseInt(b.count, 10) || 1));
      if (!days && !b.life) return reply({ ok: false, reason: "no_days" });
      return fwd("/ent_admin", { op, app, days, life: !!b.life, devices, count, label: String(b.label || "").slice(0, 60), note: String(b.note || "").slice(0, 300) });
    }
    if (op === "list") return fwd("/ent_admin", { op, app });
    if (["revoke", "unrevoke", "reset", "delete", "newpin"].includes(op)) return fwd("/ent_admin", { op, app, id: String(b.id || "").slice(0, 40) });
    return reply({ error: "bad_op" }, 400);
  }
  return reply({ error: "not_found" }, 404);
}
async function handleVerify(request, env, path) {
  if (!env.MCS_STATS) return reply({ error: "not_ready" }, 503);
  const stub = env.MCS_STATS.get(env.MCS_STATS.idFromName("mcs"));
  const clean = (v) => String(v || "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40);
  const fwd = async (op, body) => { const r = await stub.fetch("https://s" + op, { method: "POST", body: JSON.stringify(body || {}) }); return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json", ...CORS } }); };
  if (path === "/vlist") return fwd("/vlist");
  let b = {}; if (request.method === "POST") { try { b = JSON.parse(await request.text()); } catch (e) { return reply({ error: "bad_json" }, 400); } }
  if (path === "/vsubmit") {
    const edit = b.edit && typeof b.edit === "object" ? Object.fromEntries(Object.entries(b.edit).slice(0, 10).map(([k, v]) => [String(k).slice(0, 30), String(v || "").slice(0, 400)])) : null;
    return fwd("/vsubmit", { rec: clean(b.rec), tok: clean(b.tok), edit });
  }
  if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403);
  if (path === "/vtoken") return fwd("/vtoken", { rec: clean(b.rec) });
  if (path === "/vunset") return fwd("/vunset", { rec: clean(b.rec) });
  if (path === "/edits") return fwd("/edits");
  if (path === "/editdone") return fwd("/editdone", { id: parseInt(b.id, 10) || 0 });
  return reply({ error: "not_found" }, 404);
}


/* AGP1311FR035: Firestore کا روزانہ کوٹہ امریکی Pacific آدھی رات پر نیا ہوتا ہے (سردیوں میں پاکستان کا دوپہر 1 بجے، گرمیوں میں 12 بجے) */
function fsLaParts(ms) { const p = {}; for (const x of new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(ms))) p[x.type] = x.value; return p; }
function fsQuotaDay(ms) { const p = fsLaParts(ms); return p.year + "-" + p.month + "-" + p.day; }
function fsQuotaReset(ms) { const p = fsLaParts(ms); return ms - ((+p.hour * 3600 + +p.minute * 60 + +p.second) * 1000) + 864e5 - (ms % 1000); }

/* ===== MCS پروفائل کے راستے ===== */
function profClean(d) {
  const S = (v, n) => String(v == null ? "" : v).slice(0, n);
  d = d && typeof d === "object" ? d : {};
  const out = { about: S(d.about, 1500), hours: S(d.hours, 120), off: S(d.off, 60), addr: S(d.addr, 200) };
  out.items = (Array.isArray(d.items) ? d.items : []).slice(0, 20).map((x) => ({ n: S(x && x.n, 60), p: S(x && x.p, 24) })).filter((x) => x.n);
  out.phones = (Array.isArray(d.phones) ? d.phones : []).slice(0, 3).map((x) => S(x, 20).replace(/[^0-9+\- ]/g, "")).filter(Boolean);
  out.links = (Array.isArray(d.links) ? d.links : []).slice(0, 3).map((x) => S(x, 200)).filter((x) => /^https?:\/\//i.test(x));
  out.ref = refNorm(S(d.ref, 40).replace(/[^A-Za-z0-9_\-]/g, "")) || "PBT";   /* MCS0511TH157: ایجنٹ کا ریفرل کوڈ، نہ ہو تو PBT (ہمارا اپنا گاہک) */
  if (d.map && isFinite(+d.map.lat) && isFinite(+d.map.lon)) out.map = { lat: +(+d.map.lat).toFixed(6), lon: +(+d.map.lon).toFixed(6) };
  return out;
}
/* MCS1511SU427: گوگل پلے آرڈر نمبر — GPA.1234-5678-9012-34567 (تجدید پر آخر میں ..0 وغیرہ لگتا ہے، اسے ہٹا دیتے ہیں) */
function gpaNorm(t) {
  const m = /GPA\.?\s*(\d{4})\s*-?\s*(\d{4})\s*-?\s*(\d{4})\s*-?\s*(\d{5})/.exec(String(t || "").toUpperCase().replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776)));
  return m ? "GPA." + m[1] + "-" + m[2] + "-" + m[3] + "-" + m[4] : "";
}
/* MCS1511SU427: ادائیگی کے بعد کارڈ کو Firestore میں خود approved:true — صرف تب جب کارڈ کا واٹس ایپ نمبر اسی ممبرشپ (rec) کا ہو۔ سروس اکاؤنٹ کے پاس Firestore کی اجازت نہ ہو تو خاموشی سے false (ایپ خود بھی لکھتی ہے) */
async function fsApprove(env, fs, rec, extra) {
  try {
    if (!fs || (fs.col !== "services" && fs.col !== "doctors") || !/^[A-Za-z0-9_-]{4,64}$/.test(String(fs.id || ""))) return false;
    const tk = await getAccessToken(env, "https://www.googleapis.com/auth/datastore");
    const url = "https://firestore.googleapis.com/v1/projects/" + FS_PROJECT + "/databases/(default)/documents/" + fs.col + "/" + fs.id;
    const g = await fetch(url, { headers: { Authorization: "Bearer " + tk } });
    if (!g.ok) return false;
    const f = ((await g.json()).fields) || {};
    const wa = f.whatsapp ? (f.whatsapp.stringValue || f.whatsapp.integerValue || "") : "";
    const mob = entPhone(wa);
    if (!mob || "p" + mob.slice(2) !== String(rec).split("_")[0]) return false;
    /* MCS1511SU428: کارڈ پر ایکٹو کی مدت / ممبرشپ ID بھی لکھ دیں (کارڈ خود دکھائے) — اضافی خانے؛ پرانے خانے نہیں چھیڑے */
    const fl = { approved: { booleanValue: true } };
    if (extra && typeof extra === "object") {
      if (extra.sid) fl.mcsId = { stringValue: String(extra.sid).slice(0, 20) };
      if (extra.subid) fl.mcsSubId = { stringValue: String(extra.subid).slice(0, 24) };
      if (extra.until > 0) fl.activeUntil = { integerValue: String(Math.round(extra.until)) };
      if (extra.kind) fl.planKind = { stringValue: String(extra.kind).slice(0, 10) };
      if (extra.days > 0) fl.planDays = { integerValue: String(Math.round(extra.days)) };
      fl.registered = { booleanValue: true };
    }
    const p = await fetch(url + "?" + Object.keys(fl).map((k) => "updateMask.fieldPaths=" + k).join("&"), { method: "PATCH", headers: { Authorization: "Bearer " + tk, "Content-Type": "application/json" }, body: JSON.stringify({ fields: fl }) });
    return p.ok;
  } catch (e) { return false; }
}
/* MCS1511SU428 (مالک کا حکم): خریداری مکمل ہوتے ہی مبارکباد + مکمل چیک لسٹ — ایپ جوں کا توں دکھائے (ہر قدم ✅ / ⏳) */
function mcsDone(o) {
  const days = Math.max(1, Math.round(((o.exp || 0) - Date.now()) / 864e5)), kind = o.test ? "test" : o.free ? "promo" : "paid";
  const planDays = kind === "paid" && days >= 300 ? 365 : days;
  const planText = planDays === 365 ? "ایک سال" : planDays + " دن";
  const untilTxt = o.until ? new Date(o.until + 5 * 3600e3).toISOString().slice(0, 10) : "";
  const title = "🎉 مبارک ہو!";
  const msg = "آپ کا کاروبار رجسٹر ہو گیا ہے — " + (kind === "paid" ? planText + " کے لیے فعال" : (kind === "test" ? "ٹیسٹ کوڈ سے " : "پروموشن / ریڈیم کوڈ سے ") + planText + " کے لیے فعال") + (untilTxt ? " (" + untilTxt + " تک)" : "") + "۔ یہی مدت اب آپ کے بزنس کارڈ پر نظر آئے گی۔";
  const steps = [
    { k: "google", ok: true, t: "گوگل پلے نے خریداری کی تصدیق کر دی" },
    { k: "pay", ok: true, t: kind === "paid" ? "ادائیگی قبول ہو گئی" : "کوڈ قبول ہو گیا (" + planText + ")" },
    { k: "gpa", ok: !!o.gpa, t: "آرڈر نمبر خود درج ہو گیا" + (o.gpa ? " — " + o.gpa : ""), gpa: o.gpa || "" },
    { k: "ack", ok: !!o.ackOk, t: "خریداری گوگل کے ہاں مکمل (acknowledge)" },
    { k: "package", ok: true, t: "پیکج ایکٹیو — " + planText },
    { k: "biz", ok: !!o.biz, t: "کاروبار رجسٹر ہو گیا" },
    { k: "id", ok: !!o.sid, t: o.sid ? "ممبرشپ ID: " + (o.subid || o.sid) : "ممبرشپ ID بن رہی ہے" },
    { k: "card", ok: !!o.approved, t: o.approved ? "بزنس کارڈ پر ایکٹو لگ گیا" : "بزنس کارڈ پر ایپ ابھی لگا دے گی", byApp: !o.approved }
  ];
  return { title, msg, kind, planDays, planText, until: o.until || 0, untilText: untilTxt, sid: o.sid || "", subid: o.subid || "", gpa: o.gpa || "", complete: steps.every((x) => x.ok || x.byApp), steps };
}
/* MCS0411WE147 / MCS1511SU427: My City Shines کی پلے اسٹور ممبرشپ — ایپ ٹوکن + sku + rec + gpa (آرڈر نمبر) بھیجتی ہے؛ گوگل سے تصدیق، acknowledge، پھر ممبرشپ کی مدت۔
   قاعدے: ٹیسٹ خریداری ✗؛ نئی خریداری پر GPA لازمی اور گوگل کے آرڈر سے ملے؛ ریڈیم / پروموشن کوڈ ✓ (مدت ملے، سیل نہیں)؛ ادا شدہ ✓ — منظوری کے انتظار کے بغیر فعال */
/* MCS1611MO471 (مالک کا حکم): 90 دن کی ایک بار والی ممبرشپ (mcs_mem_90d) اور اس کا پرومو کوڈ راستہ مکمل ختم — صرف سالانہ Google Play سبسکرپشن */
async function handleMcsBuy(request, env, ctx) {
  if (!env.MCS_STATS) return reply({ error: "not_ready" }, 503);
  let b = {}; try { b = JSON.parse(await request.text()); } catch (e) { return reply({ error: "bad_json" }, 400); }
  /* MCS1511SU427: 🧪 ایڈمن کا «ٹیسٹ رجسٹریشن» بٹن — گوگل پلے / پیکج / پیسے کے بغیر؛ صرف ایڈمن؛ مدت دنوں میں (1 سے 90)، سیل / کمیشن نہیں */
  const token = b.purchaseToken;
  if (typeof token !== "string" || token.length < 10 || token.length > 1000) return reply({ ok: false, error: "bad_token" }, 400);
  const rec = String(b.rec || "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40);
  /* MCS1511SU427: غلط rec پر بھی خریداری پہلے acknowledge (ورنہ گوگل منسوخ / واپس کر دیتا ہے)، انکار بعد میں */
  const recBad = !!rec && !/^p\d{10}(_[a-z0-9]{2,12})?$/.test(rec);
  const gpaTyped = b.gpa ? gpaNorm(b.gpa) : "";   /* MCS1511SU428: آرڈر نمبر اب خود گوگل سے آتا ہے — گاہک کا ہاتھ سے لکھا صرف پرانی ایپ کے لیے */
  const tok = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 40);
  const stub = env.MCS_STATS.get(env.MCS_STATS.idFromName("mcs"));
  if (b.probe) { const pr = await (await stub.fetch("https://s/pbuy_probe", { method: "POST", body: JSON.stringify({ tok }) })).json(); return reply(pr); }   /* ایپ: یہ ٹوکن پہلے سے جڑا ہے؟ */
  try {
    const accessToken = await getAccessToken(env);
    const base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" + MCS_PKG;
    const res = await fetch(base + "/purchases/subscriptionsv2/tokens/" + encodeURIComponent(token), { headers: { Authorization: "Bearer " + accessToken } });
    if (!res.ok) return reply({ ok: false, error: "google_" + res.status });
    const d = await res.json();
    const line = (d.lineItems || []).find((l) => MCS_SKUS.includes(l.productId));
    if (!line) return reply({ ok: false, error: "unknown_product" });
    const exp = Date.parse(line.expiryTime) || 0;
    const pi =await subPriceInfo(base, accessToken, line.productId, token);
    const isTest = !!d.testPurchase || !!pi.test;
    const isPromo = !!line.signupPromotion || !!pi.promo;
    const isTrial = !!pi.trial || !!(line.offerDetails && /trial/i.test(line.offerDetails.offerId || ""));
    const isFree = isTest || isPromo || isTrial || pi.micros === 0;   /* ٹیسٹ بھی «مفت» — مدت ملتی ہے، سیل / کمیشن نہیں */
    const info = { state: d.subscriptionState, expiry: exp ? new Date(exp).toISOString().slice(0, 10) : "", test: isTest, promo: isPromo, free: isFree };
    if (isTest && env.ALLOW_TEST === "0") return reply(Object.assign({ ok: false, access: false, error: "test_purchase" }, info));   /* ٹیسٹ خریداری عام طور پر قبول (صرف مالک کے License Testers کی ہوتی ہے)؛ ALLOW_TEST="0" سے بند */
    if (isPromo && env.ALLOW_PROMO === "0") return reply(Object.assign({ ok: false, access: false, error: "promo_off" }, info));
    if (d.subscriptionState === "SUBSCRIPTION_STATE_PENDING") return reply(Object.assign({ ok: false, access: false, error: "pending" }, info));   /* ادائیگی ابھی مکمل نہیں */
    const access = ACCESS_STATES.includes(d.subscriptionState) && exp > Date.now();
    if (!access) return reply(Object.assign({ ok: false, access: false, error: "expired" }, info));
    /* MCS1511SU428 (مالک کا حکم): آرڈر نمبر (GPA) گاہک کو خود لکھنا / پیسٹ نہیں کرنا — سرور اسے گوگل کے جواب سے خود نکال کر لگا دیتا ہے (تجدید پر ..0 کٹ جاتا ہے)۔
       گاہک کا لکھا غلط ہو تو بھی خریداری رکی نہیں رہتی — گوگل والا ہی مانا جاتا ہے؛ GPA_STRICT="1" ہو تو پرانی سختی (غلط لکھا = انکار) */
    const gGoogle = [line.latestSuccessfulOrderId, d.latestOrderId].map(gpaNorm).filter(Boolean);
    let gpaIn = gGoogle[0] || gpaTyped, gpaFixed = false;
    if (gGoogle.length && gpaTyped && !gGoogle.includes(gpaTyped)) { if (env.GPA_STRICT === "1") return reply(Object.assign({ ok: false, access: false, error: "gpa_mismatch" }, info)); gpaFixed = true; }
    if (!gGoogle.length && b.gpa && !gpaTyped) return reply(Object.assign({ ok: false, error: "bad_gpa" }, info));
    let ackOk = d.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED";
    let ackErr = "";
    for (let t = 0; t < 3 && !ackOk; t++) {   /* MCS1511SU427: acknowledge تین کوششیں */
      try {
        const ack = await fetch(base + "/purchases/subscriptions/" + line.productId + "/tokens/" + encodeURIComponent(token) + ":acknowledge", { method: "POST", headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" }, body: "{}" });
        if (ack.ok) { ackOk = true; notifySale(ctx, { pkg: MCS_PKG, sku: line.productId, country: pi.country || d.regionCode || "", price: pi.price, test: isTest, trial: isTrial }); } else ackErr = "ack_" + ack.status;
      } catch (e) { ackErr = "ack_error"; }
      if (!ackOk && t < 2) await new Promise((r) => setTimeout(r, 800));
    }
    if (recBad) return reply(Object.assign({ ok: false, error: "bad_rec", ack: ackOk, ackErr }, info), 400);
    const r = await stub.fetch("https://s/pbuy", { method: "POST", body: JSON.stringify({ tok, rec, sku: line.productId, exp, access: true, free: isFree, test: isTest, gpa: gpaIn }) });
    const j = await r.json();
    if (!j.ok) return reply(Object.assign(j, { access: true }, info));   /* gpa_needed / gpa_used / no_rec / no_prof */
    const done0 = mcsDone({ exp, free: isFree, test: isTest, until: j.until, gpa: gpaIn, ackOk, biz: !!j.ok, sid: j.sid, subid: j.subid, approved: false });
    const approved = await fsApprove(env, b.fs, j.rec, { sid: j.sid, subid: j.subid, until: j.until, kind: done0.kind, days: done0.planDays });
    const done = approved ? mcsDone({ exp, free: isFree, test: isTest, until: j.until, gpa: gpaIn, ackOk, biz: !!j.ok, sid: j.sid, subid: j.subid, approved: true }) : done0;
    return reply(Object.assign(j, info, { access: true, approved, gpa: gpaIn, gpaFixed, ack: ackOk, done }));
  } catch (e) {
    return reply({ ok: false, error: "server_error" }, 500);
  }
}
/* MCS1111WE312: سسٹم ID — موبائل کی MCS-NNN دیکھیں / لگائیں (لگانا صرف ایڈمن یا لاگ اِن اکاؤنٹ) */
async function handleMcsSid(request, env) {
  if (!env.MCS_STATS) return reply({ error: "not_ready" }, 503);
  const stub = env.MCS_STATS.get(env.MCS_STATS.idFromName("mcs"));
  let b = {}; try { b = JSON.parse(await request.text()); } catch (e) { return reply({ error: "bad_json" }, 400); }
  const mob = /^p\d{10}(_[a-z0-9]{2,12})?$/.test(String(b.rec || "")) ? String(b.rec) : entPhone(b.mob);
  if (!mob) return reply({ ok: false, reason: "mobile" });
  let assign = false, by = "";
  if (b.assign) {
    if (await verifyFirebaseAdmin(request)) { assign = true; by = "admin"; }
    else if (b.tok) { const me = await (await stub.fetch("https://s/ua", { method: "POST", body: JSON.stringify({ act: "me", th: await uaTokHash(String(b.tok).slice(0, 80)) }) })).json(); if (me && me.ok) { assign = true; by = me.user.sid || me.user.id; } }
    if (!assign) return reply({ ok: false, reason: "login" }, 403);
  }
  const r = await stub.fetch("https://s/mcs_sid", { method: "POST", body: JSON.stringify({ mob, assign, by }) });
  return new Response(await r.text(), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
async function handleProf(request, env, path) {
  if (!env.MCS_STATS) return reply({ error: "not_ready" }, 503);
  const stub = env.MCS_STATS.get(env.MCS_STATS.idFromName("mcs"));
  const clean = (v) => String(v || "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40);
  const fwd = async (op, body, extra) => { const r = await stub.fetch("https://s" + op, { method: "POST", body: JSON.stringify(body || {}) }); return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json", ...CORS, ...(extra || {}) } }); };
  if (path === "/plist") return fwd("/plist", {}, { "Cache-Control": "max-age=60" });
  const u = new URL(request.url);
  if (path === "/pimg") return fwd("/pimg", { id: clean(u.searchParams.get("id")) }, { "Cache-Control": "public, max-age=2592000" });
  let b = {}; if (request.method === "POST") { try { b = JSON.parse(await request.text()); } catch (e) { return reply({ error: "bad_json" }, 400); } }
  if (path === "/preq") {   /* MCS1111WE330: دکاندار کی «ممبرشپ / رجسٹریشن» درخواست — ڈویلپر کے ہوم پر پٹی اور منظوری کا صفحہ */
    const op = String(b.op || "");
    if (op === "list" || op === "set") { if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403); }
    const rq = clean(b.rec); if (op !== "list" && !/^p\d{10}(_[a-z0-9]{2,12})?$/.test(rq)) return reply({ error: "bad_rec" }, 400);
    const str = (v, n) => String(v == null ? "" : v).slice(0, n);
    const d = b.data && typeof b.data === "object" ? b.data : {};
    const data = op === "add" ? { name: str(d.name, 80), mobile: str(d.mobile, 20), wa: str(d.wa, 20), gmail: str(d.gmail, 80), prof: str(d.prof, 160), cat: str(d.cat, 60), city: str(d.city, 60), area: str(d.area, 120), ref: str(d.ref, 30), refName: str(d.refName, 80), uid: str(d.uid, 40), kind: str(d.kind, 10), text: str(d.text, 1500) } : null;
    return fwd("/preq", { op, rec: rq, data, st: str(b.st, 10), note: str(b.note, 600) });
  }
  if (path === "/adreq") {   /* MCS1711TU504: اشتہار کی درخواست */
    const op = String(b.op || ""), str = (v, n) => String(v == null ? "" : v).slice(0, n);
    if (["list", "img", "set"].includes(op)) { if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403); }
    const uid = str(b.uid, 60).replace(/[^a-zA-Z0-9_\-]/g, "");
    if ((op === "add" || op === "mine") && uid.length < 8) return reply({ error: "bad_uid" }, 400);
    if (op === "add") {
      const d = b.data && typeof b.data === "object" ? b.data : {};
      const days = parseInt(d.days, 10) === 30 ? 30 : 15;
      const data = { shop: str(d.shop, 80), name: str(d.name, 80), phone: str(d.phone, 20), line: str(d.line, 300), kind: str(d.kind, 20), area: str(d.area, 120), days, ref: str(d.ref, 30), refName: str(d.refName, 80), by: str(d.by, 20), rec: clean(d.rec), sid: str(d.sid, 20) };
      if (!data.shop || !data.phone) return reply({ ok: false, reason: "missing" });
      const img = (typeof b.img === "string" && /^data:image\/(jpeg|webp|png);base64,/.test(b.img) && b.img.length < 460000) ? b.img : "";
      return fwd("/adreq", { op, uid, data, img });
    }
    return fwd("/adreq", { op, uid, id: str(b.id, 40), st: str(b.st, 4), note: str(b.note, 400) });
  }
  const rec = clean(b.rec || u.searchParams.get("rec"));
  if (!/^p\d{10}(_[a-z0-9]{2,12})?$/.test(rec)) return reply({ error: "bad_rec" }, 400);   /* فون + کاروبار کی قسم — ایک نمبر کی کئی پروفائلیں */
  if (path === "/pget") return fwd("/pget", { rec });
  if (path === "/pstatus") return fwd("/pstatus", { rec });   /* MCS1511SU428: چیک لسٹ کی موجودہ حالت */
  const admin = await verifyFirebaseAdmin(request);
  if (path === "/pclaim") return fwd("/pclaim", { rec, admin });
  if (path === "/pcode") {   /* MCS1711TU499: ایک سال کا رجسٹریشن کوڈ — کھلا (کوڈ خود اجازت ہے)، ایک IP سے 15 منٹ میں 10 غلط کے بعد روک */
    const c = String(b.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length < 8 || c.length > 32) return reply({ ok: false, reason: "bad_code" });
    return fwd("/pcode", { rec, code: c, by: String(b.by || "").slice(0, 40), ip: request.headers.get("CF-Connecting-IP") || "" });
  }
  if (path === "/psave") {
    const imgs = {};
    Object.entries(b.imgs && typeof b.imgs === "object" ? b.imgs : {}).forEach(([k, v]) => { const slot = parseInt(k, 10); if (slot >= 0 && slot < 4) imgs[slot] = (typeof v === "string" && /^data:image\/(jpeg|webp|png);base64,/.test(v) && v.length < 450000) ? v : null; });
    return fwd("/psave", { rec, key: clean(b.key), admin, data: b.data ? profClean(b.data) : null, imgs });
  }
  if (path === "/padmin") {
    if (!admin) return reply({ error: "admin_only" }, 403);
    return fwd("/padmin", { rec, act: String(b.act || ""), until: parseInt(b.until, 10) || 0 });
  }
  return reply({ error: "not_found" }, 404);
}

export default {
  async scheduled(event, env, ctx) {   /* AGP1711TU036: روز رات 3 بجے (PKT) MCS کا پورا بیک اپ */
    const stub = env.MCS_STATS.get(env.MCS_STATS.idFromName("mcs"));
    ctx.waitUntil(stub.fetch("https://s/bk_run", { method: "POST", body: "{}" }));
  },
  async fetch(request, env, ctx) {
    PP_ENV = env;
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (new URL(request.url).pathname === "/stat") return handleStat(request, env);
    if (new URL(request.url).pathname === "/mcsbuy" && request.method === "POST") return handleMcsBuy(request, env, ctx);
    if (new URL(request.url).pathname === "/mcssid" && request.method === "POST") return handleMcsSid(request, env);
    { const pp = new URL(request.url).pathname; if (["/plist", "/pget", "/pstatus", "/pimg", "/pclaim", "/pcode", "/psave", "/padmin", "/preq", "/adreq"].includes(pp)) return handleProf(request, env, pp); }
    { const ap = new URL(request.url).pathname; if (["/aioid", "/agapply", "/agstatus", "/agadmin", "/agref", "/agportal", "/codev", "/codevadmin", "/agdocs", "/agpropose", "/agfind", "/agfree", "/cdfin", "/cdchat", "/mcschat", "/mcsuse", "/mcsdir", "/mcsbackup", "/mcscity", "/smcode", "/pplogin", "/fin2"].includes(ap) && request.method === "POST") return handleAgent(request, env, ap); }
    if (new URL(request.url).pathname === "/mcsauth" && request.method === "POST") return handleMcsAuth(request, env);
    { const ep = new URL(request.url).pathname; if (["/entclaim", "/entstatus", "/entadmin", "/entdev"].includes(ep) && request.method === "POST") return handleEnt(request, env, ep); }
    { const vp = new URL(request.url).pathname; if (["/vtoken", "/vsubmit", "/vlist", "/vunset", "/edits", "/editdone"].includes(vp)) return handleVerify(request, env, vp); }
    if (request.method === "GET" && new URL(request.url).pathname === "/rates") return handleRates(ctx, new URL(request.url).searchParams.has("debug"));
    if (request.method !== "POST") return reply({ error: "POST only" }, 405);
    if (new URL(request.url).pathname === "/ocr") return handleOcr(request, env);

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return reply({ error: "bad_json" }, 400);
    }

    const token = body && body.purchaseToken;
    if (typeof token !== "string" || token.length < 10 || token.length > 1000) {
      return reply({ error: "bad_token" }, 400);
    }
    const pkg = (body && body.packageName) || DEFAULT_PACKAGE;
    const allowed = APPS[pkg];
    if (!allowed) return reply({ access: false, error: "unknown_app" }, 400);
    const sku = body && typeof body.sku === "string" ? body.sku : "";

    try {
      const accessToken = await getAccessToken(env);
      const base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" + pkg;

      // ---------- لائف ٹائم ہو تو products والا راستہ ----------
      if (sku && (ONETIME[pkg] || []).includes(sku)) {
        return await verifyOneTime(base, accessToken, sku, token, ctx, pkg);
      }

      // ---------- باقی سب سبسکرپشن (پہلے جیسا) ----------
      const res = await fetch(base + "/purchases/subscriptionsv2/tokens/" + encodeURIComponent(token), {
        headers: { Authorization: "Bearer " + accessToken }
      });
      if (!res.ok) return reply({ access: false, error: "google_" + res.status });
      const d = await res.json();
      const line = (d.lineItems || []).find((l) => allowed.includes(l.productId));
      if (!line) return reply({ access: false, error: "unknown_product" });

      let acknowledged = d.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED";
      if (!acknowledged) {
        try {
          const ackRes = await fetch(base + "/purchases/subscriptions/" + line.productId + "/tokens/" + encodeURIComponent(token) + ":acknowledge", {
            method: "POST",
            headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
            body: "{}"
          });
          acknowledged = ackRes.ok;
          if (ackRes.ok) {
            const pi = await subPriceInfo(base, accessToken, line.productId, token);
            notifySale(ctx, {
              pkg, sku: line.productId,
              country: pi.country || d.regionCode || "",
              price: pi.price, test: pi.test || !!d.testPurchase,
              trial: pi.trial || !!(line.offerDetails && /trial/i.test(line.offerDetails.offerId || ""))
            });
          }
        } catch (e) {
          acknowledged = false;
        }
      }

      const expiryMs = Date.parse(line.expiryTime);
      const access = ACCESS_STATES.includes(d.subscriptionState) && expiryMs > Date.now();
      const startMs = Date.parse(d.startTime || "");
      const autoRenew = !!(line.autoRenewingPlan && line.autoRenewingPlan.autoRenewEnabled);
      return reply({
        access,
        state: d.subscriptionState,
        productId: line.productId,
        acknowledged,
        expiry: new Date(expiryMs).toISOString().slice(0, 10),
        expiryTime: new Date(expiryMs).toISOString(),
        start: isNaN(startMs) ? "" : new Date(startMs).toISOString().slice(0, 10),
        autoRenew,
        trial: !!(line.offerDetails && /trial/i.test(line.offerDetails.offerId || ""))
      });
    } catch (e) {
      return reply({ access: false, error: "server_error" }, 500);
    }
  }
};
