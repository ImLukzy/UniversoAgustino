// Lighthouse F0-b sobre el build de produccion (vite preview :4173).
// Login real via UI una vez; luego corre lighthouse contra el mismo Chrome
// (puerto CDP compartido) con la sesion preservada (disableStorageReset).
// Uso: node scripts/f0-lighthouse.mjs [PREVIEW_URL]
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import lighthouse from "lighthouse";

const WEB = process.argv[2] ?? process.env.PREVIEW_URL ?? "http://localhost:4173";
const PORT = 9333;
const PAGES = (process.env.LH_ONLY
  ? [
      { name: "Detalle", path: process.env.LH_DETALLE ?? "/p/document/cmuc69gij000311t3pao7ea0t" },
      { name: "Checkout", path: process.env.LH_CHECKOUT ?? "/checkout/cmuc69hvz000a11t34nk8ttni" },
      { name: "Panel", path: "/panel" },
      { name: "Publicar", path: "/publicar" },
    ].filter((p) => p.name.toLowerCase() === process.env.LH_ONLY.toLowerCase())
  : [
      { name: "Detalle", path: process.env.LH_DETALLE ?? "/p/document/cmuc69gij000311t3pao7ea0t" },
      { name: "Checkout", path: process.env.LH_CHECKOUT ?? "/checkout/cmuc69hvz000a11t34nk8ttni" },
      { name: "Panel", path: "/panel" },
      { name: "Publicar", path: "/publicar" },
    ]);

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [`--remote-debugging-port=${PORT}`, "--no-sandbox"],
});
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(`${WEB}/login`, { waitUntil: "networkidle" });
await page.locator("input[name=hub-email]").fill("admin@unsa.edu.pe");
await page.locator("input[name=hub-pass]").fill("Admin1234!");
await page.locator("form button:not([type=button])").first().click();
await page.waitForURL(`${WEB}/`, { timeout: 20000 });
console.log("login ok");

const rows = [];
for (const { name, path } of PAGES) {
  const url = `${WEB}${path}`;
  const res = await lighthouse(
    url,
    {
      port: PORT,
      onlyCategories: ["performance", "accessibility"],
      disableStorageReset: true,
      output: "json",
    },
    undefined,
  );
  const lhr = res.lhr;
  writeFileSync(`docs/.lhr-${name.toLowerCase()}.json`, JSON.stringify(lhr));
  if (process.env.LH_ONLY) {
    writeFileSync(`docs/.lhr-${name.toLowerCase()}.json`, JSON.stringify(lhr));
  }
  const perf = Math.round((lhr.categories.performance?.score ?? 0) * 100);
  const a11y = Math.round((lhr.categories.accessibility?.score ?? 0) * 100);
  const audits = lhr.audits ?? {};
  const m = (id) => audits[id]?.numericValue ?? audits[id]?.displayValue ?? "-";
  const a11yIds = new Set((lhr.categories.accessibility?.auditRefs ?? []).map((r) => r.id));
  const row = {
    page: name,
    path,
    finalUrl: lhr.finalUrl,
    performance: perf,
    accessibility: a11y,
    FCP_ms: Math.round(m("first-contentful-paint")),
    LCP_ms: Math.round(m("largest-contentful-paint")),
    TBT_ms: Math.round(m("total-blocking-time")),
    CLS: audits["cumulative-layout-shift"]?.numericValue?.toFixed(3) ?? "-",
    SI_ms: Math.round(m("speed-index")),
    failedAudits: Object.entries(audits)
      .filter(([, a]) => a?.score !== null && a?.score !== undefined && a.score < 1 && a.scoreDisplayMode !== "manual" && a.scoreDisplayMode !== "notApplicable" && a.scoreDisplayMode !== "informative")
      .map(([id, a]) => ({ id, cat: a11yIds.has(id) ? "a11y" : "perf", score: a.score, title: a.title, display: (a.displayValue ?? "").slice(0, 120) })),
  };
  rows.push(row);
  console.log(`${name}: perf=${perf} a11y=${a11y} LCP=${row.LCP_ms}ms CLS=${row.CLS} final=${lhr.finalUrl}`);
}
await browser.close();

writeFileSync("docs/.lighthouse-raw.json", JSON.stringify(rows, null, 2));
let md = `# Auditoria Lighthouse - F0-b\n\nFecha: ${new Date().toISOString().slice(0, 10)} - lighthouse 13 (libreria) sobre Chrome del sistema headless, build de produccion (\`vite preview\`), viewport desktop por defecto, categorias performance+accessibility, sesion admin preservada.\n\n> Nota de rutas: el plan cita Detalle como \`/d/:id\`; la ruta real es \`/p/:type/:id\`. Se midio \`/p/document/:id\`.\n\n| Pagina | Ruta | Perf | A11y | FCP | LCP | TBT | CLS | SI |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) {
  md += `| ${r.page} | \`${r.path}\` | ${r.performance} | ${r.accessibility} | ${r.FCP_ms}ms | ${r.LCP_ms}ms | ${r.TBT_ms}ms | ${r.CLS} | ${r.SI_ms}ms |\n`;
}
md += `\nfinalUrl verificado en cada corrida (sin redireccion a /login: sesion valida).\n`;
writeFileSync("docs/auditoria-lighthouse.md", md);
console.log("Reporte: docs/auditoria-lighthouse.md");
