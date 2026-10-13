import process from "node:process";
import { strict as assert } from "node:assert";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

export const API = process.env.E2E_API_URL || "http://localhost:4300/api/v1";
export const WEB = process.env.E2E_WEB_URL || "http://localhost:4373";
export const creds = (name) => ({ email: `qa-${name}@unsa.edu.pe`, password: process.env.QA_PASSWORD || "QaPrueba2026!" });
export const check = (condition, message) => assert.ok(condition, message);
const sessions = new Map();
async function sessionFor(name) {
  if (!sessions.has(name)) sessions.set(name, (async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.E2E_CHROME || "/usr/bin/google-chrome-stable", args: ["--no-sandbox"] });
    try {
      const context = await browser.newContext();
      const response = await context.request.post(`${API}/auth/login`, { data: creds(name) });
      check(response.ok(), `cookie login QA ${name}: ${response.status()}`);
      const result = await response.json();
      return { access: result.data.access, storageState: await context.storageState() };
    } finally { await browser.close(); }
  })());
  return sessions.get(name);
}

export async function checkIconFont(page) {
  const browser = page.context().browser();
  check(browser, "el navegador debe estar disponible para comprobar la fuente de iconos");
  const context = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  try {
    const iconPage = await context.newPage();
    await iconPage.goto(`${WEB}/explorar`);
    const family = await iconPage.locator(".material-symbols-outlined").first().evaluate((element) => globalThis.getComputedStyle(element).fontFamily);
    check(family.includes("Material Symbols Outlined"), `familia de iconos incorrecta: ${family}`);
  } finally { await context.close(); }
}
export async function api(path, { token, method = "GET", body } = {}) {
  const response = await globalThis.fetch(`${API}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data: data.data, error: data.error };
}
export async function login(name) {
  return (await sessionFor(name)).access;
}
export async function browserFor(name) {
  const session = await sessionFor(name);
  const browser = await chromium.launch({ headless: true, executablePath: process.env.E2E_CHROME || "/usr/bin/google-chrome-stable", args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, storageState: session.storageState });
  return { browser, context, page: await context.newPage() };
}
export async function audit(page) {
  await page.setViewportSize({ width: 375, height: 812 });
  const width = await page.evaluate(() => ({ inner: globalThis.window.innerWidth, scroll: globalThis.document.documentElement.scrollWidth }));
  check(width.scroll <= width.inner, `scroll horizontal ${width.scroll}/${width.inner}`);
  // Espera a que terminen las animaciones finitas: axe mide mal el contraste a mitad de un fundido.
  await page.evaluate(() => Promise.race([
    Promise.all(globalThis.document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => null))),
    new Promise((resolve) => globalThis.setTimeout(resolve, 3000)),
  ]));
  const violations = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  check(violations.violations.length === 0, `axe: ${violations.violations.map((item) => item.id).join(", ")}`);
  await page.setViewportSize({ width: 1280, height: 900 });
}
export async function fixture(db) {
  const seller = await db.user.findUniqueOrThrow({ where: { email: creds("vendedor").email } });
  const buyer = await db.user.findUniqueOrThrow({ where: { email: creds("est").email } });
  const doc = await db.document.findUniqueOrThrow({ where: { id: "qa-e2e-document" } });
  const order = await db.order.findFirstOrThrow({ where: { buyerId: buyer.id, itemId: doc.id, itemType: "document" } });
  return { seller, buyer, doc, order };
}
export async function withDatabase(run) {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  try { await run(db); } finally { await db.$disconnect(); }
}
