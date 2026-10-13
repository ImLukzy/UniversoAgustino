import process from "node:process";
import { chromium } from "playwright";
import { check, WEB } from "./helper.mjs";

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
  globalThis.console.log("✓ landing: secciones diferidas cargan en escritorio y móvil");
} finally { await browser.close(); }
