import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// F4-04 paridad subset Material Symbols: falla si un icono usado no esta en el
// subset autohospedado (evita tofu en futuros iconos).
// Extrae lo mismo que scripts/subset-icons.mjs: literales >...< y ternarios
// dentro de <span material-symbols-outlined>, icon:/iconName: en tsx y
// icon:/visualIcon: en src/data (+career). Solo lectura (GET de archivos),
// cero datos de negocio inventados.

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "../..");
const srcRoot = path.join(webRoot, "src");
const dataRoot = path.join(srcRoot, "data");
const tokenCss = path.join(webRoot, "src/styles/tokens.css");
const iconFont = path.join(webRoot, "public/fonts/material-symbols.woff2");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && (p.endsWith(".tsx") || p.endsWith(".ts"))) out.push(p);
  }
  return out;
}

function extractIcons(): string[] {
  const files = walk(srcRoot);
  const all = new Set<string>();
  for (const f of files) {
    if (!f.endsWith(".tsx")) continue;
    const c = fs.readFileSync(f, "utf8");
    const spanRe = /<span[^>]*material-symbols-outlined[^>]*>([\s\S]*?)<\/span>/g;
    let m: RegExpExecArray | null;
    while ((m = spanRe.exec(c))) {
      const inner = m[1].trim();
      if (/^[a-z0-9_]+$/.test(inner)) all.add(inner);
      const qre = /["']([a-z0-9_]+)["']/g;
      let q: RegExpExecArray | null;
      while ((q = qre.exec(inner))) all.add(q[1]);
    }
    const ire = /\bicon\s*:\s*["']([a-z0-9_]+)["']/g;
    while ((m = ire.exec(c))) all.add(m[1]);
    const nre = /\biconName\s*:\s*["']([a-z0-9_]+)["']/g;
    while ((m = nre.exec(c))) all.add(m[1]);
  }
  for (const f of files) {
    if (!f.startsWith(dataRoot)) continue;
    const c = fs.readFileSync(f, "utf8");
    let m: RegExpExecArray | null;
    const ire = /\bicon\s*:\s*["']([a-z0-9_]+)["']/gi;
    while ((m = ire.exec(c))) all.add(m[1].toLowerCase());
    const vre = /\bvisualIcon\s*:\s*["']([a-z0-9_]+)["']/g;
    while ((m = vre.exec(c))) all.add(m[1]);
  }
  all.delete("FILL");
  return [...all].sort();
}

describe("material symbols subset (F4-04)", () => {
  it("el woff2 local cubre todos los iconos en uso (sin tofu)", () => {
    const used = extractIcons();
    // Cordura del extractor (no un mínimo de diseño): si cae a ~0, el regex se rompió.
    expect(used.length).toBeGreaterThan(50);
    const css = fs.readFileSync(tokenCss, "utf8");
    const marker = css.match(/\/\* material-symbols-subset: ([^*]+) \*\//);
    expect(marker, "tokens.css debe registrar el subset local").not.toBeNull();
    const names = marker?.[1].split(",").filter(Boolean) ?? [];
    const have = new Set(names);
    const missing = used.filter((n) => !have.has(n));
    expect(
      missing,
      `Iconos usados fuera del subset local (agrega con scripts/subset-icons.mjs): ${missing.join(", ")}`,
    ).toEqual([]);
    expect(fs.existsSync(iconFont)).toBe(true);
    expect(fs.statSync(iconFont).size).toBeGreaterThan(1000);
  });

  it("el Material Symbols local conserva FILL 0..1 en uso real", () => {
    const css = fs.readFileSync(tokenCss, "utf8");
    expect(css).toMatch(/font-family: "Material Symbols Outlined"/);
    expect(css).toMatch(/font-weight: 100 700/);
    expect(css).toMatch(/font-variation-settings: "FILL" 0/);
    expect(fs.readFileSync(iconFont).byteLength).toBeGreaterThan(1000);
  });
});
