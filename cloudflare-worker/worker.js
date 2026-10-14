// AIO / FFPOS / DG Khatabook — Google Play purchase verify (subscriptions + one-time lifetime)
// خفیہ چابی (SERVICE_ACCOUNT_JSON) کوڈ میں نہیں، Cloudflare کی Settings → Variables and Secrets میں ہے۔
var DEFAULT_PACKAGE = "com.pbtcodelabs.aiopos";

// سبسکرپشنز (ہر مدت والی)
var APPS = {
  "com.pbtcodelabs.aiopos": ["aio_user1plus0_3m", "aio_user1plus0_6m", "aio_user1plus0_12m"],
  "com.pbtcodelabs.ffpos": ["ffpos_monthly", "ffpos_quarterly", "ffpos_halfyearly", "ffpos_yearly", "ffpos_premium"],
  "com.pbtcodelabs.dgkhata": ["dg_khata_1m", "dg_khata_3m", "dg_khata_6m", "dg_khata_12m"]
};

// ایک بار کی خریداری (لائف ٹائم) — کبھی ختم نہیں
var ONETIME = {
  "com.pbtcodelabs.aiopos": ["aio_lifetime_onetime"]
};
var LIFETIME_EXPIRY = "2099-12-31";

var ACCESS_STATES = [
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_CANCELED",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
];

var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
async function verifyOneTime(base, accessToken, sku, token) {
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

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return reply({ error: "POST only" }, 405);

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
        return await verifyOneTime(base, accessToken, sku, token);
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
