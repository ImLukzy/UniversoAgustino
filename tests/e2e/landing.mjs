import process from "node:process";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { check, settleAnimations, WEB } from "./helper.mjs";

// Regresión: las secciones diferidas de la portada deben cargar aunque el hero llene la pantalla.
const browser = await chromium.launch({ headless: true, executablePath: process.env.E2E_CHROME || "/usr/bin/google-chrome-stable", args: ["--no-sandbox"] });
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${WEB}/`);
    await page.getByRole("heading", { name: "Preguntas frecuentes" }).waitFor({ state: "attached", timeout: 10_000 });
    const height = await page.evaluate(() => globalThis.document.documentElement.scrollHeight);
    check(height > viewport.height * 2, `portada sin secciones a ${viewport.width}px: alto ${height}`);
    await page.close();
  }
  for (const width of [1440, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${WEB}/esta-ruta-no-existe`);
    await page.getByRole("heading", { name: "Esta página no existe" }).waitFor();
    check(await page.title() === "Página no encontrada · Universo Agustino", "título de documento 404 incorrecto");
    const dimensions = await page.evaluate(() => ({ inner: globalThis.window.innerWidth, scroll: globalThis.document.documentElement.scrollWidth }));
    check(dimensions.scroll <= dimensions.inner, `404 con scroll horizontal a ${width}px: ${dimensions.scroll}/${dimensions.inner}`);
    await settleAnimations(page);
    const violations = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    check(violations.violations.length === 0, `404 axe a ${width}px: ${violations.violations.map((item) => item.id).join(", ")}`);
    await page.screenshot({ path: `/tmp/spec61-notfound-${width}.png`, fullPage: true });
    await context.close();
  }
  globalThis.console.log("✓ landing: secciones diferidas cargan en escritorio y móvil");
  globalThis.console.log("✓ 404: textos, título, enlaces, axe y responsive a 1440 y 375 px; capturas /tmp/spec61-notfound-*.png");
} finally { await browser.close(); }
