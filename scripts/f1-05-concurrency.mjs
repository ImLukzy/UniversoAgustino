// F1-05: 50 reservas simultaneas sobre el MISMO item bazar VENTA -> exactamente
// 1 exito (201) y 49 rechazos 409 NOT_AVAILABLE (indice unico parcial como arbitro).
// Limpieza total incluida: cancela el pedido ganador y elimina el item fixture.
// Uso: node scripts/f1-05-concurrency.mjs [N=50]
import { writeFileSync } from "node:fs";

const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const N = Number(process.argv[2] ?? 50);

async function api(path, { method = "GET", token = null, body = null } = {}) {
  const t = Date.now();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : null,
  });
  const ms = Date.now() - t;
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ms, data: json.data, code: json.error?.code ?? null };
}

const seller = await api("/auth/login", { method: "POST", body: { email: "rosa.quispe@unsa.edu.pe", password: "Creadora123!" } }).then((r) => r.data.access);
const buyer = await api("/auth/login", { method: "POST", body: { email: "admin@unsa.edu.pe", password: "Admin1234!" } }).then((r) => r.data.access);
const stamp = Date.now().toString(36);
const item = await api("/bazar", { method: "POST", token: seller, body: { title: `F1-05 fixture ${stamp}`, kind: "LIBRO", tx: "VENTA", priceCents: 1000 } });
if (item.status !== 201) throw new Error(`fixture bazar fallo: ${item.status}`);
console.log("fixture item:", item.data.id);

const results = await Promise.all(
  Array.from({ length: N }, () => api("/orders", { method: "POST", token: buyer, body: { itemType: "bazar", itemId: item.data.id } })),
);
const ok = results.filter((r) => r.status === 201);
const rej = results.filter((r) => r.status === 409);
const other = results.filter((r) => r.status !== 201 && r.status !== 409);
const codes = {};
for (const r of rej) codes[r.code ?? "?"] = (codes[r.code ?? "?"] ?? 0) + 1;
console.log(`N=${N} exitos=${ok.length} rechazos409=${rej.length} otros=${other.length}`, JSON.stringify(codes));

// Limpieza: cancela el ganador y elimina el item (cero residuos en dev).
let cleaned = "sin ganador que limpiar";
if (ok.length === 1) {
  await api(`/orders/${ok[0].data.id}/cancel`, { method: "POST", token: buyer, body: {} });
  const del = await api(`/bazar/${item.data.id}`, { method: "DELETE", token: seller });
  cleaned = `pedido cancelado + item DELETE ${del.status}`;
}
console.log("limpieza:", cleaned);

const pass = ok.length === 1 && other.length === 0;
console.log(pass ? "F1-05 PASS: sin doble-venta" : "F1-05 FAIL");
writeFileSync("docs/.f1-05-result.json", JSON.stringify({ n: N, ok: ok.length, rej409: rej.length, other: other.length, codes, cleaned, pass }, null, 2));
process.exit(pass ? 0 : 1);
