// Auditoría axe-core F0-a: Detalle, Checkout, Panel, Publicar.
// Uso: node scripts/f0-axe.mjs [WEB_URL]
// Requiere: web corriendo, fixtures creados (ver scripts/f0-fixtures.mjs).
// Usa el Chrome del sistema (channel: "chrome"), sin descargas de Playwright.
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const WEB = process.argv[2] ?? process.env.WEB_URL ?? "http://localhost:5173";
const PAGES = [
  { name: "Detalle", path: process.env.AXE_DETALLE ?? "/p/document/cmuc69gij000311t3pao7ea0t" },
  { name: "Checkout", path: process.env.AXE_CHECKOUT ?? "/checkout/cmuc69hvz000a11t34nk8ttni" },
  { name: "Panel", path: "/panel" },
  { name: "Publicar", path: "/publicar" },
];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Login real vía UI (admin = comprador del pedido fixture)
await page.goto(`${WEB}/login`, { waitUntil: "networkidle" });
await page.locator("input[name=hub-email]").fill("admin@unsa.edu.pe");
await page.locator("input[name=hub-pass]").fill("Admin1234!");
await page.locator("form button:not([type=button])").first().click();
await page.waitForURL(`${WEB}/`, { timeout: 20000 });

const results = [];
for (const { name, path } of PAGES) {
  await page.goto(`${WEB}${path}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500); // deja resolver queries/skeletons
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const pruned = (r.violations ?? []).map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    helpUrl: v.helpUrl,
    nodes: v.nodes.map((n) => ({ html: n.html.slice(0, 220), target: n.target })),
  }));
  results.push({ page: name, path, violations: pruned });
  const crit = pruned.filter((v) => v.impact === "critical" || v.impact === "serious");
  console.log(`${name} ${path}: ${pruned.length} violaciones (${crit.length} críticas+serias)`);
  for (const v of pruned) console.log(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodos)`);
}
await browser.close();

writeFileSync("docs/.axe-raw.json", JSON.stringify(results, null, 2));

let md = `# Auditoría axe-core — F0-a\n\nFecha: ${new Date().toISOString().slice(0, 10)} · Motor: @axe-core/playwright (axe-core embebido) sobre Chrome del sistema, headless · Tags: wcag2a, wcag2aa, wcag21a, wcag21aa\n\n`;
md += `Sesión autenticada como admin@unsa.edu.pe (login vía UI). Fixtures: documento + pedido PENDING creados vía API (scripts/f0-fixtures.mjs).\n\n`;
md += `> Nota de rutas: el plan cita Detalle como \`/d/:id\`, pero la ruta real es \`/p/:type/:id\` (App.tsx). Se auditó \`/p/document/:id\`.\n\n`;
for (const r of results) {
  md += `## ${r.page} (\`${r.path}\`)\n\n`;
  if (!r.violations.length) { md += `Sin violaciones.\n\n`; continue; }
  md += `| Regla | Impacto | Nodos | Ayuda |\n|---|---|---|---|\n`;
  for (const v of r.violations) {
    md += `| ${v.id} | ${v.impact} | ${v.nodes.length} | ${v.help} |\n`;
  }
  md += `\n`;
  for (const v of r.violations) {
    md += `### ${r.page} · ${v.id} (${v.impact})\n\n${v.help} — ${v.helpUrl}\n\n`;
    for (const n of v.nodes.slice(0, 5)) md += `- \`${n.target.join(" ")}\` → \`${n.html}\`\n`;
    md += `\n`;
  }
}
writeFileSync("docs/auditoria-axe.md", md);
console.log("Reporte: docs/auditoria-axe.md");
