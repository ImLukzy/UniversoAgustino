// Fixtures para auditorías F0 (axe + lighthouse) y medición p95.
// Crea vía API: 1 documento + 1 ítem bazar (creadora) + 1 pedido PENDING (admin).
// Uso: node scripts/f0-fixtures.mjs  (imprime IDs y URLs a auditar)
const API = process.env.API_URL ?? "http://localhost:4000/api/v1";

async function api(path, { method = "GET", token = null, body = null } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json.data;
}

const login = (email, password) =>
  api("/auth/login", { method: "POST", body: { email, password } }).then((d) => d.access);

const stamp = Date.now().toString(36);

const creator = await login("rosa.quispe@unsa.edu.pe", "Creadora123!");
const doc = await api("/documents", {
  method: "POST",
  token: creator,
  body: {
    title: `Apunte auditoría F0 ${stamp}`,
    course: "Anatomía",
    cycle: "VI",
    type: "APUNTE",
    priceCents: 1500,
    description: "Fixture temporal para auditoría de accesibilidad y performance.",
  },
});
const item = await api("/bazar", {
  method: "POST",
  token: creator,
  body: {
    title: `Libro auditoría F0 ${stamp}`,
    kind: "LIBRO",
    tx: "VENTA",
    priceCents: 2500,
    description: "Fixture temporal para auditoría.",
  },
});

const admin = await login("admin@unsa.edu.pe", "Admin1234!");
const order = await api("/orders", {
  method: "POST",
  token: admin,
  body: { itemType: "document", itemId: doc.id },
});

console.log(JSON.stringify({ docId: doc.id, bazarId: item.id, orderId: order.id }, null, 2));
console.log(`DETALLE=/p/document/${doc.id}`);
console.log(`CHECKOUT=/checkout/${order.id}`);
console.log(`PANEL=/panel`);
console.log(`PUBLICAR=/publicar`);
