// Extrae los iconos usados y mantiene el subset local de Material Symbols.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const webSrc = path.join(root, "apps/web/src");
const dataDir = path.join(webSrc, "data");
const tokenCss = path.join(webSrc, "styles/tokens.css");
const iconFont = path.join(root, "apps/web/public/fonts/material-symbols.woff2");
const subsetMarker = "/* material-symbols-subset:";

const AXES = "opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
const FAMILY = "Material+Symbols+Outlined";

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && (p.endsWith(".tsx") || p.endsWith(".ts"))) out.push(p);
  }
  return out;
}

export function extractIcons() {
  const files = walk(webSrc);
  const direct = new Set();
  const innerQuoted = new Set();
  const iconProp = new Set();
  const iconName = new Set();
  const dataIcons = new Set();

  for (const f of files) {
    if (!f.endsWith(".tsx")) continue;
    const c = fs.readFileSync(f, "utf8");
    const spanRe = /<(?:motion\.)?span[^>]*material-symbols-outlined[^>]*>([\s\S]*?)<\/(?:motion\.)?span>/g;
    let m;
    while ((m = spanRe.exec(c))) {
      const inner = m[1].trim();
      if (/^[a-z0-9_]+$/.test(inner)) direct.add(inner);
      const qre = /["']([a-z0-9_]+)["']/g;
      let q;
      while ((q = qre.exec(inner))) innerQuoted.add(q[1]);
    }
    const ire = /\bicon\s*:\s*["']([a-z0-9_]+)["']/g;
    while ((m = ire.exec(c))) iconProp.add(m[1]);
    const are = /\bicon=["']([a-z0-9_]+)["']/g;
    while ((m = are.exec(c))) iconProp.add(m[1]);
    const nre = /\biconName\s*:\s*["']([a-z0-9_]+)["']/g;
    while ((m = nre.exec(c))) iconName.add(m[1]);
  }

  const navFile = path.join(webSrc, "components/teamPanel/navigation.ts");
  for (const f of files) {
    if (!f.startsWith(dataDir) && f !== navFile) continue;
    const c = fs.readFileSync(f, "utf8");
    let m;
    const ire = /\bicon\s*:\s*["']([a-z0-9_]+)["']/gi;
    while ((m = ire.exec(c))) dataIcons.add(m[1].toLowerCase());
    const vre = /\bvisualIcon\s*:\s*["']([a-z0-9_]+)["']/g;
    while ((m = vre.exec(c))) dataIcons.add(m[1]);
  }

  const all = new Set([...direct, ...innerQuoted, ...iconProp, ...iconName, ...dataIcons]);
  all.delete("FILL");
  return {
    all: [...all].sort(),
    bySource: {
      direct: [...direct].sort(),
      innerQuoted: [...innerQuoted].sort(),
      iconProp: [...iconProp].sort(),
      iconName: [...iconName].sort(),
      data: [...dataIcons].sort(),
    },
  };
}

export function buildUrl(icons) {
  const sorted = [...icons].sort();
  // Nombres ya son URL-safe ([a-z0-9_]); las comas se dejan sin codificar como en
  // el ejemplo oficial &icon_names=home,palette,settings. encodeURIComponent por
  // nombre es no-op pero deja explicito el "url-encoded" de la tarea.
  const list = sorted.map((n) => encodeURIComponent(n)).join(",");
  return `https://fonts.googleapis.com/css2?family=${FAMILY}:${AXES}&icon_names=${list}&display=block`;
}

const args = new Set(process.argv.slice(2));
const { all, bySource } = extractIcons();
const url = buildUrl(all);

if (args.has("--check")) {
  const css = fs.readFileSync(tokenCss, "utf8");
  const iconFace = css.match(/@font-face\s*\{[^}]*\/fonts\/material-symbols\.woff2[^}]*\}/s)?.[0];
  const iconFamily = iconFace?.match(/font-family:\s*["']?([^;"']+)["']?\s*;/)?.[1].trim();
  const iconClass = css.match(/\.material-symbols-outlined\s*\{([^}]*)\}/s)?.[1];
  const classFamily = iconClass?.match(/font-family:\s*["']?([^;"']+)["']?\s*;/)?.[1].trim();
  if (!iconFamily || !classFamily || classFamily !== iconFamily) {
    console.error("subset-icons --check FALLIDO: .material-symbols-outlined debe usar la familia del @font-face local");
    process.exit(1);
  }
  const match = css.match(/\/\* material-symbols-subset: ([^*]+) \*\//);
  const names = match?.[1].split(",").filter(Boolean) ?? [];
  const have = new Set(names);
  const missing = all.filter((n) => !have.has(n));
  if (!match) {
    console.error("subset-icons --check FALLIDO: tokens.css no tiene manifiesto material-symbols-subset");
    process.exit(1);
  }
  if (missing.length > 0) {
    console.error(`subset-icons --check FALLIDO (${missing.length} iconos fuera del subset local):`);
    for (const m of missing) console.error("  FALTA:", m);
    console.error(`Usados: ${all.length} | En subset: ${have.size}`);
    process.exit(1);
  }
  if (!fs.existsSync(iconFont) || fs.statSync(iconFont).size < 1000) {
    console.error("subset-icons --check FALLIDO: falta apps/web/public/fonts/material-symbols.woff2");
    process.exit(1);
  }
  console.log(`subset-icons --check OK (${all.length} iconos cubiertos por el subset local)`);
  process.exit(0);
}

if (args.has("--write")) {
  const cssResponse = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  });
  if (!cssResponse.ok) throw new Error(`Google Fonts CSS respondió ${cssResponse.status}`);
  const css = await cssResponse.text();
  const fontUrl = css.match(/src:\s*url\((https:[^)]+)\)\s*format\('woff2'\)/)?.[1];
  if (!fontUrl) throw new Error("Google Fonts no devolvió el woff2 del subset Material Symbols");
  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) throw new Error(`Material Symbols respondió ${fontResponse.status}`);
  fs.writeFileSync(iconFont, Buffer.from(await fontResponse.arrayBuffer()));
  const tokenText = fs.readFileSync(tokenCss, "utf8");
  const marker = `${subsetMarker} ${all.join(",")} */`;
  const next = /\/\* material-symbols-subset: [^*]+ \*\//.test(tokenText)
    ? tokenText.replace(/\/\* material-symbols-subset: [^*]+ \*\//, marker)
    : `${tokenText.trimEnd()}\n\n${marker}\n`;
  fs.writeFileSync(tokenCss, next);
  console.log(`subset-icons --write OK (woff2 local, ${all.length} iconos)`);
  process.exit(0);
}

// Por defecto: imprime URL + conteo (para docs/followup-f404.md).
console.log(url);
console.error(`iconos: ${all.length} (directos tsx: ${bySource.direct.length}, inner ternarios: ${bySource.innerQuoted.length}, icon: tsx: ${bySource.iconProp.length}, iconName: ${bySource.iconName.length}, data: ${bySource.data.length})`);
