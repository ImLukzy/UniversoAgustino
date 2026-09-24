// Regresión visual (spec 15, T4): scroll horizontal (A6), CLS (A7) y capturas (A8).
// Uso: node scripts/visual-regression.mjs [WEB_URL]
// Requiere web + API corriendo. Env: API_URL, HUB_EMAIL, HUB_PASS, CHROME_PATH.
/* global window, document, location -- código evaluado en la página */
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const WEB = process.argv[2] ?? process.env.WEB_URL ?? "http://localhost:5173";
const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const EMAIL = process.env.HUB_EMAIL ?? "admin@unsa.edu.pe";
const PASS = process.env.HUB_PASS ?? "Admin1234!";
// El Chromium empaquetado de Playwright está desfasado: se usa el 1228 instalado.
const CHROME = process.env.CHROME_PATH ?? join(homedir(), "AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe");
const SIZES = [
  { w: 1280, h: 800 },
  { w: 375, h: 812 },
];

// El refresh rota en cada uso: una sesión nueva por contexto (ancho).
async function login() {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!r.ok) throw new Error(`login ${r.status}`);
  const refresh = /hub_refresh=([^;]+)/.exec(r.headers.get("set-cookie") ?? "")?.[1];
  if (!refresh) throw new Error("login sin cookie hub_refresh");
  return { access: (await r.json()).data.access, refresh };
}

const { access } = await login();
const docId = (await (await fetch(`${API}/documents?limit=1`)).json()).data[0]?.id;
const orders = await fetch(`${API}/orders/mine`, { headers: { Authorization: `Bearer ${access}` } });
const orderId = process.env.ORDER_ID ?? (orders.ok ? (await orders.json()).data[0]?.id : undefined);
if (!docId) throw new Error("falta un documento en el catálogo");
if (!orderId) console.warn(`sin pedido (GET /orders/mine → ${orders.status}): se omite /checkout`);

const ROUTES = ["/", "/explorar", "/explorar?career=MEDICINA", "/bazar", `/p/document/${docId}`, `/v/${docId}`, ...(orderId ? [`/checkout/${orderId}`] : []), "/panel", "/publicar", "/legal", "/monetiza"];
const out = join("artifacts/visual", new Date().toISOString().slice(0, 10));
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const results = [];
for (const { w, h } of SIZES) {
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  const { refresh } = await login();
  await context.addCookies([{ name: "hub_refresh", value: refresh, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  await context.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const page = await context.newPage();
  let errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of ROUTES) {
    errors = [];
    await page.goto(WEB + route, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    // clientWidth (sin la barra vertical) es más estricto que innerWidth.
    const m = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      cls: Math.round(window.__cls * 1000) / 1000,
      rendered: (document.getElementById("root")?.childElementCount ?? 0) > 0,
      path: location.pathname + location.search,
    }));
    const file = `${route.replace(/[/?=]+/g, "_").replace(/^_|_$/g, "") || "home"}-${w}.png`;
    await page.screenshot({ path: join(out, file), fullPage: true });
    // Una página en blanco (p. ej. Vite sirviendo un módulo vacío) no cuenta como OK.
    const ok = m.rendered && !errors.length && m.overflow <= 0 && m.cls < 0.05;
    results.push({ route, width: w, ...m, errors, ok, file });
  }
  await context.close();
}
await browser.close();

writeFileSync(join(out, "results.json"), JSON.stringify(results, null, 2));
console.table(results.map(({ route, width, overflow, cls, rendered, errors, path, ok }) => ({ route, width, overflow, cls, rendered, errors: errors.length, path, ok })));
const bad = results.filter((r) => !r.ok);
console.log(`${results.length - bad.length}/${results.length} OK → ${out}`);
process.exit(bad.length ? 1 : 0);
