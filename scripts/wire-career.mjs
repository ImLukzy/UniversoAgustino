// Filtros y paleta por carrera en el diseño Stitch (sin rediseñar).
// - Header: selector de sedes -> selector de 15 carreras (los 4 Stitch).
// - Marketplace: pills de categoría + pago + Filtrar funcionales,
//   paginación falsa -> real (vive en LiveDocuments), paleta = carrera del perfil.
// Idempotente (marca LIVE-CAREER).
// Uso: node scripts/wire-career.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const stitchDir = path.join(here, "..", "apps", "web", "src", "stitch");
const MARK = "/* LIVE-CAREER v1 */";
const FILES = ["MarketplaceStitch.tsx", "BazarStitch.tsx", "MonetizaStitch.tsx", "LegalStitch.tsx"];

function must(cond, msg) {
  if (!cond) throw new Error("wire-career: " + msg);
}
const load = (f) => fs.readFileSync(path.join(stitchDir, f), "utf8");
const save = (f, s) => fs.writeFileSync(path.join(stitchDir, f), s);
function replaceDiv(src, openIdx, repl) {
  const innerStart = src.indexOf(">", openIdx) + 1;
  must(innerStart > 0, "div sin cierre");
  let i = innerStart;
  let depth = 1;
  while (depth > 0) {
    const o = src.indexOf("<div", i);
    const c = src.indexOf("</div>", i);
    must(c >= 0, "div desbalanceado");
    if (o >= 0 && o < c) { depth++; i = o + 4; } else { depth--; i = c + 6; }
  }
  return src.slice(0, openIdx) + repl + src.slice(i);
}

// Carreras (claves = CareerSchema). Etiquetas con tilde: el archivo es UTF-8.
const CAREERS = [
  ["ENFERMERIA", "Enfermería"],
  ["MEDICINA", "Medicina Humana"],
  ["PSICOLOGIA", "Psicología"],
  ["BIOLOGIA", "Biología"],
  ["DERECHO", "Derecho"],
  ["EDUCACION", "Educación"],
  ["ADMINISTRACION", "Administración"],
  ["CONTABILIDAD", "Contabilidad"],
  ["ECONOMIA", "Economía"],
  ["ING_SISTEMAS", "Ing. de Sistemas"],
  ["ING_CIVIL", "Ing. Civil"],
  ["ING_INDUSTRIAL", "Ing. Industrial"],
  ["ARQUITECTURA", "Arquitectura"],
  ["AGRONOMIA", "Agronomía"],
  ["OTRA_UNSA", "Otra carrera UNSA"],
];
const careerOptions = `<option value="all">Todas las carreras</option>` + CAREERS.map(([k, l]) => `<option value="${k}">${l}</option>`).join("");

// ---------- 1. Header de los 4 Stitch: sedes -> carreras ----------
for (const f of FILES) {
  let s = load(f);
  if (s.includes(MARK)) {
    console.log(`${f}: header ya en carreras, se omite`);
  } else {
    const hi = s.indexOf("<header");
    must(hi >= 0, `${f} header`);
    const he = s.indexOf("</header>", hi);
    let head = s.slice(hi, he);
    // Primer <select> del header -> selector de carreras (tolerante: sedes, modal, etc.)
    const selRe = /<select[^>]*>/;
    const sm = selRe.exec(head);
    must(sm, `${f} header select`);
    head =
      head.slice(0, sm.index) +
      `<select onChange={(e) => { window.location.href = "/?career=" + e.target.value; }} className="bg-transparent font-label-sm text-label-sm text-on-surface font-semibold focus:outline-none cursor-pointer pr-space-xs">` +
      head.slice(sm.index + sm[0].length);
    const si = head.indexOf("<select");
    const se = head.indexOf("</select>", si);
    must(se >= 0, `${f} /select`);
    const optIdx = head.indexOf("<option", si);
    must(optIdx >= 0 && optIdx < se, `${f} options`);
    head = head.slice(0, optIdx) + careerOptions + head.slice(se);
    s = s.slice(0, hi) + head + s.slice(he);
    const imp = 'import { StitchAuth } from "../live/StitchAuth";';
    must(s.includes(imp), `${f} import auth`);
    s = s.replace(imp, `${imp}\n${MARK}`);
    save(f, s);
    console.log(`${f}: header con 15 carreras`);
  }
}

// ---------- 2. Marketplace: filtros + paleta + paginación real ----------
{
  const f = "MarketplaceStitch.tsx";
  let s = load(f);
  if (s.includes("/* LIVE-CAREER market */")) {
    console.log(`${f}: filtros ya cableados, se omite`);
  } else {
    // 2a. imports + estados
    must(s.includes('import { useState } from "react";'), "market useState");
    s = s.replace(
      'import { useState } from "react";',
      'import { useEffect, useRef, useState } from "react";\nimport { useAuth } from "../auth/AuthContext";'
    );
    must(s.includes('const [liveCycle, setLiveCycle] = useState("all");'), "market states");
    s = s.replace(
      'const [liveCycle, setLiveCycle] = useState("all");',
      `const [liveCycle, setLiveCycle] = useState("all");\n  const [docType, setDocType] = useState("all");\n  const [payMode, setPayMode] = useState("all");\n  const accentBg = accent?.color ?? "#0d9488";`
    );
    // 2b. paleta inicial = carrera del perfil (si no hay ?career= y el usuario no eligió)
    must(s.includes("const accent = liveCareer"), "market accent");
    s = s.replace(
      "const accent = liveCareer === \"all\" ? null : careerOf(liveCareer);",
      `const accent = liveCareer === "all" ? null : careerOf(liveCareer);
  const { user } = useAuth();
  const appliedProfile = useRef(false);
  useEffect(() => {
    const hasParam = new URLSearchParams(window.location.search).has("career");
    const pc = user?.profile?.career;
    if (!hasParam && !appliedProfile.current && pc && CAREER_KEYS.includes(pc)) {
      appliedProfile.current = true;
      setLiveCareer(pc);
    }
  }, [user]);`
    );
    // 2c. pills de categoría -> filtro real por tipo (Mapas = búsqueda "mapa")
    const pill = (label, active, onClick) =>
      `<button type="button" onClick={() => { ${onClick} }} className={${active} ? "px-space-md py-space-xs rounded-full text-white font-label-md text-label-md font-semibold shadow-sm transition-colors" : "px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors"} style={${active} ? { backgroundColor: accentBg } : undefined}>${label}</button>`;
    const pills = [
      ["Todos los Recursos", 'docType === "all" && liveQ === ""', 'setDocType("all"); setLiveQ("");'],
      ["Fichas de F", 'docType === "APUNTE"', 'setDocType("APUNTE")'],
      ["Supervivencia PAE", 'docType === "PAE"', 'setDocType("PAE")'],
      ["Mapas Anatom", 'liveQ === "mapa"', 'setDocType("all"); setLiveQ("mapa")'],
      ["Simulacros", 'docType === "BALOTARIO"', 'setDocType("BALOTARIO")'],
      ["Plantillas de Valoraci", 'docType === "GUIA"', 'setDocType("GUIA")'],
    ];
    for (const [frag, active, onClick] of pills) {
      const re = new RegExp(`<button[^>]*>\\s*[^<]*${frag}[^<]*<\\/button>`);
      must(re.test(s), `market pill ${frag}`);
      s = s.replace(re, (m) => {
        const label = m.slice(m.indexOf(">") + 1, m.lastIndexOf("<")).trim();
        return pill(label, active, onClick);
      });
    }
    // 2d. pago VIP -> solo gratis (priceCents 0); yape/plin = todos
    must(s.includes("Yape, Plin o Saldo VIP"), "market pay");
    s = s.replace(
      /(<select)([^>]*?>)(\s*<option value="all">Yape, Plin o Saldo VIP<\/option>)/,
      `$1 value={payMode} onChange={(e) => setPayMode(e.target.value)}$2$3`
    );
    // 2e. botón Filtrar -> baja a resultados con el color de la carrera
    must(s.includes("Filtrar"), "market filtrar");
    s = s.replace(
      /(<button className="h-10 px-space-md bg-primary[^"]*")>\s*Filtrar\s*<\/button>/,
      `$1 onClick={() => document.getElementById("recursos")?.scrollIntoView({ behavior: "smooth" })} style={{ backgroundColor: accentBg }}>Filtrar</button>`
    );
    // 2f. LiveDocuments recibe todo + paginación falsa eliminada (vive en LiveDocuments)
    must(s.includes("<LiveDocuments q={liveQ}"), "market live");
    s = s.replace(
      "<LiveDocuments q={liveQ} uni=\"unsa\" cycle={liveCycle} career={liveCareer} />",
      `<LiveDocuments q={liveQ} uni="unsa" cycle={liveCycle} career={liveCareer} docType={docType} payVip={payMode === "vip"} accentColor={accent?.color ?? null} />`
    );
    const pi = s.indexOf("{/*Pagination / Load More*/}");
    must(pi >= 0, "market pager");
    const di = s.indexOf("<div", pi);
    s = replaceDiv(s, di, `{/*Paginación real dentro de LiveDocuments*/}`);
    s += "\n{/* LIVE-CAREER market */}\n";
    save(f, s);
    console.log(`${f}: pills+pago+filtrar+pager real+paleta perfil`);
  }
}

// ---------- 3. Bazar: el campus del MODAL (el parche viejo marcó el del header) ----------
{
  const f = "BazarStitch.tsx";
  let s = load(f);
  const mi = s.indexOf('id="publish-modal"');
  if (mi >= 0 && !/name="bCampus"/.test(s.slice(mi, mi + 12000))) {
    const sel = s.indexOf("<select", mi);
    must(sel >= 0, "bazar modal select");
    const opt = s.indexOf("<option", sel);
    const selEnd = s.indexOf("</select>", sel);
    must(opt >= 0 && opt < selEnd, "bazar modal options");
    s = s.slice(0, sel) + s.slice(sel).replace(/<select/, '<select name="bCampus"');
    save(f, s);
    console.log(`${f}: name="bCampus" movido al modal`);
  } else {
    console.log(`${f}: modal campus OK`);
  }
}

console.log("wire-career OK");
