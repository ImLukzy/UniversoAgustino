// Migración Stitch -> React (diseño 1:1).
// Uso: node scripts/migrate-stitch.mjs
// Lee los code.html originales (SOLO LECTURA, nunca los modifica) y genera
// componentes TSX con el markup intacto (mismas clases Tailwind/tokens).
// La interactividad (onclick/oninput/onsubmit) se conserva como
// data-stitch-* para re-cablearla en React manualmente.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const stitchDir = "C:\\Users\\anton\\OneDrive\\Documentos\\Unsa\\stitch_enfermer_ahub_arequipa_marketplace";
const outDir = path.join(root, "apps", "web", "src", "stitch");

const PAGES = [
  { dir: "marketplace_de_apuntes_y_gu_as_pae", component: "MarketplaceStitch" },
  { dir: "bazar_y_alquiler_de_libros_y_scrubs", component: "BazarStitch" },
  { dir: "marco_legal_y_tica_acad_mica_d.l._822", component: "LegalStitch" },
  { dir: "portal_de_monetizaci_n_y_calculadora", component: "MonetizaStitch" },
];

function camel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function styleToJsx(style) {
  const decls = style.split(";").map((d) => d.trim()).filter(Boolean);
  const parts = decls.map((d) => {
    const i = d.indexOf(":");
    const k = d.slice(0, i).trim();
    const v = d.slice(i + 1).trim();
    const key = k.startsWith("--") ? JSON.stringify(k) : camel(k);
    return `${key}: ${JSON.stringify(v)}`;
  });
  return `style={{${parts.join(", ")}}}`;
}

function convertBody(body) {
  let s = body;
  // 1. quitar scripts
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  // 2. comentarios HTML -> JSX
  s = s.replace(/<!--([\s\S]*?)-->/g, (_, c) => `{/*${c.trim()}*/}`);
  // 3. handlers inline -> data-stitch-* (se re-cablean en React)
  s = s.replace(/\son(submit|click|input|change|focus|blur)="([^"]*)"/gi, " data-stitch-on$1=\"$2\"");
  // 4. atributos JSX
  s = s.replace(/\sclass="/g, " className=\"");
  s = s.replace(/\sfor="/g, " htmlFor=\"");
  s = s.replace(/\stabindex="/gi, " tabIndex=\"");
  for (const a of ["stroke-width", "stroke-linecap", "stroke-linejoin", "fill-rule", "clip-rule", "stroke-dasharray", "stroke-dashoffset", "stroke-miterlimit", "stop-color", "font-weight", "font-size"]) {
    s = s.split(a + "=").join(camel(a) + "=");
  }
  // 4b. atributos booleanos selected="" -> selected (JSX)
  s = s.replace(/\s(selected|checked|disabled|readonly|required|multiple|open|hidden|autofocus|autoplay|controls|loop|muted|playsinline)(="")?(?=[\s/>])/gi, " $1");
  s = s.replace(/\s(selected|checked|disabled|readonly|required|multiple|open|hidden)="([a-z]+)"/gi, " $1");
  // 5. style="..." -> style={{...}}
  s = s.replace(/\sstyle="([^"]*)"/g, (_, v) => " " + styleToJsx(v));
  // 6. autocierre de void elements
  s = s.replace(/<(img|input|br|hr|source|meta|link|wbr|embed)((?:"[^"]*"|[^>"'])*)(?<!\/)>/gi, "<$1$2/>");
  return s;
}

// ---- Wiring React (replica la lógica de los <script> originales de Stitch) ----
const USESTATE_IMPORT = 'import { useState } from "react";\n';

function wireBazar(s) {
  s = USESTATE_IMPORT + s.replace(
    "export function BazarStitch() {",
    'export function BazarStitch() {\n  const [filter, setFilter] = useState("all");\n  const [modalOpen, setModalOpen] = useState(false);'
  );
  // Botones de filtro .filter-btn
  s = s.replace(/<button className="filter-btn[^"]*" data-filter="([^"]*)">/g, (_, f) =>
    '<button onClick={() => setFilter("' + f + '")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "' + f + '" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>'
  );
  // Tarjetas del grid #items-grid
  s = s.replace(/<article className="([^"]*)" data-category="([^"]*)">/g, (_, cls, cats) =>
    '<article className="' + cls + '" data-category="' + cats + '" style={{ display: filter === "all" || "' + cats + '".split(" ").includes(filter) ? undefined : "none" }}>'
  );
  // Modal publicar
  s = s.replace(
    'className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm hidden items-center justify-center p-space-md" id="publish-modal"',
    'className={`fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm items-center justify-center p-space-md ${modalOpen ? "flex" : "hidden"}`} id="publish-modal" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}'
  );
  s = s.replace('id="open-publish-modal"', 'id="open-publish-modal" onClick={() => setModalOpen(true)}');
  s = s.replace('id="close-publish-modal"', 'id="close-publish-modal" onClick={() => setModalOpen(false)}');
  s = s.replace('id="cancel-publish-modal"', 'id="cancel-publish-modal" onClick={() => setModalOpen(false)}');
  s = s.replace(/ data-stitch-onsubmit="[^"]*"/, ' onSubmit={(e) => { e.preventDefault(); setModalOpen(false); }}');
  return s;
}

function wireLegal(s) {
  s = USESTATE_IMPORT + s.replace(
    "export function LegalStitch() {",
    "export function LegalStitch() {\n  const [openFaq, setOpenFaq] = useState(-1);"
  );
  let b = -1;
  s = s.replace(/ data-stitch-onclick="toggleFaq\(this\)"/g, () => {
    b++;
    return " onClick={() => setOpenFaq(openFaq === " + b + " ? -1 : " + b + ")}";
  });
  let a = -1;
  s = s.replace(/(<span className="material-symbols-outlined [^"]* icon-arrow">)/g, (m) => {
    a++;
    return m.slice(0, -1) + ' style={{ transform: openFaq === ' + a + ' ? "rotate(180deg)" : "rotate(0deg)" }}>';
  });
  let c = -1;
  s = s.replace(/className="([^"]*) hidden faq-content"/g, (_, cls) => {
    c++;
    return 'className={`' + cls + ' ${openFaq === ' + c + ' ? "" : "hidden"} faq-content`}';
  });
  return s;
}

function wireMonetiza(s) {
  const head =
    'export function MonetizaStitch() {\n' +
    '  const [resType, setResType] = useState("digital");\n' +
    "  const [price, setPrice] = useState(12);\n" +
    "  const [sales, setSales] = useState(45);\n" +
    "  const [step, setStep] = useState(1);\n" +
    "  const [submitted, setSubmitted] = useState(false);\n" +
    "  const [legalOk, setLegalOk] = useState(false);\n" +
    "  const [yapeOk, setYapeOk] = useState(false);\n" +
    "  const [showAlert, setShowAlert] = useState(false);\n" +
    "  const gross = price * sales;\n" +
    '  const fee = resType === "digital" ? gross * 0.18 : 5 * sales;\n' +
    '  const net = resType === "digital" ? gross * 0.82 : Math.max(0, gross - fee);\n' +
    '  const pen2 = (n: number) => "S/ " + n.toFixed(2);\n' +
    "  const equiv: [string, string] =\n" +
    '    net < 250\n' +
    '      ? ["Trámites de laboratorio y vacunas de internado", "Juego de tijeras mayo, pinzas de disección y riñonera"]\n' +
    '      : net < 600\n' +
    '        ? ["Derecho de matrícula semestral completo", "2 juegos de chaquetas clínicas bordadas"]\n' +
    '        : ["Aporte del 50% al derecho de colegiatura del CEP", "Estetoscopio profesional tipo Littmann Classic III"];';
  s = USESTATE_IMPORT + s.replace("export function MonetizaStitch() {", head);
  // Tipo de recurso
  s = s.replace(
    'className="p-space-md rounded-lg text-left bg-surface-container text-primary font-label-lg text-label-lg flex items-start gap-space-sm transition-all shadow-sm" id="btn-type-digital" data-stitch-onclick="setResourceType(\'digital\')"',
    'className={`p-space-md rounded-lg text-left font-label-lg text-label-lg flex items-start gap-space-sm transition-all ${resType === "digital" ? "bg-surface-container text-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"}`} id="btn-type-digital" onClick={() => setResType("digital")}'
  );
  s = s.replace(
    'className="p-space-md rounded-lg text-left bg-surface-container-lowest text-on-surface-variant font-label-lg text-label-lg flex items-start gap-space-sm hover:bg-surface-container-low transition-all" id="btn-type-fisico" data-stitch-onclick="setResourceType(\'fisico\')"',
    'className={`p-space-md rounded-lg text-left font-label-lg text-label-lg flex items-start gap-space-sm transition-all ${resType === "fisico" ? "bg-surface-container text-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"}`} id="btn-type-fisico" onClick={() => setResType("fisico")}'
  );
  // Explicación del fee (antes innerHTML)
  s = s.replace(
    /<div className="p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm" id="fee-explanation">([\s\S]*?)<\/div>\s*<\/div>/,
    (_, digital) =>
      '<div className="p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm" id="fee-explanation">{resType === "digital" ? (<>' +
      digital +
      '</div></>) : (<><span className="material-symbols-outlined text-secondary text-title-lg">local_shipping</span><div className="flex flex-col"><span className="font-label-md text-label-md font-bold text-on-surface">Modelo para Bazar Clínico Físico</span><p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">Tarifa plana única de S/ 5.00 por artículo vendido para coordinar el punto de entrega segura en campus o sedes hospitalarias de Arequipa.</p></div></>)}</div>'
  );
  // Sliders controlados
  s = s.replace(
    'id="price-slider" max="50" min="5" data-stitch-oninput="updateCalculations()" step="1" type="range" value="12"',
    'id="price-slider" max="50" min="5" onChange={(e) => setPrice(parseFloat(e.target.value))} step="1" type="range" value={price}'
  );
  s = s.replace(
    'id="sales-slider" max="200" min="10" data-stitch-oninput="updateCalculations()" step="5" type="range" value="45"',
    'id="sales-slider" max="200" min="10" onChange={(e) => setSales(parseInt(e.target.value))} step="5" type="range" value={sales}'
  );
  // Badges y métricas
  s = s.replace(/(<span[^>]*id="price-val-badge"[^>]*>)[^<]*<\/span>/, "$1{pen2(price)}</span>");
  s = s.replace(/(<span[^>]*id="sales-val-badge"[^>]*>)[^<]*<\/span>/, "$1{`${sales} alumnos`}</span>");
  s = s.replace(/(<div[^>]*id="total-net-earnings"[^>]*>)[^<]*<\/div>/, "$1{pen2(net)}</div>");
  s = s.replace(/(<span[^>]*id="metric-gross"[^>]*>)[^<]*<\/span>/, "$1{pen2(gross)}</span>");
  s = s.replace(/(<span[^>]*id="metric-fee"[^>]*>)[^<]*<\/span>/, "$1{`- ${pen2(fee)}`}</span>");
  s = s.replace(/(<span[^>]*id="metric-net-sub"[^>]*>)[^<]*<\/span>/, "$1{pen2(net)}</span>");
  s = s.replace(
    /(<span[^>]*id="platform-fee-label"[^>]*>)[^<]*<\/span>/,
    '$1{resType === "digital" ? "Comisión Plataforma (18%):" : `Tarifa Bazar Fijo (S/ 5.00 x ${sales}):`}</span>'
  );
  s = s.replace(
    /(<p[^>]*id="projection-narrative"[^>]*>)[\s\S]*?<\/p>/,
    '$1{resType === "digital" ? `Vendiendo ${sales} copias de tu material digital a S/ ${price.toFixed(2)} ganas S/ ${net.toFixed(2)} netos directos a tu Yape.` : `Entregando ${sales} artículos a S/ ${price.toFixed(2)} en hospital recibes S/ ${net.toFixed(2)} netos.`}</p>'
  );
  s = s.replace(/(<span[^>]*id="equip-equiv-1"[^>]*>)[^<]*<\/span>/, "$1{equiv[0]}</span>");
  s = s.replace(/(<span[^>]*id="equip-equiv-2"[^>]*>)[^<]*<\/span>/, "$1{equiv[1]}</span>");
  // Tabs del wizard
  s = s.replace(
    'className="p-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors" id="step-tab-1" data-stitch-onclick="goToStep(1)"',
    'className={`p-space-sm rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors ${step === 1 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`} id="step-tab-1" onClick={() => setStep(1)}'
  );
  for (const n of [2, 3]) {
    s = s.replace(
      'className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors" id="step-tab-' + n + '" data-stitch-onclick="goToStep(' + n + ')"',
      'className={`p-space-sm rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors ${step === ' + n + ' ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`} id="step-tab-' + n + '" onClick={() => setStep(' + n + ')}'
    );
  }
  s = s.replace(/ data-stitch-onclick="goToStep\((\d)\)"/g, " onClick={() => setStep($1)}");
  // Contenidos de pasos
  s = s.replace(
    '<div className="space-y-space-md" id="step-content-1">',
    '<div className={`space-y-space-md ${step === 1 ? "" : "hidden"}`} id="step-content-1">'
  );
  let sc = 1;
  s = s.replace(/<div className="space-y-space-md hidden" id="step-content-\d">/g, (m) => {
    sc++;
    return m.replace('className="space-y-space-md hidden"', 'className={`space-y-space-md ${step === ' + sc + ' ? "" : "hidden"}`}');
  });
  // Checks + submit del wizard
  s = s.replace('id="legal-check" required type="checkbox"', 'id="legal-check" required type="checkbox" checked={legalOk} onChange={(e) => setLegalOk(e.target.checked)}');
  s = s.replace('id="yape-check" required type="checkbox"', 'id="yape-check" required type="checkbox" checked={yapeOk} onChange={(e) => setYapeOk(e.target.checked)}');
  s = s.replace(
    '<form id="upload-wizard-form" data-stitch-onsubmit="handleWizardSubmit(event)">',
    '<form id="upload-wizard-form" className={submitted ? "hidden" : undefined} onSubmit={(e) => { e.preventDefault(); if (!legalOk || !yapeOk) { setShowAlert(true); return; } setShowAlert(false); setSubmitted(true); }}>{showAlert && (<p className="p-space-sm rounded-lg bg-error-container text-on-error-container font-label-md text-label-md">Por favor marca las declaraciones juradas para garantizar el marco legal del material.</p>)}'
  );
  s = s.replace(
    'className="hidden text-center py-space-xl space-y-space-sm" id="upload-success-state"',
    'className={`${submitted ? "" : "hidden"} text-center py-space-xl space-y-space-sm`} id="upload-success-state"'
  );
  s = s.replace('data-stitch-onclick="location.reload()"', "onClick={() => window.location.reload()}");
  return s;
}

function wire(s, name) {
  if (name === "BazarStitch") return wireBazar(s);
  if (name === "LegalStitch") return wireLegal(s);
  if (name === "MonetizaStitch") return wireMonetiza(s);
  return s;
}

// ---- 1. volcar theme.extend para tailwind.config.js ----
{
  const sample = fs.readFileSync(path.join(stitchDir, PAGES[0].dir, "code.html"), "utf8");
  const m = sample.match(/<script id="tailwind-config">([\s\S]*?)<\/script>/);
  const tailwind = {};
  new Function("tailwind", m[1])(tailwind);
  fs.writeFileSync(path.join(here, "stitch-theme.json"), JSON.stringify(tailwind.config.theme.extend, null, 2));
  console.log("theme extend volcado a scripts/stitch-theme.json");
}

// ---- 2. generar componentes ----
fs.mkdirSync(outDir, { recursive: true });
for (const p of PAGES) {
  const html = fs.readFileSync(path.join(stitchDir, p.dir, "code.html"), "utf8");
  const bodyOpen = html.match(/<body[^>]*>/i)[0];
  let inner = html.slice(html.indexOf(bodyOpen) + bodyOpen.length, html.indexOf("</body>"));
  const jsx = convertBody(inner);
  // chequeo de llaves sueltas fuera de atributos (romperían JSX)
  const stripped = jsx.replace(/"[^"]*"/g, '""').replace(/\{fig.*?\}/, "");
  const opens = (stripped.match(/\{/g) || []).length;
  const closes = (stripped.match(/\}/g) || []).length;
  console.log(`${p.component}: body=${inner.length} jsx=${jsx.length} braces={${opens}}/{${closes}}`);
  const code =
    `// GENERADO por scripts/migrate-stitch.mjs desde ${p.dir}/code.html (diseño Stitch 1:1).\n` +
    `// La interactividad original (<script> de Stitch) está re-implementada con React (ver wire*).\n` +
    wire(
      `export function ${p.component}() {\n  return (\n    <>\n${jsx}\n    </>\n  );\n}\n`,
      p.component
    );
  fs.writeFileSync(path.join(outDir, `${p.component}.tsx`), code);
  console.log("  -> apps/web/src/stitch/" + p.component + ".tsx");
}

// Conecta el diseño a la API real (listados vivos, calculadora, publicar).
// Ver scripts/wire-live.mjs — idempotente.
{
  const { execSync } = await import("node:child_process");
  execSync("node scripts/wire-live.mjs", { stdio: "inherit", cwd: path.join(here, "..") });
  execSync("node scripts/wire-header.mjs", { stdio: "inherit", cwd: path.join(here, "..") });
  execSync("node scripts/wire-career.mjs", { stdio: "inherit", cwd: path.join(here, "..") });
  execSync("node scripts/wire-accent.mjs", { stdio: "inherit", cwd: path.join(here, "..") });
}
