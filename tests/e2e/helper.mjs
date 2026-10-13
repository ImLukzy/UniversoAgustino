import process from "node:process";
import { strict as assert } from "node:assert";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

export const API = process.env.E2E_API_URL || "http://localhost:4300/api/v1";
export const WEB = process.env.E2E_WEB_URL || "http://localhost:4373";
export const creds = (name) => ({ email: `qa-${name}@unsa.edu.pe`, password: process.env.QA_PASSWORD || "QaPrueba2026!" });
export const check = (condition, message) => assert.ok(condition, message);
export async function checkIconFont(page) {
  await page.goto(`${WEB}/explorar`);
  const family = await page.locator(".material-symbols-outlined").first().evaluate((element) => globalThis.getComputedStyle(element).fontFamily);
  check(family.includes("Material Symbols Outlined"), `familia de iconos incorrecta: ${family}`);
}
export async function api(path, { token, method = "GET", body } = {}) {
  const response = await globalThis.fetch(`${API}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data: data.data, error: data.error };
}
export async function login(name) {
  const result = await api("/auth/login", { method: "POST", body: creds(name) });
  check(result.status === 200, `login QA ${name}: ${result.status}`);
  return result.data.access;
}
export async function browserFor(name) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.E2E_CHROME || "/usr/bin/google-chrome-stable", args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const response = await context.request.post(`${API}/auth/login`, { data: creds(name) });
  check(response.ok(), `cookie login QA ${name}: ${response.status()}`);
  return { browser, context, page: await context.newPage() };
}
export async function audit(page) {
  await page.setViewportSize({ width: 375, height: 812 });
  const width = await page.evaluate(() => ({ inner: globalThis.window.innerWidth, scroll: globalThis.document.documentElement.scrollWidth }));
  check(width.scroll <= width.inner, `scroll horizontal ${width.scroll}/${width.inner}`);
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
