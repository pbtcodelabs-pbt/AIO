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
  "Access-Control-Allow-Headers": "Content-Type"
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

async function handleOcr(request, env) {
  if (!env.AI) return reply({ error: "ai_not_configured" }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return reply({ error: "bad_json" }, 400); }
  const img = body && body.image;
  if (typeof img !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(img) || img.length > 2500000) {
    return reply({ error: "bad_image" }, 400);
  }
  let lastErr = "";
  // جانچ کے لیے کسی ایک ماڈل کو چننا (صرف اوپر والی فہرست میں سے)
  const only = body && OCR_MODELS.includes(body.model) ? [body.model] : OCR_MODELS;
  for (const model of only) {
    try {
      const out = await env.AI.run(model, {
        messages: [{ role: "user", content: [
          { type: "text", text: OCR_PROMPT },
          { type: "image_url", image_url: { url: img } }
        ] }],
        max_tokens: 400,
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
async function handleRates(ctx) {
  const cache = caches.default;
  const key = new Request("https://aio-pos-verify/rates-cache-v1");
  const hit = await cache.match(key);
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
  const res = new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json", "Cache-Control": "max-age=1800", ...CORS } });
  if (out.usdPkr || out.goldTola) ctx && ctx.waitUntil ? ctx.waitUntil(cache.put(key, res.clone())) : await cache.put(key, res.clone());
  return res;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method === "GET" && new URL(request.url).pathname === "/rates") return handleRates(ctx);
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
