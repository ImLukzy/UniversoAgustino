// E2E Sprint 1A — fase base (API con TTL normal).
// Uso: node scripts/e2e-sprint1a.mjs base
// Cubre: snapshot en POST /orders, DELETE guard 409, P2025→404,
// upload 415/413, refresh rotation, motivos de cancelación.
const BASE = "http://localhost:4000/api/v1";
const PHASE = process.argv[2] || "base";
const SELLER = { email: "rosa.quispe@unsa.edu.pe", password: "Creadora123!" };
const BUYER = { email: "lukas.melgar@tecsup.edu.pe", password: "Lukas123!" };
const BUYER2 = { email: "admin@unsa.edu.pe", password: "Admin1234!" };
const ts = Date.now().toString(36);

async function raw(method, path, { token, body, cookie } = {}) {
  const headers = {};
  if (token) headers.Authorization = "Bearer " + token;
  if (cookie) headers.Cookie = cookie;
  let payload;
  if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  const r = await fetch(BASE + path, { method, headers, body: payload });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* no-json */ }
  return { status: r.status, json, text, headers: r.headers };
}
async function req(method, path, opts, expect) {
  const r = await raw(method, path, opts);
  if (r.status !== expect) throw new Error(`${method} ${path} -> ${r.status} (esperaba ${expect}): ${JSON.stringify(r.json || r.text).slice(0, 400)}`);
  return r.json?.data;
}
async function reqFail(method, path, opts, expect, expectCode) {
  const r = await raw(method, path, opts);
  if (r.status !== expect) throw new Error(`FALLO ESPERADO ${method} ${path} -> ${r.status} (esperaba ${expect}): ${JSON.stringify(r.json || r.text).slice(0, 400)}`);
  const code = r.json?.error?.code;
  if (expectCode && code !== expectCode) throw new Error(`${method} ${path}: code ${code} != ${expectCode}`);
  return r.json;
}
function assert(cond, msg) { if (!cond) throw new Error("ASSERT: " + msg); }

const login = (u) => req("POST", "/auth/login", { body: u }, 200);

if (PHASE === "base") {
  const S = await login(SELLER), B = await login(BUYER), A = await login(BUYER2);
  const TS = S.access, TB = B.access;
  console.log("login ok", S.role, B.role, A.role);

  // 1. Snapshot en POST /orders (digital)
  const doc = await req("POST", "/documents", { token: TS, body: {
    title: `1A Apunte ${ts}`, course: "Anatomia", career: "ENFERMERIA",
    cycle: "VII", type: "APUNTE", priceCents: 1500 } }, 201);
  const dOrd = await req("POST", "/orders", { token: TB, body: { itemType: "document", itemId: doc.id } }, 201);
  assert(dOrd.sellerId, "snapshot: falta sellerId");
  assert(dOrd.itemTitle && dOrd.itemTitle.includes("1A Apunte"), "snapshot: itemTitle=" + dOrd.itemTitle);
  assert(dOrd.itemPriceCents === 1500, "snapshot: itemPriceCents=" + dOrd.itemPriceCents);
  assert(dOrd.feeBps === 1300, "snapshot: feeBps=" + dOrd.feeBps);
  assert(dOrd.expiresAt, "TTL: falta expiresAt");
  const ttlMin = Math.round((new Date(dOrd.expiresAt) - Date.now()) / 60000);
  assert(ttlMin >= 25 && ttlMin <= 35, "TTL esperado ~30min, fue " + ttlMin);
  console.log("snapshot+TTL ok:", dOrd.itemTitle, dOrd.feeBps, "expira en ~" + ttlMin + "min");

  // 2. P2025 → 404 (PATCH documento inexistente)
  await reqFail("PATCH", "/documents/cm00000000000000000000000", { token: TS, body: { title: "Xxxx" } }, 404, "NOT_FOUND");
  await reqFail("PATCH", "/bazar/cm00000000000000000000000", { token: TS, body: { title: "Xxxx" } }, 404, "NOT_FOUND");
  console.log("P2025→404 ok");

  // 3. DELETE guard 409 con details (digital con PENDING)
  const del1 = await reqFail("DELETE", `/documents/${doc.id}`, { token: TS }, 409, "CONFLICT_ACTIVE_ORDERS");
  assert(del1.error.details?.canForce === true && del1.error.details?.activeOrders === 1, "details guard: " + JSON.stringify(del1.error.details));
  console.log("DELETE guard 409 ok:", JSON.stringify(del1.error.details));
  // cancelar → DELETE 200
  await req("POST", `/orders/${dOrd.id}/cancel`, { token: TB, body: {} }, 200);
  const cancelled = (await req("GET", `/orders/${dOrd.id}`, { token: TB }, 200));
  assert(cancelled.cancelledReason === "BUYER_CANCELLED", "motivo=" + cancelled.cancelledReason);
  console.log("cancel motivo BUYER_CANCELLED ok");
  await req("DELETE", `/documents/${doc.id}`, { token: TS }, 200);
  console.log("DELETE tras cancelar ok");

  // 4. SELLER_REJECTED en alquiler
  const item = await req("POST", "/bazar", { token: TS, body: {
    title: `1A Alquiler ${ts}`, kind: "INSTRUMENTO", tx: "ALQUILER", priceCents: 2000, photos: [] } }, 201);
  const start = new Date(Date.now() + 86400000).toISOString();
  const end = new Date(Date.now() + 5 * 86400000).toISOString();
  const r1 = await req("POST", "/orders", { token: TB, body: { itemType: "bazar", itemId: item.id, rentalStart: start, rentalEnd: end } }, 201);
  await req("POST", `/orders/${r1.id}/cancel`, { token: TS, body: {} }, 200);
  const rej = await req("GET", `/orders/${r1.id}`, { token: TS }, 200);
  assert(rej.cancelledReason === "SELLER_REJECTED", "motivo=" + rej.cancelledReason);
  console.log("cancel motivo SELLER_REJECTED ok");

  // 5. Upload 415 (.exe) y 413 (>25MB)
  const exeFd = new FormData();
  exeFd.append("file", new Blob(["MZ"], { type: "application/octet-stream" }), "malware.exe");
  {
    const r = await fetch(BASE + "/uploads", { method: "POST", headers: { Authorization: "Bearer " + TS }, body: exeFd });
    const j = await r.json();
    assert(r.status === 415 && j.error?.code === "UNSUPPORTED_FILE_TYPE", "415: " + r.status + " " + JSON.stringify(j).slice(0, 200));
  }
  console.log("upload 415 ok");
  const big = Buffer.alloc(26 * 1024 * 1024, 1);
  const bigFd = new FormData();
  bigFd.append("file", new Blob([big], { type: "application/pdf" }), "grande.pdf");
  {
    const r = await fetch(BASE + "/uploads", { method: "POST", headers: { Authorization: "Bearer " + TS }, body: bigFd });
    const j = await r.json();
    assert(r.status === 413 && j.error?.code === "FILE_TOO_LARGE", "413: " + r.status + " " + JSON.stringify(j).slice(0, 200));
    assert(j.error?.details?.limitBytes === 26214400, "limitBytes: " + JSON.stringify(j.error?.details));
  }
  console.log("upload 413 ok");

  // 6. Refresh rotation: login → refresh con cookie → 200; reuso de la vieja → 401
  const loginRes = await fetch(BASE + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(BUYER) });
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const m = setCookie.match(/hub_refresh=([^;]+)/);
  assert(m, "sin cookie hub_refresh: " + setCookie.slice(0, 120));
  const c1 = `hub_refresh=${m[1]}`;
  const r1f = await fetch(BASE + "/auth/refresh", { method: "POST", headers: { Cookie: c1 } });
  assert(r1f.status === 200, "refresh 1: " + r1f.status);
  const j1 = await r1f.json();
  assert(j1.data?.access, "refresh sin access");
  const me = await fetch(BASE + "/auth/me", { headers: { Authorization: "Bearer " + j1.data.access } });
  assert(me.status === 200, "me con access rotado: " + me.status);
  const r2f = await fetch(BASE + "/auth/refresh", { method: "POST", headers: { Cookie: c1 } });
  assert(r2f.status === 401, "reuso de refresh viejo debe ser 401, fue " + r2f.status);
  console.log("refresh rotation ok (200 → me 200 → reuso 401)");
  void A;
  console.log("E2E BASE 1A OK");
}

if (PHASE === "ttl") {
  // Requiere API con RESERVATION_TTL_MINUTES=1
  const S = await login(SELLER), B = await login(BUYER), A = await login(BUYER2);
  const TS = S.access, TB = B.access, TA = A.access;
  const item = await req("POST", "/bazar", { token: TS, body: {
    title: `1A TTL ${ts}`, kind: "INSTRUMENTO", tx: "ALQUILER", priceCents: 2000, photos: [] } }, 201);
  const start = new Date(Date.now() + 86400000).toISOString();
  const end = new Date(Date.now() + 5 * 86400000).toISOString();
  const o1 = await req("POST", "/orders", { token: TB, body: { itemType: "bazar", itemId: item.id, rentalStart: start, rentalEnd: end } }, 201);
  console.log("o1 PENDING, expira:", o1.expiresAt);
  console.log("esperando 75s al TTL (1min)...");
  await new Promise((r) => setTimeout(r, 75000));
  // Expiración perezosa: segundo comprador reserva OK sin cron
  const o2 = await req("POST", "/orders", { token: TA, body: { itemType: "bazar", itemId: item.id, rentalStart: start, rentalEnd: end } }, 201);
  assert(o2.status === "PENDING", "o2 no PENDING");
  const o1after = await req("GET", `/orders/${o1.id}`, { token: TB }, 200);
  assert(o1after.status === "CANCELLED" && o1after.cancelledReason === "TTL_EXPIRED",
    "o1=" + o1after.status + "/" + o1after.cancelledReason);
  console.log("lazy expiry ok: o1 CANCELLED/TTL_EXPIRED, o2 PENDING");
  await reqFail("POST", `/orders/${o1.id}/accept`, { token: TS, body: {} }, 409, "RESERVATION_EXPIRED");
  console.log("accept vencido → 409 RESERVATION_EXPIRED ok");
  // accept en o2 limpia expiresAt + acceptedAt
  const acc = await req("POST", `/orders/${o2.id}/accept`, { token: TS, body: {} }, 200);
  assert(acc.status === "ACCEPTED" && acc.acceptedAt && !acc.expiresAt, "accept: " + JSON.stringify({ s: acc.status, a: !!acc.acceptedAt, e: acc.expiresAt }));
  console.log("accept ok: acceptedAt set, expiresAt null");
  console.log("E2E TTL 1A OK");
}
