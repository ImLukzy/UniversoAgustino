// F4-04 opcion A: subset de Material Symbols Outlined (3.9 MB -> pocos KB).
// Extrae iconos literales de los tsx + `icon:`/`visualIcon:`/`iconName:` de
// apps/web/src/data/*.ts y data/career/*.ts, y genera la URL css2 de Google Fonts
// con `icon_names=` (parametro oficial para Material Symbols, sucesor del generico
// `text=`; ver https://developers.google.com/fonts/docs/material_symbols :
// "Subset the font ... using the &icon_names query parameter, using an
// alphabetically sorted comma-separated list of icon names").
// Cubre FILL 0..1 porque hay `fontVariationSettings: "'FILL' 1"` en uso real
// (CareerVisual, Bazar, Legal, Explorar).
//
// Uso:
//   node scripts/subset-icons.mjs            -> imprime URL + conteo (exit 0)
//   node scripts/subset-icons.mjs --check    -> exit 1 si un icono usado falta del subset en apps/web/index.html
//   node scripts/subset-icons.mjs --write    -> reescribe solo la linea del href de Material Symbols en index.html
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const webSrc = path.join(root, "apps/web/src");
const dataDir = path.join(webSrc, "data");
const indexHtml = path.join(root, "apps/web/index.html");

// Mismo eje que la linea 11 original: cubre FILL 0..1 (y opsz/wght/GRAD completos
// para no cambiar el look; solo se recorta el set de glifos via icon_names).
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
    // 1) <span|motion.span class="material-symbols-outlined...>literal</span>  (directo)
    // 2) <span ...>{ternario con "literales"}</span> -> todos los quoted del inner
    const spanRe = /<(?:motion\.)?span[^>]*material-symbols-outlined[^>]*>([\s\S]*?)<\/(?:motion\.)?span>/g;
    let m;
    while ((m = spanRe.exec(c))) {
      const inner = m[1].trim();
      if (/^[a-z0-9_]+$/.test(inner)) direct.add(inner);
      const qre = /["']([a-z0-9_]+)["']/g;
      let q;
      while ((q = qre.exec(inner))) innerQuoted.add(q[1]);
    }
    // 3) icon: "..." en tsx (Panel, Pedidos, Cuenta, Legal...)
    //    Excluye clases Tailwind con guiones porque el grupo solo admite [a-z0-9_].
    const ire = /\bicon\s*:\s*["']([a-z0-9_]+)["']/g;
    while ((m = ire.exec(c))) iconProp.add(m[1]);
    // 3b) prop JSX icon="..." (EmptyState, Accordion, tarjetas).
    const are = /\bicon=["']([a-z0-9_]+)["']/g;
    while ((m = are.exec(c))) iconProp.add(m[1]);
    // 4) iconName: "..." (Toast: check_circle, error, info)
    const nre = /\biconName\s*:\s*["']([a-z0-9_]+)["']/g;
    while ((m = nre.exec(c))) iconName.add(m[1]);
  }

  // 5) data/*.ts y data/career/*.ts: icon: "..." + visualIcon: "..."
  //    (Select-String es case-insensitive; aqui cubrimos ambos explicitamente).
  for (const f of files) {
    if (!f.startsWith(dataDir)) continue;
    const c = fs.readFileSync(f, "utf8");
    let m;
    const ire = /\bicon\s*:\s*["']([a-z0-9_]+)["']/gi;
    while ((m = ire.exec(c))) dataIcons.add(m[1].toLowerCase());
    const vre = /\bvisualIcon\s*:\s*["']([a-z0-9_]+)["']/g;
    while ((m = vre.exec(c))) dataIcons.add(m[1]);
  }

  const all = new Set([...direct, ...innerQuoted, ...iconProp, ...iconName, ...dataIcons]);
  // FILTRO: 'FILL' viene de fontVariationSettings, no es icono (solo aparece en
  // atributos, pero se excluye por seguridad si algun regex lo captura).
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

export function parseSubsetFromHtml(html) {
  // Acepta icon_names= (oficial) y text= (legado/generico) para --check.
  const m = html.match(/[?&](icon_names|text)=([^"&'\s]+)/);
  if (!m) return { param: null, names: [] };
  const raw = m[2];
  // text= legacy suele venir %2C-joined o con '+'; icon_names con comas planas.
  const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
  const names = decoded
    .split(/[^a-z0-9_]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { param: m[1], names };
}

const args = new Set(process.argv.slice(2));
const { all, bySource } = extractIcons();
const url = buildUrl(all);

if (args.has("--check")) {
  const html = fs.readFileSync(indexHtml, "utf8");
  const { param, names } = parseSubsetFromHtml(html);
  const have = new Set(names);
  const missing = all.filter((n) => !have.has(n));
  if (!param) {
    console.error("subset-icons --check FALLIDO: index.html no tiene icon_names= ni text=");
    process.exit(1);
  }
  if (missing.length > 0) {
    console.error(`subset-icons --check FALLIDO (${missing.length} iconos fuera del subset [${param}=]):`);
    for (const m of missing) console.error("  FALTA:", m);
    console.error(`Usados: ${all.length} | En subset: ${have.size}`);
    process.exit(1);
  }
  console.log(`subset-icons --check OK (${all.length} iconos cubiertos via ${param}=)`);
  process.exit(0);
}

if (args.has("--write")) {
  const lines = fs.readFileSync(indexHtml, "utf8").split("\n");
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Material+Symbols+Outlined")) {
      idx = i;
      break;
    }
  }
  if (idx === -1) {
    console.error("subset-icons --write FALLIDO: no se encontro la linea de Material Symbols en index.html");
    process.exit(1);
  }
  lines[idx] = `    <link href="${url}" rel="stylesheet" />`;
  fs.writeFileSync(indexHtml, lines.join("\n"));
  console.log(`subset-icons --write OK (linea ${idx + 1}, ${all.length} iconos)`);
  process.exit(0);
}

// Por defecto: imprime URL + conteo (para docs/followup-f404.md).
console.log(url);
console.error(`iconos: ${all.length} (directos tsx: ${bySource.direct.length}, inner ternarios: ${bySource.innerQuoted.length}, icon: tsx: ${bySource.iconProp.length}, iconName: ${bySource.iconName.length}, data: ${bySource.data.length})`);
