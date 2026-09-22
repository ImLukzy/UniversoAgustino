// Medicion p95 F0-c: POST /orders, POST /orders/:id/pay, GET /orders/sales, GET /orders/mine.
// Bucle secuencial con fetch (sin dependencias). Crea N items bazar VENTA + N pedidos
// (cada pedido necesita item fresco: el indice unico parcial bloquea re-uso).
// Uso: node scripts/f0-p95.mjs [N=25]
import { writeFileSync } from "node:fs";

const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const N = Number(process.argv[2] ?? 25);

async function api(path, { method = "GET", token = null, body = null } = {}) {
  const t = Date.now();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : null,
  });
  const ms = Date.now() - t;
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ms, data: json.data, err: json.error };
}

const stats = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
  return { n: s.length, min: s[0], p50: q(50), p95: q(95), max: s[s.length - 1] };
};

const seller = await api("/auth/login", { method: "POST", body: { email: "rosa.quispe@unsa.edu.pe", password: "Creadora123!" } }).then((r) => r.data.access);
const buyer = await api("/auth/login", { method: "POST", body: { email: "admin@unsa.edu.pe", password: "Admin1234!" } }).then((r) => r.data.access);
console.log("login ok, creando fixtures...");

const stamp = Date.now().toString(36);
const itemIds = [];
for (let i = 0; i < N; i++) {
  const r = await api("/bazar", { method: "POST", token: seller, body: { title: `Item p95 ${stamp}-${i}`, kind: "LIBRO", tx: "VENTA", priceCents: 1000 + i } });
  if (r.status !== 201) throw new Error(`fixture bazar fallo: ${r.status} ${JSON.stringify(r.err)}`);
  itemIds.push(r.data.id);
}

const tCreate = [], orderIds = [];
for (const id of itemIds) {
  const r = await api("/orders", { method: "POST", token: buyer, body: { itemType: "bazar", itemId: id } });
  tCreate.push(r.ms);
  if (r.status !== 201) throw new Error(`POST /orders fallo: ${r.status} ${JSON.stringify(r.err)}`);
  orderIds.push(r.data.id);
}

const tPay = [];
for (const id of orderIds) {
  const r = await api(`/orders/${id}/pay`, { method: "POST", token: buyer, body: { payProof: "OP-123456" } });
  tPay.push(r.ms);
  if (r.status !== 200) throw new Error(`POST /orders/:id/pay fallo: ${r.status} ${JSON.stringify(r.err)}`);
}

const tSales = [], tMine = [];
for (let i = 0; i < N; i++) {
  tSales.push((await api("/orders/sales", { token: seller })).ms);
  tMine.push((await api("/orders/mine", { token: buyer })).ms);
}

const rows = [
  ["POST /api/v1/orders", stats(tCreate)],
  ["POST /api/v1/orders/:id/pay", stats(tPay)],
  ["GET /api/v1/orders/sales", stats(tSales)],
  ["GET /api/v1/orders/mine", stats(tMine)],
];
for (const [name, s] of rows) console.log(`${name}: n=${s.n} min=${s.min} p50=${s.p50} p95=${s.p95} max=${s.max} ms`);

let md = `# Medicion p95 - F0-c\n\nFecha: ${new Date().toISOString().slice(0, 10)} - bucle secuencial con fetch (N=${N}), API local :4000 contra Neon dev (sa-east-1), latencias de ida/vuelta incluidas.\n\n> Los pedidos medidos quedan en estado PAID sobre items ` + "`Item p95 ...`" + ` creados para la medicion (cada pedido exige item fresco por el indice unico parcial). Ver limpieza en el reporte.\n\n| Endpoint | n | min | p50 | p95 | max |\n|---|---|---|---|---|---|\n`;
for (const [name, s] of rows) md += `| \`${name}\` | ${s.n} | ${s.min}ms | ${s.p50}ms | ${s.p95}ms | ${s.max}ms |\n`;
writeFileSync("docs/medicion-p95.md", md);
console.log("Reporte: docs/medicion-p95.md");
