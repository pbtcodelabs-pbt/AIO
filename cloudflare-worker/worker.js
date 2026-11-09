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

async function getAccessToken(env) {
  const sa = JSON.parse(env.SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
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
const AG_ABBR = { medicalStore: "MS", homeopathic: "HM", testingLab: "TL", plumberElectrician: "PE", tuitionTeacher: "TT", groceryStore: "GS", clothesShop: "CS", mobileElectronics: "ME", hardwareStore: "HW", bakery: "BK", jewelryShop: "JS", furnitureShop: "FS", autoParts: "AP", beautyParlor: "BP", restaurant: "RS", otherShop: "OS", doctor: "DR", emergencyNumbers: "EN", govOffices: "GO" };
function agCatTag(c) { let h = 0; for (let i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) >>> 0; return h.toString(36).slice(0, 7); }   /* ایپ کے pfCatTag جیسا */
const AG_TAG = Object.fromEntries(Object.keys(AG_ABBR).map((k) => [agCatTag(k), AG_ABBR[k]]));
function agAbbrOfRk(rk) { return AG_TAG[String(rk || "").split("_")[1] || ""] || "BZ"; }   /* نئی (ایڈمن کی بنائی) قسم = BZ */
function agNormRef(v) { const t = String(v || "").trim().toUpperCase().replace(/\s+/g, ""); const m = /^([A-Z]{2})[-.]?0*(\d{1,5})$/.exec(t); return m ? m[1] + "-" + m[2].padStart(3, "0") : String(v || "").trim(); }
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
    this.sql.exec("CREATE TABLE IF NOT EXISTS codev (phone TEXT PRIMARY KEY, name TEXT, pin TEXT, ts INTEGER, seen INTEGER)");   /* MCS0511TH136: کو-ڈویلپر (صرف جانچ موڈ — کچھ محفوظ / منظور نہیں) */
    if (!this.sql.exec("SELECT v FROM agcfg WHERE k = 'cdseed'").toArray().length) { this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('cdseed', '1')"); this.sql.exec("INSERT OR IGNORE INTO codev (phone, name, pin, ts, seen) VALUES ('923138469706', 'محمد عمران', ?, ?, 0)", String(100000 + Math.floor(Math.random() * 900000)), Date.now()); }   /* مالک نے دیا (4 نومبر) — PIN صرف ایڈمن پینل میں */
    try { this.sql.exec("ALTER TABLE prof ADD COLUMN paid INTEGER DEFAULT 0"); } catch (e) {}
    try { this.sql.exec("ALTER TABLE prof ADD COLUMN pend INTEGER DEFAULT 0"); } catch (e) {}   /* MCS0511TH157: دکاندار نے خود بنائی — ایڈمن کی منظوری پر 15 دن */
    /* MCS0511TH161 (مالک کا حکم، ہیلپ ڈیسک #95): ایپ کا لاگ اِن — اکاؤنٹ (موبائل ایک ہی بار)، چابیاں m:/e:/g:/a:، سیشن (ٹوکن کا SHA-256)، غلط پاس ورڈ کی حد */
    this.sql.exec("CREATE TABLE IF NOT EXISTS mcsuser (id TEXT PRIMARY KEY, data TEXT, pwh TEXT, ts INTEGER, seen INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS mcsukey (k TEXT PRIMARY KEY, id TEXT)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS mcssess (tok TEXT PRIMARY KEY, id TEXT, via TEXT, ts INTEGER, last INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS mcsfail (k TEXT PRIMARY KEY, n INTEGER, ts INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS mbuy (tok TEXT PRIMARY KEY, rec TEXT, sku TEXT, exp INTEGER, ts INTEGER)");   /* MCS0411WE147: پلے اسٹور کی ممبرشپ — ٹوکن ← ممبرشپ */
  }
  entGet(id) { const r = this.sql.exec("SELECT data FROM ent WHERE id = ?", id).toArray()[0]; return r ? JSON.parse(r.data) : null; }
  entPut(e) { e.ts = Date.now(); this.sql.exec("INSERT INTO ent (id, app, data, ts) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data, ts = excluded.ts", e.id, e.app, JSON.stringify(e), e.ts); (e.keys || []).forEach((k) => this.sql.exec("INSERT INTO entkey (k, id) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET id = excluded.id", e.app + "|" + k, e.id)); }
  entOut(e) { const now = Date.now(); return { ok: true, id: e.id, name: e.name || "", life: !!e.life, exp: e.exp || 0, active: !e.revoked && (!!e.life || (e.exp || 0) > now), revoked: !!e.revoked, devices: e.devices || 1, used: (e.claims || []).length, keys: e.keys || [] }; }
  agNextCode(ab) {   /* MCS0511TH142: ہر قسم کی الگ گنتی agcfg seq_XX */
    const r = this.sql.exec("SELECT v FROM agcfg WHERE k = ?", "seq_" + ab).toArray()[0]; let n = (parseInt((r || {}).v || "0", 10) || 0) + 1;
    const used = new Set(this.sql.exec("SELECT data FROM agent").toArray().map((x) => JSON.parse(x.data).code));
    while (used.has(ab + "-" + String(n).padStart(3, "0"))) n++;
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", "seq_" + ab, String(n));
    return ab + "-" + String(n).padStart(3, "0");
  }
  agCnicRow(cnic) { const c = String(cnic || "").replace(/\D/g, ""); return c.length === 13 ? this.sql.exec("SELECT code, id FROM agcnic WHERE cnic = ?", c).toArray()[0] || null : null; }
  agCnicOwner(cnic, exceptId) {   /* اسی شناختی کارڈ کا کوئی اور ایجنٹ (کسی بھی حالت میں) */
    const c = String(cnic || "").replace(/\D/g, ""); if (c.length !== 13) return null;
    for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const d = JSON.parse(r.data); if (d.id !== exceptId && String(d.cnic || "").replace(/\D/g, "") === c) return d; }
    return null;
  }
  agCodeFor(cnic, rk, id) {   /* شناختی کارڈ کا پرانا کوڈ واپس، ورنہ نیا (MS-001) اور ہمیشہ کے لیے محفوظ */
    const c = String(cnic || "").replace(/\D/g, ""), row = this.agCnicRow(c); if (row) return row.code;
    const code = this.agNextCode(agAbbrOfRk(rk));
    if (c.length === 13) this.sql.exec("INSERT OR IGNORE INTO agcnic (cnic, code, id, ts) VALUES (?, ?, ?, ?)", c, code, id || "", Date.now());
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
  finData(mon0) {
    const mon = String(mon0 || "").replace(/[^0-9_]/g, "").slice(0, 7);
    const sales = this.sql.exec("SELECT id, rec, ts, src, units, who FROM sale WHERE mon = ? ORDER BY ts", mon).toArray().map((x) => { let w = null; try { w = x.who ? JSON.parse(x.who) : null; } catch (e) {} delete x.who; return Object.assign(x, w || this.saleWho(x.rec)); });
    const g = this.sql.exec("SELECT v FROM agcfg WHERE k = ?", "gcut_" + mon).toArray()[0];
    const mons = this.sql.exec("SELECT mon, SUM(units) AS u FROM sale GROUP BY mon ORDER BY mon DESC LIMIT 24").toArray();
    return { ok: true, mon, sales, gcut: g ? parseInt(g.v, 10) : null, mons };
  }
  saleAdd(rec, src, units) {
    const t = new Date(Date.now() + 5 * 3600e3);
    this.sql.exec("INSERT INTO sale (rec, ts, src, units, mon, who) VALUES (?, ?, ?, ?, ?, ?)", rec, Date.now(), src, units, t.getUTCFullYear() + "_" + String(t.getUTCMonth() + 1).padStart(2, "0"), JSON.stringify(this.saleWho(rec)));
  }
  saleWho(rec) {   /* لانے والا: ایجنٹ (agref) / PBT-D ڈویلپر / PBT-C کو-ڈویلپر / PBT */
    const a = this.sql.exec("SELECT code, data FROM agref WHERE rk = ?", rec).toArray()[0];
    if (a) { let n = "", live = false; for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code === a.code) { n = x.name; live = x.status === "approved" && !x.off; break; } }
      if (!live) return { by: "pbt", code: "PBT", was: a.code, agent: n };   /* AGP0511TH011 (مالک کا حکم): ایجنٹ غیر فعال / ہٹایا گیا — آئندہ کمیشن کمپنی (PBT) کا */ let biz = ""; try { biz = JSON.parse(a.data || "{}").name || ""; } catch (e) {} return { by: "agent", code: a.code, agent: n, biz }; }
    const p = this.sql.exec("SELECT data FROM prof WHERE rec = ?", rec).toArray()[0]; let ref = "PBT"; try { ref = (JSON.parse((p && p.data) || "{}").ref || "PBT").toUpperCase(); } catch (e) {}
    return { by: ref === "PBT-D" ? "dev" : ref === "PBT-C" ? "codev" : "pbt", code: ref };
  }
  agMigrate3() {   /* MCS0511TH145: پہلے سے بنے ایجنٹوں کا شناختی کارڈ → کوڈ ایک بار محفوظ */
    if (this.sql.exec("SELECT v FROM agcfg WHERE k = 'agmig3'").toArray().length) return;
    for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const d = JSON.parse(r.data), c = String(d.cnic || "").replace(/\D/g, ""); if (c.length === 13 && d.code && !/^p\d/.test(d.code)) this.sql.exec("INSERT OR IGNORE INTO agcnic (cnic, code, id, ts) VALUES (?, ?, ?, ?)", c, d.code, d.id, Date.now()); }
    this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('agmig3', '1')");
  }
  async fetch(request) {
    const u = new URL(request.url);
    const op = u.pathname;
    /* MCS0911MO254 (مالک کا حکم): 📊 سرور کا استعمال — ہر DO درخواست روزانہ گنتی (`use`)؛ ایپ اپنی Firestore پڑھائی / لکھائی `/mcs_use` سے جمع کرتی ہے */
    const uday = new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);   /* پاکستانی دن */
    try { this.sql.exec("CREATE TABLE IF NOT EXISTS useday (day TEXT, k TEXT, n INTEGER, PRIMARY KEY (day, k))"); this.sql.exec("CREATE TABLE IF NOT EXISTS usedev (day TEXT, dev TEXT, PRIMARY KEY (day, dev))");
      this.sql.exec("INSERT INTO useday (day, k, n) VALUES (?, 'req', 1) ON CONFLICT (day, k) DO UPDATE SET n = n + 1", uday); } catch (e) {}
    if (op === "/mcs_use") {
      const b = await request.json();
      if (b.op === "add") {
        for (const k of ["r", "w", "d"]) { const n = Math.max(0, Math.min(200000, parseInt(b[k], 10) || 0)); if (n) this.sql.exec("INSERT INTO useday (day, k, n) VALUES (?, ?, ?) ON CONFLICT (day, k) DO UPDATE SET n = n + excluded.n", uday, "fs_" + k, n); }
        if (b.dev) this.sql.exec("INSERT OR IGNORE INTO usedev (day, dev) VALUES (?, ?)", uday, String(b.dev).slice(0, 64));
        return Response.json({ ok: true });
      }
      const from = new Date(Date.now() + 5 * 3600e3 - 40 * 864e5).toISOString().slice(0, 10);
      const days = {};
      for (const r of this.sql.exec("SELECT day, k, n FROM useday WHERE day >= ?", from).toArray()) (days[r.day] = days[r.day] || {})[r.k] = r.n;
      for (const r of this.sql.exec("SELECT day, COUNT(*) AS n FROM usedev WHERE day >= ? GROUP BY day", from).toArray()) (days[r.day] = days[r.day] || {}).dev = r.n;
      try { this.sql.exec("DELETE FROM useday WHERE day < ?", new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10)); this.sql.exec("DELETE FROM usedev WHERE day < ?", from); } catch (e) {}
      let db = 0; try { db = this.sql.databaseSize || 0; } catch (e) {}
      return Response.json({ ok: true, today: uday, days, dbBytes: db || 0 });
    }
    if (op === "/ent_claim") {   /* گاہک: اپنی چابی (جی میل / موبائل) سے اس فون پر کھولنا — فون کی حد تک */
      const b = await request.json();
      const row = this.sql.exec("SELECT id FROM entkey WHERE k = ?", b.app + "|" + b.key).toArray()[0];
      if (!row) return Response.json({ ok: false, reason: "none" });
      const e = this.entGet(row.id); if (!e) return Response.json({ ok: false, reason: "none" });
      if (e.revoked) return Response.json({ ok: false, reason: "revoked" });
      e.claims = e.claims || [];
      const mine = e.claims.find((c) => c.dev === b.dev);
      if (!mine) {
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
      { const o = this.agCnicOwner(b.d.cnic, old ? old.id : null); if (o) return Response.json({ ok: false, reason: "cnic_taken" }); }   /* MCS0511TH145: ایک شناختی کارڈ پر ایک ہی ایجنٹ */
      const pr = this.sql.exec("SELECT paid, until FROM prof WHERE rec = ?", b.d.bizRk).toArray()[0];
      if (!pr || !(pr.paid > 0)) return Response.json({ ok: false, reason: "not_paid" });   /* MCS0511TH134: ایجنٹ صرف وہی جس کی پروفائل خریدی ہو */
      const d = Object.assign({}, b.d, { id, at: prev ? prev.at : now, upd: now, status: prev && prev.status === "approved" ? "approved" : "pending", code: prev ? prev.code || "" : "", pin: prev ? prev.pin || "" : "", note: prev ? prev.note || "" : "" });
      this.sql.exec("INSERT INTO agent (id, phone, data, ts) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET phone = excluded.phone, data = excluded.data, ts = excluded.ts", id, d.phone, JSON.stringify(d), now);
      for (const k of ["front", "back", "selfie"]) if (b.img && b.img[k]) this.sql.exec("INSERT INTO agimg (id, kind, data) VALUES (?, ?, ?) ON CONFLICT (id, kind) DO UPDATE SET data = excluded.data", id, k, b.img[k]);
      return Response.json({ ok: true, id, status: d.status, code: d.code });
    }
    if (op === "/ag_status") {   /* درخواست دینے والا: اپنے نمبر + فون (dev) سے حالت؛ MCS0511TH139: یا نمبر + PIN (مالک کا بنایا ایجنٹ — یہ فون جڑ جاتا ہے) */
      const b = await request.json();
      const r = this.sql.exec("SELECT data FROM agent WHERE phone = ?", b.phone).toArray()[0];
      if (!r) return Response.json({ ok: false, reason: "none" });
      const d = JSON.parse(r.data);
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
      const refs = this.sql.exec("SELECT rk, data, ts FROM agref WHERE code = ? ORDER BY ts DESC", code).toArray().map((r) => { const p = this.sql.exec("SELECT since, until, paid FROM prof WHERE rec = ?", r.rk).toArray()[0] || {}; return Object.assign(JSON.parse(r.data), { rk: r.rk, at: r.ts, until: p.until || 0, paid: p.paid || 0 }); });
      /* AGP0511TH011: کمیشن کے سال اب فروخت کے کھاتے (sale.who) سے — غیر فعال ہونے کے بعد کی تجدید اس کی نہیں؛ کھاتے سے پہلے کے پرانے سال (legacy) ویسے */
      let years = 0;
      for (const r of refs) { const rows = this.sql.exec("SELECT units, who FROM sale WHERE rec = ?", r.rk).toArray(); let all = 0, mine = 0; for (const x of rows) { all += x.units || 0; try { const w = JSON.parse(x.who || "{}"); if (w.by === "agent" && w.code === code) mine += x.units || 0; } catch (e) {} } years += mine + Math.max(0, (r.paid || 0) - all); }
      const pays = this.sql.exec("SELECT id, amount, note, ts FROM agpay WHERE code = ? ORDER BY ts DESC", code).toArray();
      const paidOut = pays.reduce((a, x) => a + (x.amount || 0), 0);
      const proofs = this.sql.exec("SELECT id, rk, note, done, ts" + (b.admin ? ", img" : "") + " FROM agproof WHERE code = ? ORDER BY ts DESC LIMIT 100", code).toArray();
      const msgs = this.sql.exec("SELECT id, who, text, img, audio, ts FROM agmsg WHERE code = ? ORDER BY ts DESC LIMIT 200", code).toArray().reverse();
      return Response.json({ ok: true, agent: { name: d.name, phone: d.phone, code, biz: d.biz, city: d.city, okAt: d.okAt || 0, off: !!d.off }, rate, refs, years, due: years * rate, paidOut, balance: years * rate - paidOut, pays, proofs, msgs });
    }
    if (op === "/ua") {   /* MCS0511TH161: اکاؤنٹ — ورکر نے ان پٹ صاف / پاس ورڈ ہیش / گوگل تصدیق کر دی */
      const b = await request.json(), now = Date.now();
      const key = (k) => (this.sql.exec("SELECT id FROM mcsukey WHERE k = ?", k).toArray()[0] || {}).id || "";
      const get = (id) => { const r = this.sql.exec("SELECT data, pwh FROM mcsuser WHERE id = ?", id).toArray()[0]; if (!r) return null; const u = JSON.parse(r.data); u._pwh = r.pwh || ""; return u; };
      const out = (u) => ({ id: u.id, name: u.name, mobile: u.mobile, email: u.email || "", gmail: u.gmail || "", hasPw: !!u._pwh, ts: u.ts });
      const sess = async (id, via) => { const raw = crypto.getRandomValues(new Uint8Array(24)); const tok = Array.from(raw).map((x) => x.toString(16).padStart(2, "0")).join(""); this.sql.exec("INSERT INTO mcssess (tok, id, via, ts, last) VALUES (?, ?, ?, ?, ?)", await uaTokHash(tok), id, via, now, now); return tok; };
      const failK = "f:" + (b.fk || ""), failR = this.sql.exec("SELECT n, ts FROM mcsfail WHERE k = ?", failK).toArray()[0];
      const fails = failR && now - failR.ts < 15 * 60e3 ? failR.n : 0;
      const fail = () => { this.sql.exec("INSERT INTO mcsfail (k, n, ts) VALUES (?, 1, ?) ON CONFLICT (k) DO UPDATE SET n = CASE WHEN ? - mcsfail.ts < 900000 THEN mcsfail.n + 1 ELSE 1 END, ts = excluded.ts", failK, now, now); };
      const bySess = () => { if (!b.th) return null; const r = this.sql.exec("SELECT id, via, ts FROM mcssess WHERE tok = ?", b.th).toArray()[0]; if (!r) return null; const u = get(r.id); if (!u || u.del) return null; if (now - (r.last || 0) > 864e5) this.sql.exec("UPDATE mcssess SET last = ? WHERE tok = ?", now, b.th); return { u, via: r.via, at: r.ts }; };
      if (b.act === "signup") {
        if (key("m:" + b.mobile)) return Response.json({ ok: false, reason: "mobile_taken" });
        if (b.email && key("e:" + b.email)) return Response.json({ ok: false, reason: "email_taken" });
        if (b.gmail && (key("g:" + b.gmail) || key("e:" + b.gmail))) return Response.json({ ok: false, reason: "gmail_taken" });
        let n = parseInt((this.sql.exec("SELECT v FROM agcfg WHERE k = 'useq'").toArray()[0] || {}).v || "100000", 10) + 1 + Math.floor(Math.random() * 7);
        while (get("MCS-" + n)) n++;
        this.sql.exec("INSERT INTO agcfg (k, v) VALUES ('useq', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v", String(n));
        const u = { id: "MCS-" + n, name: b.name, mobile: b.mobile, email: b.email || b.gmail || "", gmail: b.gmail || "", ts: now, dev: b.dev || "" };
        this.sql.exec("INSERT INTO mcsuser (id, data, pwh, ts, seen) VALUES (?, ?, ?, ?, ?)", u.id, JSON.stringify(u), b.pwh || "", now, now);
        this.sql.exec("INSERT INTO mcsukey (k, id) VALUES (?, ?)", "m:" + u.mobile, u.id);
        this.sql.exec("INSERT INTO mcsukey (k, id) VALUES (?, ?)", "a:" + u.id, u.id);
        if (u.email) this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) VALUES (?, ?)", "e:" + u.email, u.id);
        if (u.gmail) this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) VALUES (?, ?)", "g:" + u.gmail, u.id);
        u._pwh = b.pwh || "";
        return Response.json({ ok: true, tok: await sess(u.id, u.gmail ? "g" : "p"), user: out(u) });
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
      if (b.act === "pwbad") { fail(); return Response.json({ ok: false, reason: fails + 1 >= 8 ? "wait" : "login" }); }
      if (b.act === "google") {
        const id = key("g:" + b.gmail) || key("e:" + b.gmail);
        const u = id && get(id);
        if (!u || u.del) return Response.json({ ok: false, reason: "new", gmail: b.gmail });
        if (!u.gmail) { u.gmail = b.gmail; this.sql.exec("UPDATE mcsuser SET data = ? WHERE id = ?", JSON.stringify(Object.assign({}, u, { _pwh: undefined })), u.id); this.sql.exec("INSERT OR IGNORE INTO mcsukey (k, id) VALUES (?, ?)", "g:" + b.gmail, u.id); }
        this.sql.exec("UPDATE mcsuser SET seen = ? WHERE id = ?", now, u.id);
        return Response.json({ ok: true, tok: await sess(u.id, "g"), user: out(u) });
      }
      const S = bySess();
      if (!S) return Response.json({ ok: false, reason: "session" });
      if (b.act === "me") return Response.json({ ok: true, user: out(S.u) });
      if (b.act === "logout") { this.sql.exec("DELETE FROM mcssess WHERE tok = ?", b.th); return Response.json({ ok: true }); }
      if (b.act === "setpw") {   /* پاس ورڈ بدلیں — پرانا ٹھیک ہو، یا گوگل سے 15 منٹ کے اندر لاگ اِن ہوا ہو (پاس ورڈ بھول گئے) */
        if (S.u._pwh && !(S.via === "g" && now - S.at < 15 * 60e3) && !b.oldOk) return Response.json({ ok: false, reason: "old", pwh: S.u._pwh });
        this.sql.exec("UPDATE mcsuser SET pwh = ? WHERE id = ?", b.pwh, S.u.id);
        this.sql.exec("DELETE FROM mcssess WHERE id = ? AND tok != ?", S.u.id, b.th);
        return Response.json({ ok: true });
      }
      if (b.act === "delete") {   /* پلے اسٹور کا اصول: اکاؤنٹ اور اس کی سب چابیاں / سیشن ختم */
        if (S.u._pwh && !(S.via === "g" && now - S.at < 15 * 60e3) && !b.oldOk) return Response.json({ ok: false, reason: "old", pwh: S.u._pwh });
        this.sql.exec("DELETE FROM mcsukey WHERE id = ?", S.u.id); this.sql.exec("DELETE FROM mcssess WHERE id = ?", S.u.id); this.sql.exec("DELETE FROM mcsuser WHERE id = ?", S.u.id);
        return Response.json({ ok: true });
      }
      return Response.json({ ok: false, reason: "bad_act" });
    }
    if (op === "/mc_chat") {   /* MCS0911MO251 (مالک کا حکم): 💬 My Chats — صارف ↔ PBT، ایجنٹ ↔ PBT، ایجنٹ ↔ اپنے کاروبار والے صارف۔
         عملہ (ڈویلپر / کو-ڈویلپر) کا ہر جواب who='dev' = «PBT Code Labs» — کس نے دیا (`by`) صرف اندر، کسی کو نظر نہیں۔ ایجنٹ ↔ ایجنٹ کوئی راستہ نہیں۔
         دھاگے (agmsg.code): U-<صارف ID> · <ایجنٹ کوڈ> (پرانا پورٹل والا) · B-<ایجنٹ کوڈ>~<صارف ID>؛ CD-… (کو-ڈویلپر ↔ ڈویلپر) یہاں نہیں */
      const b = await request.json(), now = Date.now();
      try { this.sql.exec("ALTER TABLE agmsg ADD COLUMN byw TEXT"); } catch (e) {}
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
      else if (b.as === "cd") { const r = this.sql.exec("SELECT name, pin FROM codev WHERE phone = ?", b.phone).toArray()[0]; if (r && b.pin && r.pin === b.pin) me = { staff: true, by: "C:" + b.phone }; }
      else if (b.as === "agent") { const a = agents().find((x) => x.phone === b.phone && x.pin && x.pin === b.pin); if (a) me = { agent: a.code, name: a.name }; }
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
        if (me.uid) { if (th === "U-" + me.uid) return { r: 1, w: 1, side: "user" }; const m = /^B-(.+)~(.+)$/.exec(th); if (m && m[2] === me.uid && linked(m[1], me.uid)) return { r: 1, w: 1, side: "user" }; return null; }
        return null;
      };
      const rdKey = (th) => me.staff && !(th.startsWith("CD-") && me.by !== "D") ? "rd_" + th : "ru_" + (me.agent || me.uid || me.by) + "_" + th;
      const sumOf = (th, side) => {
        const lm = this.sql.exec("SELECT who, text, img, audio, ts FROM agmsg WHERE code = ? ORDER BY ts DESC, id DESC LIMIT 1", th).toArray()[0] || null;
        const rd = parseInt(cfg(rdKey(th)) || "0", 10);
        const nw = this.sql.exec("SELECT COUNT(*) AS n FROM agmsg WHERE code = ? AND who != ? AND ts > ?", th, side, rd).toArray()[0].n;
        return { last: lm ? lm.ts : 0, lt: lm ? String(lm.text || (lm.img ? "🖼️" : lm.audio ? "🎤" : "")).slice(0, 80) : "", mine: lm ? lm.who === side : false, nw };
      };
      const cdName = (ph) => (this.sql.exec("SELECT name FROM codev WHERE phone = ?", ph).toArray()[0] || {}).name || "";
      const label = (th) => {   /* عملے کے لیے دھاگے کا نام */
        if (th.startsWith("CD-")) return me.by === "D" ? { k: "cd", title: "👥 " + (cdName(th.slice(3)) || "کو-ڈویلپر"), sub: "کو-ڈویلپر · 0" + d10(th.slice(3)) } : { k: "cd", title: "👨‍💻 ڈویلپر", sub: "صرف آپ اور ڈویلپر" };
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
        } else {
          L.push(Object.assign({ th: "U-" + me.uid, k: "pbt", title: PBT, sub: "سوال، مسئلہ، مشورہ" }, sumOf("U-" + me.uid, "user")));
          const ph = d10(me.u.mobile), done = new Set();
          if (ph) for (const r of this.sql.exec("SELECT code FROM agref WHERE rk LIKE ?", "p" + ph + "%").toArray()) { if (done.has(r.code)) continue; done.add(r.code); const a = agents().find((x) => x.code === r.code); if (!a) continue; const th = "B-" + a.code + "~" + me.uid; L.push(Object.assign({ th, k: "agent", title: "🤝 " + a.name, sub: "آپ کا MCS ایجنٹ" }, sumOf(th, "user"))); }
        }
        L.sort((x, y) => (x.k === "pbt" || x.pin ? -1 : 0) - (y.k === "pbt" || y.pin ? -1 : 0) || (y.last || 0) - (x.last || 0));
        for (const x of L) { const th = x.th || "";
          if (me.uid) x.av = "";
          else if (me.agent) x.av = x.k === "pbt" ? "D" : "";
          else if (th.startsWith("CD-")) x.av = me.by === "D" ? "C:" + th.slice(3) : "D";
          else if (th.startsWith("B-")) { const m = /^B-(.+)~/.exec(th); x.av = m ? "A:" + m[1] : ""; }
          else if (!th.startsWith("U-")) x.av = "A:" + th;
          else x.av = ""; }
        return Response.json({ ok: true, staff: !!me.staff, list: L, nw: L.reduce((n, x) => n + (x.nw || 0), 0), avs: avOut(L.map((x) => x.av)) });
      }
      const A = acc(b.thr); if (!A) return Response.json({ ok: false, reason: "no_access" });
      if (b.op === "send") {
        if (!A.w) return Response.json({ ok: false, reason: "read_only" });
        if (!(b.text || b.img || b.audio)) return Response.json({ ok: false, reason: "empty" });
        this.sql.exec("INSERT INTO agmsg (code, who, text, img, audio, ts, byw) VALUES (?, ?, ?, ?, ?, ?, ?)", b.thr, A.side, String(b.text || "").slice(0, 2000), String(b.img || ""), String(b.audio || ""), now, me.by || me.agent || me.uid || "");
      }
      setCfg(rdKey(b.thr), now);
      const rows = this.sql.exec("SELECT id, who, text, img, audio, ts, byw FROM agmsg WHERE code = ? ORDER BY ts DESC, id DESC LIMIT 200", b.thr).toArray().reverse();
      const th0 = String(b.thr);
      const avOf = (m) => {
        if (me.uid) return "";   /* عام صارف: کسی کی تصویر نہیں */
        if (th0.startsWith("CD-")) return m.who === "dev" ? "D" : "C:" + th0.slice(3);
        if (m.who === "agent") { if (th0.startsWith("B-")) { const x = /^B-(.+)~/.exec(th0); return x ? "A:" + x[1] : ""; } return "A:" + th0; }
        if (m.who === "dev") return me.agent ? "D" : (m.byw && /^(D|C:\d+)$/.test(m.byw) ? m.byw : "D");
        return ""; };
      const nameOf = (who) => A.cd ? (who === "dev" ? "👨‍💻 ڈویلپر" : "👥 " + (cdName(String(b.thr).slice(3)) || "کو-ڈویلپر")) : who === "dev" ? PBT : who === "agent" ? "🤝 MCS ایجنٹ" : "صارف";
      const out = rows.map((m) => ({ id: m.id, mine: m.who === A.side, who: m.who, name: nameOf(m.who), av: avOf(m), text: m.text || "", img: m.img || "", audio: m.audio || "", ts: m.ts }));
      return Response.json({ ok: true, w: A.w, cd: !!A.cd, title: me.staff ? label(b.thr).title : null, msgs: out, avs: avOut(out.map((m) => m.mine ? "" : m.av)) });
    }
    if (op === "/cd_login") {   /* کو-ڈویلپر: موبائل + PIN → نام (صرف جانچ موڈ کھلتا ہے) */
      const b = await request.json();
      const r = this.sql.exec("SELECT name, pin, seen FROM codev WHERE phone = ?", b.phone).toArray()[0];
      if (!r || !b.pin || r.pin !== b.pin) return Response.json({ ok: false, reason: "login" });
      const day = Math.floor(Date.now() / 864e5); if (r.seen !== day) this.sql.exec("UPDATE codev SET seen = ? WHERE phone = ?", day, b.phone);
      return Response.json({ ok: true, name: r.name });
    }
    if (op === "/cd_chat") {   /* AGP0511TH006 (مالک کا حکم): کو-ڈویلپر ↔ ڈویلپر چیٹ — صرف اپنا دھاگہ (code = CD-<نمبر>) */
      const b = await request.json();
      const r = this.sql.exec("SELECT name, pin FROM codev WHERE phone = ?", b.phone).toArray()[0];
      if (!r || !b.pin || r.pin !== b.pin) return Response.json({ ok: false, reason: "login" });
      const code = "CD-" + b.phone;
      if (b.act === "msg") this.sql.exec("INSERT INTO agmsg (code, who, text, img, audio, ts) VALUES (?, 'agent', ?, ?, ?, ?)", code, String(b.text || "").slice(0, 2000), String(b.img || ""), String(b.audio || ""), Date.now());
      return Response.json({ ok: true, name: r.name, msgs: this.sql.exec("SELECT id, who, text, img, audio, ts FROM agmsg WHERE code = ? ORDER BY ts DESC LIMIT 200", code).toArray().reverse() });
    }
    if (op === "/cd_fin") {   /* AGP0511TH005 (مالک کا حکم): کو-ڈویلپر — کمپنی کا حساب صرف دیکھنا (کچھ بدل نہیں سکتا) */
      const b = await request.json();
      const r = this.sql.exec("SELECT name, pin FROM codev WHERE phone = ?", b.phone).toArray()[0];
      if (!r || !b.pin || r.pin !== b.pin) return Response.json({ ok: false, reason: "login" });
      return Response.json(Object.assign(this.finData(b.mon), { name: r.name }));
    }
    if (op === "/cd_admin") {   /* مالک (MCS ایڈمن): فہرست / شامل (نیا PIN) / ہٹائیں */
      const b = await request.json();
      if (b.op === "add") { const pin = String(100000 + Math.floor(Math.random() * 900000)); this.sql.exec("INSERT INTO codev (phone, name, pin, ts, seen) VALUES (?, ?, ?, ?, 0) ON CONFLICT (phone) DO UPDATE SET name = excluded.name, pin = excluded.pin, ts = excluded.ts", b.phone, b.name, pin, Date.now()); }
      if (b.op === "del") this.sql.exec("DELETE FROM codev WHERE phone = ?", b.phone);
      return Response.json({ ok: true, list: this.sql.exec("SELECT phone, name, pin, ts, seen FROM codev ORDER BY ts DESC").toArray() });
    }
    if (!this._agMig) { this._agMig = 1; try { this.agMigrate(); } catch (e) {} try { this.agMigrate3(); } catch (e) {} }
    if (op === "/ag_find") {   /* MCS0511TH142: کوڈ / پرانا کوڈ / موبائل → ایجنٹ کا اصل کوڈ اور نام (لکھنا کچھ نہیں) */
      const b = await request.json(); const ag = this.agResolve(b.code, b.phone);
      return Response.json(ag ? { ok: true, code: ag.code, name: ag.name } : { ok: false, reason: "bad_code" });
    }
    if (op === "/ag_propose") {   /* MCS0511TH139: کو-ڈویلپر ایجنٹ تجویز کرے → ⏳ نئی درخواست، منظوری صرف مالک */
      const b = await request.json(); const c = b.c || {};
      const cd = this.sql.exec("SELECT name, pin FROM codev WHERE phone = ?", b.cphone).toArray()[0];
      if (!cd || !b.cpin || cd.pin !== b.cpin) return Response.json({ ok: false, reason: "login" });
      if (this.sql.exec("SELECT id FROM agent WHERE phone = ?", c.phone).toArray().length) return Response.json({ ok: false, reason: "exists" });
      for (const r of this.sql.exec("SELECT data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code === c.code || x.bizRk === c.code) return Response.json({ ok: false, reason: "code_taken" }); }
      { const o = this.agCnicOwner(c.cnic); if (o) return Response.json({ ok: false, reason: "cnic_taken", other: o.name }); }
      const now = Date.now(), id = "A" + now.toString(36) + Math.random().toString(36).slice(2, 5);
      const d = { id, name: c.name, phone: c.phone, city: c.city, biz: c.biz || "", bizRk: c.code, code: "", pin: "", status: "pending", at: now, upd: now, byCodev: cd.name, dev: "", cnic: c.cnic || "", father: "", address: "", wa: "", email: "", exp: "👥 کو-ڈویلپر " + cd.name + " نے تجویز کیا", note: "" };
      this.sql.exec("INSERT INTO agent (id, phone, data, ts) VALUES (?, ?, ?, ?)", id, c.phone, JSON.stringify(d), now);
      return Response.json({ ok: true });
    }
    if (op === "/ag_docs") {   /* MCS0511TH139: ایجنٹ خود (نمبر + PIN + اسی فون) شناختی کارڈ نمبر اور تین تصویریں لگائے */
      const b = await request.json();
      const r = this.sql.exec("SELECT data FROM agent WHERE phone = ?", b.phone).toArray()[0]; if (!r) return Response.json({ ok: false, reason: "login" });
      const d = JSON.parse(r.data); if (!d.pin || d.pin !== b.pin || d.dev !== b.dev) return Response.json({ ok: false, reason: "login" });
      { const o = this.agCnicOwner(b.cnic, d.id), row = this.agCnicRow(b.cnic); if (o || (row && row.code !== d.code)) return Response.json({ ok: false, reason: "cnic_taken" }); }
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
        for (const r of this.sql.exec("SELECT data FROM agent").toArray()) if (JSON.parse(r.data).bizRk === c.code) return Response.json({ ok: false, reason: "code_taken" });
        { const o = this.agCnicOwner(c.cnic); if (o) return Response.json({ ok: false, reason: "cnic_taken", other: o.name + (o.code ? " (" + o.code + ")" : "") }); }
        const now = Date.now(), id = "A" + now.toString(36) + Math.random().toString(36).slice(2, 5);
        const d = { id, name: c.name, phone: c.phone, city: c.city, biz: c.biz || "", bizRk: c.code, code: this.agCodeFor(c.cnic, c.code, id), pin: String(100000 + Math.floor(Math.random() * 900000)), status: "approved", okAt: now, at: now, upd: now, byOwner: 1, dev: "", cnic: c.cnic || "", father: "", address: "", wa: "", email: "", exp: "", note: "" };
        this.sql.exec("INSERT INTO agent (id, phone, data, ts) VALUES (?, ?, ?, ?)", id, c.phone, JSON.stringify(d), now);
        return Response.json({ ok: true, agent: d });
      }
      if (b.op === "agpin") {   /* AGP0511TH012: ڈویلپر — ایجنٹ کا PIN دیکھیں یا نیا بنائیں (ایجنٹ بھول جائے) */
        for (const r of this.sql.exec("SELECT id, data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code && x.code === b.code) { if (b.note === "new" || !x.pin) { x.pin = String(100000 + Math.floor(Math.random() * 900000)); this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(x), r.id); } return Response.json({ ok: true, pin: x.pin, phone: x.phone, name: x.name }); } }
        return Response.json({ ok: false, reason: "none" });
      }
      if (b.op === "deact" || b.op === "react") {   /* AGP0511TH011: ایجنٹ غیر فعال / دوبارہ فعال (کوڈ اور پرانا حساب ویسا) */
        for (const r of this.sql.exec("SELECT id, data FROM agent").toArray()) { const x = JSON.parse(r.data); if (x.code && x.code === b.code) { x.off = b.op === "deact"; x.offAt = x.off ? Date.now() : 0; this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(x), r.id); return Response.json({ ok: true, off: x.off }); } }
        return Response.json({ ok: false, reason: "none" });
      }
      if (b.op === "proofdone") { this.sql.exec("UPDATE agproof SET done = 1 WHERE id = ?", parseInt(b.pid, 10) || 0); return Response.json({ ok: true }); }
      const r = this.sql.exec("SELECT data FROM agent WHERE id = ?", b.id).toArray()[0]; if (!r) return Response.json({ ok: false, reason: "none" });
      const d = JSON.parse(r.data);
      if (b.op === "imgs") return Response.json({ ok: true, img: Object.fromEntries(this.sql.exec("SELECT kind, data FROM agimg WHERE id = ?", b.id).toArray().map((x) => [x.kind, x.data])) });
      if (b.op === "delete") { this.sql.exec("DELETE FROM agent WHERE id = ?", b.id); this.sql.exec("DELETE FROM agimg WHERE id = ?", b.id); return Response.json({ ok: true }); }
      if (b.op === "approve") {
        { const o = this.agCnicOwner(d.cnic, d.id); if (o && o.status === "approved") return Response.json({ ok: false, reason: "cnic_taken", other: o.name + " (" + o.code + ")" }); }
        if (!d.code || /^p\d/.test(d.code)) d.code = this.agCodeFor(d.cnic, d.bizRk, d.id);   /* MCS0511TH145: شناختی کارڈ کا پرانا کوڈ، ورنہ نیا MS-001 */
        if (!d.pin) d.pin = String(100000 + Math.floor(Math.random() * 900000));
        d.status = "approved"; d.okAt = Date.now();
      } else if (b.op === "reject") { d.status = "rejected"; d.note = String(b.note || "").slice(0, 300); }
      else if (b.op === "pending") d.status = "pending";
      else return Response.json({ ok: false, reason: "bad_op" }, { status: 400 });
      this.sql.exec("UPDATE agent SET data = ? WHERE id = ?", JSON.stringify(d), b.id);
      return Response.json({ ok: true, agent: d });
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
      if (b.op === "list") return Response.json({ ok: true, list: this.sql.exec("SELECT data FROM ent WHERE app = ? ORDER BY ts DESC LIMIT 1000", b.app).toArray().map((r) => { const e = JSON.parse(r.data); return Object.assign(this.entOut(e), { note: e.note || "", at: e.at || 0, claims: e.claims || [], pin: e.pin || "" }); }) });
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
    if (op === "/plist") return Response.json(Object.fromEntries(this.sql.exec("SELECT rec, since, until, ts, pend FROM prof").toArray().map((r) => [r.rec, Object.assign({ since: r.since, until: r.until, ts: r.ts }, r.pend ? { pend: 1 } : {})])));
    if (op === "/pget") {
      const { rec } = await request.json();
      const r = this.sql.exec("SELECT data, since, until, ts, pend FROM prof WHERE rec = ?", rec).toArray()[0];
      if (!r) return Response.json({ none: true });
      const imgs = this.sql.exec("SELECT id, ts FROM pimg WHERE rec = ? ORDER BY id", rec).toArray();
      let data = {}; try { data = JSON.parse(r.data || "{}"); } catch (e) {}
      return Response.json({ rec, data, since: r.since, until: r.until, ts: r.ts, imgs, pend: r.pend ? 1 : 0 });
    }
    if (op === "/pimg") { const { id } = await request.json(); const r = this.sql.exec("SELECT data FROM pimg WHERE id = ?", id).toArray()[0]; return Response.json({ data: r ? r.data : "" }); }
    if (op === "/pbuy") {   /* MCS0411WE147: گوگل سے تصدیق شدہ خریداری → اسی ممبرشپ کی مدت؛ ٹوکن ایک بار جس ممبرشپ سے جڑا، ہمیشہ اسی کا */
      const b = await request.json();
      const row = this.sql.exec("SELECT rec, exp FROM mbuy WHERE tok = ?", b.tok).toArray()[0];
      const rec = row ? row.rec : b.rec;
      if (!rec) return Response.json({ ok: false, error: "no_rec" });
      const o = this.sql.exec("SELECT until, paid FROM prof WHERE rec = ?", rec).toArray()[0];
      if (!o) return Response.json({ ok: false, error: "no_prof" });
      const now = Date.now(), prevExp = row ? (row.exp || 0) : 0;
      if (!row) this.sql.exec("INSERT INTO mbuy (tok, rec, sku, exp, ts) VALUES (?, ?, ?, ?, ?)", b.tok, rec, b.sku, b.exp, now);
      let until = o.until || 0;
      if (b.exp > prevExp) {
        const yrs = Math.max(row ? 0 : 1, Math.round((b.exp - Math.max(prevExp, now)) / (365 * 864e5)));
        /* پہلی بار: باقی دن ضائع نہیں — پرانی مدت (یا آج) سے آگے خریدی مدت؛ تجدید پر گوگل کی نئی تاریخ جتنا فرق */
        until = row ? until + (b.exp - prevExp) : Math.max(until, now) + (b.exp - now);
        this.sql.exec("UPDATE prof SET until = ?, paid = COALESCE(paid, 0) + ? WHERE rec = ?", until, b.access ? yrs : 0, rec);
        if (b.access && yrs > 0) this.saleAdd(rec, "play", yrs);
        if (row) this.sql.exec("UPDATE mbuy SET exp = ?, ts = ? WHERE tok = ?", b.exp, now, b.tok);
      }
      return Response.json({ ok: true, rec, until, sku: row ? row.sku : b.sku });
    }
    if (op === "/pclaim") {
      const b = await request.json(); const now = Date.now();
      const r = this.sql.exec("SELECT key, since, until FROM prof WHERE rec = ?", b.rec).toArray()[0];
      if (r && r.key && !b.admin) return Response.json({ error: "taken" }, { status: 409 });
      const key = [...crypto.getRandomValues(new Uint8Array(18))].map((x) => "abcdefghjkmnpqrstuvwxyz23456789"[x % 31]).join("");
      if (r) this.sql.exec("UPDATE prof SET key = ? WHERE rec = ?", key, b.rec);
      else {
        /* MCS0411WE133 (مالک کا حکم): 15 دن مفت صرف اس نمبر کی پہلی پروفائل پر (rec = نمبر_قسم)؛ اگلی پروفائل بند حالت میں — ایک سال جاری کرنے پر چالو */
        const pfx = String(b.rec).split("_")[0], first = !this.sql.exec("SELECT rec FROM prof WHERE substr(rec, 1, ?) = ? AND rec != ? LIMIT 1", pfx.length + 1, pfx + "_", b.rec).toArray().length;
        /* MCS0511TH157 (مالک کا حکم): دکاندار خود بنائے تو 15 دن ابھی نہیں — ایڈمن کی منظوری (padmin approve) پر شروع؛ ایڈمن خود بنائے تو فوراً */
        const pend = first && !b.admin ? 1 : 0;
        this.sql.exec("INSERT INTO prof (rec, data, key, since, until, ts, pend) VALUES (?, '{}', ?, ?, ?, ?, ?)", b.rec, key, now, b.admin ? now + 15 * 864e5 : now, now, pend);
      }
      const x = this.sql.exec("SELECT since, until, pend FROM prof WHERE rec = ?", b.rec).toArray()[0];
      return Response.json({ key, since: x.since, until: x.until, pend: x.pend ? 1 : 0 });
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
      else if (b.act === "approve") { const now = Date.now(); this.sql.exec("UPDATE prof SET since = ?, until = MAX(COALESCE(until, 0), ?), pend = 0 WHERE rec = ?", now, now + 15 * 864e5, b.rec); }   /* MCS0511TH157: منظوری = 15 دن مفت شروع */
      else if (b.act === "reject") this.sql.exec("UPDATE prof SET pend = 0 WHERE rec = ?", b.rec);
      else if (b.act === "free") this.sql.exec("UPDATE prof SET key = '' WHERE rec = ?", b.rec);
      else if (b.act === "del") { this.sql.exec("DELETE FROM prof WHERE rec = ?", b.rec); this.sql.exec("DELETE FROM pimg WHERE rec = ?", b.rec); }
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
async function verifyFirebaseAdmin(request) {
  try {
    const h = request.headers.get("Authorization") || ""; const jwt = h.replace(/^Bearer\s+/i, ""); const parts = jwt.split(".");
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
/* =====================================================================
   🔑 اکاؤنٹ سبسکرپشن — جی میل (گوگل سائن اِن، ٹوکن یہاں جانچا جاتا ہے) یا موبائل نمبر؛ فون کی حد؛ صرف ڈویلپر دے سکتا ہے
   /entclaim {app, kind:'g'|'p', idToken | phone, dev}  — نیا فون جوڑتا ہے (حد تک)
   /entstatus {app, key, dev} — پہلے سے جڑا فون (تجدید / بند ہونے کی خبر)
   /entadmin  (Authorization: MCS ایڈمن کا فائربیس ٹوکن) {op:'grant'|'list'|'revoke'|'unrevoke'|'reset'|'delete', ...}
   ===================================================================== */
const ENT_APPS = ["AIO"];
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
  const pwOk = (p) => p.length >= 6 && p.length <= 64;
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
    if (gmail && pw && !pwOk(pw)) return reply({ ok: false, reason: "pw" });
    r = await call({ act: "signup", name, mobile, email: email || "", gmail, pwh: pw ? await uaHash(pw) : "", dev });
  } else if (op === "login") {
    const id = S(b.id, 80).toLowerCase(), ids = [];
    if (/^mcs-?\d{6,}$/.test(id)) ids.push("a:" + id.replace(/^mcs-?/, "MCS-").toUpperCase());
    if (entPhone(id)) ids.push("m:" + entPhone(id));
    if (entEmail(id)) ids.push("e:" + entEmail(id), "g:" + entEmail(id));
    if (!ids.length || !pw) return reply({ ok: false, reason: "login" });
    const fk = ip + "|" + ids[0];
    r = await call({ act: "find", ids, fk });
    if (r.ok) r = (await uaCheck(pw, r.pwh)) ? await call({ act: "pwok", id: r.id, fk }) : await call({ act: "pwbad", fk });
  } else if (op === "google") {
    const gmail = await verifyGoogleIdToken(b.gtoken); if (!gmail) return reply({ ok: false, reason: "google" });
    r = await call({ act: "google", gmail });
  } else if (["me", "logout"].includes(op)) {
    r = await call({ act: op, th });
  } else if (op === "setpw" || op === "delete") {
    if (op === "setpw" && !pwOk(pw)) return reply({ ok: false, reason: "pw" });
    const body = { act: op, th, pwh: op === "setpw" ? await uaHash(pw) : "" };
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
    if (!S(b.bizRk, 60)) return reply({ ok: false, reason: "not_paid" });
    const d = { name: S(b.name, 80), father: S(b.father, 80), cnic: cnic.replace(/^(\d{5})(\d{7})(\d)$/, "$1-$2-$3"), phone, wa: entPhone(b.wa) || "", email: S(b.email, 80), city: S(b.city, 60), address: S(b.address, 200), biz: S(b.biz, 120), bizRk: S(b.bizRk, 60), exp: S(b.exp, 400), dev };
    if (!d.name || !d.city) return reply({ ok: false, reason: "missing" });   /* MCS0511TH139: والد کا نام / پتہ اختیاری (آسان فارم) */
    return fwd("/ag_apply", { d, img });
  }
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
  if (path === "/cdfin") { const phone = entPhone(b.phone); if (!phone || !b.pin) return reply({ ok: false, reason: "login" }); return fwd("/cd_fin", { phone, pin: S(b.pin, 10), mon: S(b.mon, 7) }); }
  if (path === "/codev") { const phone = entPhone(b.phone); if (!phone || !b.pin) return reply({ ok: false, reason: "login" }); return fwd("/cd_login", { phone, pin: S(b.pin, 10) }); }
  if (path === "/codevadmin") {
    if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403);
    const op = String(b.op || "list"); if (!["list", "add", "del"].includes(op)) return reply({ error: "bad_op" }, 400);
    const phone = op === "list" ? "" : entPhone(b.phone); if (op !== "list" && !phone) return reply({ ok: false, reason: "bad_phone" });
    if (op === "add" && !S(b.name, 60)) return reply({ ok: false, reason: "missing" });
    return fwd("/cd_admin", { op, phone, name: S(b.name, 60) });
  }
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
  if (path === "/mcsuse") {   /* MCS0911MO254: 📊 استعمال — ایپ گنتی بھیجے (add)؛ پڑھنا صرف ایڈمن */
    if (b.op === "add") return fwd("/mcs_use", { op: "add", r: b.r, w: b.w, d: b.d, dev });
    if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403);
    return fwd("/mcs_use", { op: "get" });
  }
  if (path === "/mcschat") {   /* MCS0911MO251: 💬 My Chats */
    const as = String(b.as || ""); if (!["user", "agent", "cd", "dev"].includes(as)) return reply({ ok: false, reason: "login" });
    const op = String(b.op || ""); if (!["list", "thread", "send", "av"].includes(op)) return reply({ error: "bad_op" }, 400);
    const admin = as === "dev" ? await verifyFirebaseAdmin(request) : false; if (as === "dev" && !admin) return reply({ ok: false, reason: "login" });
    const media = (v, n) => { v = String(v || ""); return /^data:(image|audio)\/[a-z0-9.+-]+(;codecs=[a-z0-9.]+)?;base64,/.test(v) && v.length <= n ? v : ""; };
    return fwd("/mc_chat", { as, op, admin: !!admin, phone: entPhone(b.phone) || "", pin: S(b.pin, 10), th: as === "user" && b.tok ? await uaTokHash(String(b.tok).slice(0, 80)) : "", thr: S(b.thr, 120), text: S(b.text, 2000), img: media(b.img, op === "av" ? 80000 : 700000), audio: media(b.audio, 900000) });
  }
  if (path === "/agadmin") {
    if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403);
    const op = String(b.op || ""); if (!["list", "imgs", "approve", "reject", "pending", "delete", "rate", "pay", "unpay", "proofdone", "create", "fin", "gcut", "inbox", "thread", "deact", "react", "agpin"].includes(op)) return reply({ error: "bad_op" }, 400);
    let c;
    if (op === "create") { const cc = b.c || {}, cn = String(cc.cnic || "").replace(/\D/g, ""); c = { name: S(cc.name, 80), phone: entPhone(cc.phone), code: S(cc.code, 60), city: S(cc.city, 60), biz: S(cc.biz, 120), cnic: cn.length === 13 ? cn.replace(/^(\d{5})(\d{7})(\d)$/, "$1-$2-$3") : "" }; if (!c.name || !c.phone || !c.code) return reply({ ok: false, reason: "missing" }); if (!c.cnic) return reply({ ok: false, reason: "bad_cnic" }); }
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
    if (!/^[gp]:/.test(key)) return reply({ error: "bad_key" }, 400);
    const pin = b.kind === "p" ? String(b.pin || "").replace(/[^0-9]/g, "").slice(0, 8) : "";
    const r = await fwd("/ent_claim", { app, key, dev, bind: path === "/entclaim", pin });
    const out = await r.json(); out.key = key;
    return reply(out);
  }
  if (path === "/entadmin") {
    if (!(await verifyFirebaseAdmin(request))) return reply({ error: "admin_only" }, 403);
    const op = String(b.op || "");
    if (op === "grant") {
      const keys = [].concat((b.emails || []).map(entEmail).filter(Boolean).map((e) => "g:" + e), (b.phones || []).map(entPhone).filter(Boolean).map((p) => "p:" + p));
      if (!keys.length && !b.id) return reply({ ok: false, reason: "no_keys" });
      const days = Math.max(0, Math.min(3650, parseInt(b.days, 10) || 0)), devices = Math.max(1, Math.min(20, parseInt(b.devices, 10) || 1));
      if (!days && !b.life && !b.id) return reply({ ok: false, reason: "no_days" });
      return fwd("/ent_admin", { op, app, id: String(b.id || "").slice(0, 40), keys, days, life: !!b.life, devices, name: String(b.name || "").slice(0, 80), note: b.note === undefined ? undefined : String(b.note).slice(0, 300), setExp: parseInt(b.setExp, 10) || 0, bindDev: String(b.uid || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64).replace(/^(.{0,5})$/, "") });
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

/* ===== MCS پروفائل کے راستے ===== */
function profClean(d) {
  const S = (v, n) => String(v == null ? "" : v).slice(0, n);
  d = d && typeof d === "object" ? d : {};
  const out = { about: S(d.about, 1500), hours: S(d.hours, 120), off: S(d.off, 60), addr: S(d.addr, 200) };
  out.items = (Array.isArray(d.items) ? d.items : []).slice(0, 20).map((x) => ({ n: S(x && x.n, 60), p: S(x && x.p, 24) })).filter((x) => x.n);
  out.phones = (Array.isArray(d.phones) ? d.phones : []).slice(0, 3).map((x) => S(x, 20).replace(/[^0-9+\- ]/g, "")).filter(Boolean);
  out.links = (Array.isArray(d.links) ? d.links : []).slice(0, 3).map((x) => S(x, 200)).filter((x) => /^https?:\/\//i.test(x));
  out.ref = S(d.ref, 40).replace(/[^A-Za-z0-9_\-]/g, "") || "PBT";   /* MCS0511TH157: ایجنٹ کا ریفرل کوڈ، نہ ہو تو PBT (ہمارا اپنا گاہک) */
  if (d.map && isFinite(+d.map.lat) && isFinite(+d.map.lon)) out.map = { lat: +(+d.map.lat).toFixed(6), lon: +(+d.map.lon).toFixed(6) };
  return out;
}
/* MCS0411WE147: My City Shines کی پلے اسٹور ممبرشپ — ایپ ٹوکن + sku (+ نئی خریداری پر rec) بھیجتی ہے؛ گوگل سے تصدیق، acknowledge، پھر ممبرشپ کی مدت */
async function handleMcsBuy(request, env, ctx) {
  if (!env.MCS_STATS) return reply({ error: "not_ready" }, 503);
  let b = {}; try { b = JSON.parse(await request.text()); } catch (e) { return reply({ error: "bad_json" }, 400); }
  const token = b.purchaseToken;
  if (typeof token !== "string" || token.length < 10 || token.length > 1000) return reply({ ok: false, error: "bad_token" }, 400);
  const rec = String(b.rec || "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40);
  if (rec && !/^p\d{10}(_[a-z0-9]{2,12})?$/.test(rec)) return reply({ ok: false, error: "bad_rec" }, 400);
  try {
    const accessToken = await getAccessToken(env);
    const base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" + MCS_PKG;
    const res = await fetch(base + "/purchases/subscriptionsv2/tokens/" + encodeURIComponent(token), { headers: { Authorization: "Bearer " + accessToken } });
    if (!res.ok) return reply({ ok: false, error: "google_" + res.status });
    const d = await res.json();
    const line = (d.lineItems || []).find((l) => MCS_SKUS.includes(l.productId));
    if (!line) return reply({ ok: false, error: "unknown_product" });
    if (d.acknowledgementState !== "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED") {
      try {
        const ack = await fetch(base + "/purchases/subscriptions/" + line.productId + "/tokens/" + encodeURIComponent(token) + ":acknowledge", { method: "POST", headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" }, body: "{}" });
        if (ack.ok) { const pi = await subPriceInfo(base, accessToken, line.productId, token); notifySale(ctx, { pkg: MCS_PKG, sku: line.productId, country: pi.country || d.regionCode || "", price: pi.price, test: pi.test || !!d.testPurchase, trial: false }); }
      } catch (e) {}
    }
    const exp = Date.parse(line.expiryTime) || 0;
    const access = ACCESS_STATES.includes(d.subscriptionState) && exp > Date.now();
    const tok = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 40);
    const stub = env.MCS_STATS.get(env.MCS_STATS.idFromName("mcs"));
    const r = await stub.fetch("https://s/pbuy", { method: "POST", body: JSON.stringify({ tok, rec, sku: line.productId, exp, access }) });
    const j = await r.json();
    return reply(Object.assign(j, { access, state: d.subscriptionState, expiry: exp ? new Date(exp).toISOString().slice(0, 10) : "" }));
  } catch (e) {
    return reply({ ok: false, error: "server_error" }, 500);
  }
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
  const rec = clean(b.rec || u.searchParams.get("rec"));
  if (!/^p\d{10}(_[a-z0-9]{2,12})?$/.test(rec)) return reply({ error: "bad_rec" }, 400);   /* فون + کاروبار کی قسم — ایک نمبر کی کئی پروفائلیں */
  if (path === "/pget") return fwd("/pget", { rec });
  const admin = await verifyFirebaseAdmin(request);
  if (path === "/pclaim") return fwd("/pclaim", { rec, admin });
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
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (new URL(request.url).pathname === "/stat") return handleStat(request, env);
    if (new URL(request.url).pathname === "/mcsbuy" && request.method === "POST") return handleMcsBuy(request, env, ctx);
    { const pp = new URL(request.url).pathname; if (["/plist", "/pget", "/pimg", "/pclaim", "/psave", "/padmin"].includes(pp)) return handleProf(request, env, pp); }
    { const ap = new URL(request.url).pathname; if (["/agapply", "/agstatus", "/agadmin", "/agref", "/agportal", "/codev", "/codevadmin", "/agdocs", "/agpropose", "/agfind", "/cdfin", "/cdchat", "/mcschat", "/mcsuse"].includes(ap) && request.method === "POST") return handleAgent(request, env, ap); }
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
