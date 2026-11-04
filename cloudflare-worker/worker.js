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

// ---------- 🔔 نئی خریداری پر مالک کے فون پر پیغام (ntfy ایپ) ----------
// مالک فون میں «ntfy» ایپ میں یہی topic سبسکرائب کرے۔ صرف پہلی تصدیق (acknowledge) پر پیغام، تجدید پر نہیں۔
var NTFY_TOPIC = "aio-sales-7bg2fo5j6vist8funtq7jk";
var APP_NAMES = {
  "com.pbtcodelabs.aiopos": "AIO POS",
  "com.pbtcodelabs.ffpos": "FFPOS",
  "com.pbtcodelabs.dgkhata": "DG Khata",
  "com.pbtcodelabs.ggkhatabook": "GG Khatabook"
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
  }
  entGet(id) { const r = this.sql.exec("SELECT data FROM ent WHERE id = ?", id).toArray()[0]; return r ? JSON.parse(r.data) : null; }
  entPut(e) { e.ts = Date.now(); this.sql.exec("INSERT INTO ent (id, app, data, ts) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data, ts = excluded.ts", e.id, e.app, JSON.stringify(e), e.ts); (e.keys || []).forEach((k) => this.sql.exec("INSERT INTO entkey (k, id) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET id = excluded.id", e.app + "|" + k, e.id)); }
  entOut(e) { const now = Date.now(); return { ok: true, id: e.id, name: e.name || "", life: !!e.life, exp: e.exp || 0, active: !e.revoked && (!!e.life || (e.exp || 0) > now), revoked: !!e.revoked, devices: e.devices || 1, used: (e.claims || []).length, keys: e.keys || [] }; }
  async fetch(request) {
    const u = new URL(request.url);
    const op = u.pathname;
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
        if (e.uidLock && b.key.startsWith("p:")) return Response.json({ ok: false, reason: "phone_locked" });
        if (e.claims.length >= (e.devices || 1)) return Response.json({ ok: false, reason: "devices_full", devices: e.devices || 1 });
        e.claims.push({ dev: b.dev, at: Date.now(), via: b.key.slice(0, 1) });
        this.entPut(e);
      } else if (Date.now() - (mine.seen || mine.at || 0) > 864e5) { mine.seen = Date.now(); this.entPut(e); }   /* AIO0411WE162: ہر جانچ پر لکھنا نہیں — دن میں ایک بار */
      const o = this.entOut(e); delete o.keys; o.id = undefined; return Response.json(o);   /* گاہک کو دوسری چابیاں (جی میل / نمبر) نہیں */
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
      if (b.op === "list") return Response.json({ ok: true, list: this.sql.exec("SELECT data FROM ent WHERE app = ? ORDER BY ts DESC LIMIT 1000", b.app).toArray().map((r) => { const e = JSON.parse(r.data); return Object.assign(this.entOut(e), { note: e.note || "", at: e.at || 0, claims: e.claims || [] }); }) });
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
        this.entPut(e);
        return Response.json(this.entOut(e));
      }
      const e = this.entGet(b.id); if (!e) return Response.json({ ok: false, reason: "none" });
      if (b.op === "revoke") { e.revoked = true; this.entPut(e); return Response.json(this.entOut(e)); }
      if (b.op === "unrevoke") { e.revoked = false; this.entPut(e); return Response.json(this.entOut(e)); }
      if (b.op === "reset") { e.claims = []; this.entPut(e); return Response.json(this.entOut(e)); }
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
    if (op === "/plist") return Response.json(Object.fromEntries(this.sql.exec("SELECT rec, since, until, ts FROM prof").toArray().map((r) => [r.rec, { since: r.since, until: r.until, ts: r.ts }])));
    if (op === "/pget") {
      const { rec } = await request.json();
      const r = this.sql.exec("SELECT data, since, until, ts FROM prof WHERE rec = ?", rec).toArray()[0];
      if (!r) return Response.json({ none: true });
      const imgs = this.sql.exec("SELECT id, ts FROM pimg WHERE rec = ? ORDER BY id", rec).toArray();
      let data = {}; try { data = JSON.parse(r.data || "{}"); } catch (e) {}
      return Response.json({ rec, data, since: r.since, until: r.until, ts: r.ts, imgs });
    }
    if (op === "/pimg") { const { id } = await request.json(); const r = this.sql.exec("SELECT data FROM pimg WHERE id = ?", id).toArray()[0]; return Response.json({ data: r ? r.data : "" }); }
    if (op === "/pclaim") {
      const b = await request.json(); const now = Date.now();
      const r = this.sql.exec("SELECT key, since, until FROM prof WHERE rec = ?", b.rec).toArray()[0];
      if (r && r.key && !b.admin) return Response.json({ error: "taken" }, { status: 409 });
      const key = [...crypto.getRandomValues(new Uint8Array(18))].map((x) => "abcdefghjkmnpqrstuvwxyz23456789"[x % 31]).join("");
      if (r) this.sql.exec("UPDATE prof SET key = ? WHERE rec = ?", key, b.rec);
      else this.sql.exec("INSERT INTO prof (rec, data, key, since, until, ts) VALUES (?, '{}', ?, ?, ?, ?)", b.rec, key, now, now + 15 * 864e5, now);   /* MCS: مفت آزمائش 15 دن */
      const x = this.sql.exec("SELECT since, until FROM prof WHERE rec = ?", b.rec).toArray()[0];
      return Response.json({ key, since: x.since, until: x.until });
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
      if (b.act === "until") this.sql.exec("UPDATE prof SET until = ? WHERE rec = ?", b.until, b.rec);
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
    const r = await fwd("/ent_claim", { app, key, dev, bind: path === "/entclaim" });
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
    if (["revoke", "unrevoke", "reset", "delete"].includes(op)) return fwd("/ent_admin", { op, app, id: String(b.id || "").slice(0, 40) });
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
  if (d.map && isFinite(+d.map.lat) && isFinite(+d.map.lon)) out.map = { lat: +(+d.map.lat).toFixed(6), lon: +(+d.map.lon).toFixed(6) };
  return out;
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
    { const pp = new URL(request.url).pathname; if (["/plist", "/pget", "/pimg", "/pclaim", "/psave", "/padmin"].includes(pp)) return handleProf(request, env, pp); }
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
