// E2E F1-01 (forgot/reset) + F1-08 (notificaciones).
// Uso:
//   node scripts/e2e-f1.mjs phase-a   (forgot, reset, login, revocación)
//   # reiniciar el API (limpia los limiters in-memory)
//   node scripts/e2e-f1.mjs phase-b   (reuso 410, ráfaga 429, restore, notifs)
// Requiere API local con MAIL_DRIVER=console (lee el token del api-out.log).
// Restaura la contraseña de la vendedora al final.
import fs from "node:fs";

const BASE = "http://localhost:4000/api/v1";
const LOG = "C:/Users/anton/AppData/Local/Temp/opencode/api-out.log";
const SELLER = { email: "rosa.quispe@unsa.edu.pe", password: "Creadora123!" };
const BUYER = { email: "lukas.melgar@tecsup.edu.pe", password: "Lukas123!" };
const NEW_PASS = "Temporal123!";
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
  try { json = JSON.parse(text); } catch { /* noop */ }
  return { status: r.status, json, setCookie: r.headers.get("set-cookie") || "" };
}
const assert = (c, m) => { if (!c) throw new Error("ASSERT: " + m); };
const lastToken = () => {
  const log = fs.readFileSync(LOG, "utf8");
  const ms = [...log.matchAll(/reset-password\?token=([A-Za-z0-9_-]+)/g)];
  assert(ms.length > 0, "sin enlace de reset en el log del API");
  return ms[ms.length - 1][1];
};

// ---------- F1-01 ----------
const PHASE = process.argv[2] || "phase-a";

if (PHASE === "phase-a") {
let r = await raw("POST", "/auth/forgot", { body: { email: SELLER.email } });
assert(r.status === 202 && r.json?.ok === true, "forgot existente: " + r.status);
r = await raw("POST", "/auth/forgot", { body: { email: "nadie-" + ts + "@unsa.edu.pe" } });
assert(r.status === 202 && r.json?.ok === true, "forgot inexistente debe dar el mismo 202");
console.log("forgot 202 anti-enumeración ok");

// sesión previa al reset (para verificar revocación después)
r = await raw("POST", "/auth/login", { body: SELLER });
assert(r.status === 200, "login previo: " + r.status);
const preCookie = (r.setCookie.match(/hub_refresh=([^;]+)/) || [])[1];
assert(preCookie, "login previo sin cookie");

const tok1 = lastToken();
r = await raw("POST", "/auth/reset", { body: { token: tok1, password: "corta" } });
assert(r.status === 400, "password débil debe ser 400, fue " + r.status);
console.log("reset débil 400 ok");

r = await raw("POST", "/auth/reset", { body: { token: tok1, password: NEW_PASS } });
assert(r.status === 200, "reset válido: " + r.status + " " + JSON.stringify(r.json));
console.log("reset 200 ok");

// login con la nueva, rechazo con la anterior
r = await raw("POST", "/auth/login", { body: { email: SELLER.email, password: NEW_PASS } });
assert(r.status === 200, "login nueva: " + r.status);
const sellerCookie = (r.setCookie.match(/hub_refresh=([^;]+)/) || [])[1];
assert(sellerCookie, "login sin cookie refresh");
r = await raw("POST", "/auth/login", { body: { email: SELLER.email, password: SELLER.password } });
assert(r.status === 401, "login anterior debe ser 401, fue " + r.status);
console.log("login nueva ok / anterior 401 ok");

// sesiones previas al reset quedan revocadas: refresh con cookie anterior -> 401
r = await raw("POST", "/auth/refresh", { cookie: `hub_refresh=${preCookie}` });
assert(r.status === 401, "refresh revocado debe ser 401, fue " + r.status);
console.log("sesiones revocadas tras reset ok");
fs.writeFileSync("C:/Users/anton/AppData/Local/Temp/opencode/e2e-f1-token.txt", tok1);
console.log("E2E F1 phase-a OK (reinicia el API y corre phase-b)");
}

if (PHASE === "phase-b") {
// reuso del token usado en phase-a -> 410 (el registro persiste en BD)
const tok1 = fs.readFileSync("C:/Users/anton/AppData/Local/Temp/opencode/e2e-f1-token.txt", "utf8").trim();
let r = await raw("POST", "/auth/reset", { body: { token: tok1, password: "Otra123456!" } });
assert(r.status === 410 && r.json?.error?.code === "TOKEN_EXPIRED", "reuso debe ser 410, fue " + r.status);
console.log("reuso token 410 ok");

// restaurar contraseña original ANTES de la ráfaga (el limiter IP 5/15min
// obliga a ordenar: reuse(1) + restore(2) + ráfaga(8, los últimos 429))
await raw("POST", "/auth/forgot", { body: { email: SELLER.email } });
const tok2 = lastToken();
r = await raw("POST", "/auth/reset", { body: { token: tok2, password: SELLER.password } });
assert(r.status === 200, "restaurar password: " + r.status);
r = await raw("POST", "/auth/login", { body: SELLER });
assert(r.status === 200, "login restaurado: " + r.status);
console.log("password restaurada ok");

// rate limit: ráfaga con emails distintos -> algún 429 RATE_LIMITED
let limited = 0;
for (let i = 0; i < 8; i++) {
  const q = await raw("POST", "/auth/forgot", { body: { email: `rl-${ts}-${i}@unsa.edu.pe` } });
  if (q.status === 429 && q.json?.error?.code === "RATE_LIMITED") limited++;
  else assert(q.status === 202, "forgot ráfaga inesperado: " + q.status);
}
assert(limited >= 1, "se esperaba al menos un 429 en la ráfaga");
console.log(`rate limit ok (${limited}×429 en ráfaga de 8)`);

// ---------- F1-08 ----------
const S = await (await raw("POST", "/auth/login", { body: SELLER })).json;
const B = await (await raw("POST", "/auth/login", { body: BUYER })).json;
const TS = S.data.access, TB = B.data.access;
const doc = await (await raw("POST", "/documents", { token: TS, body: {
  title: `F1Notif ${ts}`, course: "Anatomia", career: "ENFERMERIA",
  cycle: "VII", type: "APUNTE", priceCents: 1500 } })).json;
const docId = doc.data.id;
const mk = async (t, p) => (await raw("GET", "/notifications" + (p || ""), { token: t })).json;
await raw("POST", "/notifications/read-all", { token: TS });
const o = await (await raw("POST", "/orders", { token: TB, body: { itemType: "document", itemId: docId } })).json;
const unread1 = await mk(TS, "?unread=1&pageSize=1");
assert(unread1.total >= 1, "vendedor sin notificación ORDER_CREATED");
const list1 = await mk(TS, "?pageSize=5");
assert(list1.data[0]?.type === "ORDER_CREATED", "tipo=" + list1.data[0]?.type);
console.log("ORDER_CREATED notifica al vendedor ok");
await raw("POST", `/orders/${o.data.id}/pay`, { token: TB, body: { payProof: "F1-08" } });
const unread2 = await mk(TS, "?unread=1&pageSize=1");
assert(unread2.total >= 2, "vendedor sin notificación ORDER_PAID (total=" + unread2.total + ")");
console.log("ORDER_PAID notifica al vendedor ok");
await raw("POST", "/notifications/read-all", { token: TS });
const unread3 = await mk(TS, "?unread=1&pageSize=1");
assert(unread3.total === 0, "read-all no limpió: " + unread3.total);
console.log("read-all ok");
// La de otro usuario no se puede marcar
const other = await raw("POST", `/notifications/${list1.data[0].id}/read`, { token: TB });
assert(other.status === 404, "marcar ajena debe ser 404, fue " + other.status);
console.log("read ajena 404 ok");
// limpieza: cancelar pedido y borrar apunte
await raw("POST", `/orders/${o.data.id}/cancel`, { token: TB, body: {} });
await raw("DELETE", `/documents/${docId}`, { token: TS });
console.log("E2E F1-01 + F1-08 OK");
}
