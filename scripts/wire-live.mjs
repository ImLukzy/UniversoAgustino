// Conecta el diseño Stitch 1:1 a la API real (listados vacíos + publicar + comprar).
// - Reemplaza tarjetas falsas precargadas por componentes vivos (mismo diseño, datos de Postgres).
// - Calculadora de Monetiza vía POST /monetization/simulate (comisión real 13%).
// - Wizard de Monetiza y modal de Bazar publican de verdad (con login + subida de archivo).
// Idempotente: si ya se aplicó (marca LIVE-PATCH), no toca el archivo.
// Uso: node scripts/wire-live.mjs  (también corre solo al final de migrate-stitch.mjs)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, "..", "apps", "web", "src", "stitch");
const MARK = "/* LIVE-PATCH v1 */";

const load = (f) => fs.readFileSync(path.join(dir, f), "utf8");
const save = (f, s) => fs.writeFileSync(path.join(dir, f), s);
let changed = 0;
function must(cond, msg) {
  if (!cond) throw new Error("wire-live: " + msg);
}
// Reemplaza el div completo (apertura en openIdx hasta su </div> de cierre) por repl.
function replaceDiv(src, openIdx, repl) {
  const innerStart = src.indexOf(">", openIdx) + 1;
  must(innerStart > 0, "div sin cierre de apertura");
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

// ================= MARKETPLACE =================
{
  const f = "MarketplaceStitch.tsx";
  let s = load(f);
  if (!s.includes(MARK)) {
    // 1. imports + estados vivos
    must(s.includes("export function MarketplaceStitch() {"), "market head");
    s = s.replace(
      "export function MarketplaceStitch() {",
      `import { useState } from "react";\nimport { LiveDocuments } from "../live/live";\n${MARK}\nexport function MarketplaceStitch() {\n  const [liveQ, setLiveQ] = useState("");\n  const [liveUni, setLiveUni] = useState("all");\n  const [liveCycle, setLiveCycle] = useState("all");`
    );
    // 2. buscador -> estado vivo
    must(/placeholder="Buscar por tema o[^"]*"/.test(s), "market search");
    s = s.replace(
      /(<input[^>]*placeholder="Buscar por tema o[^"]*")([^>]*\/>)/,
      `$1 value={liveQ} onChange={(e) => setLiveQ(e.target.value)}$2`
    );
    // 3. filtro universidad -> estado vivo
    must(s.includes("Todas las Casas de Estudio"), "market uni");
    s = s.replace(
      /(<select)([^>]*?>)(\s*<option value="all">Todas las Casas de Estudio<\/option>)/,
      `$1 value={liveUni} onChange={(e) => setLiveUni(e.target.value)}$2$3`
    );
    // 4. filtro ciclo -> estado vivo
    must(s.includes("Cualquier Ciclo"), "market cycle");
    s = s.replace(
      /(<select)([^>]*?>)(\s*<option value="all">Cualquier Ciclo)/,
      `$1 value={liveCycle} onChange={(e) => setLiveCycle(e.target.value)}$2$3`
    );
    // 5. texto falso "6 recursos" -> lectura honesta
    s = s.replace("<span>Mostrando 6 recursos verificados</span>", "<span>Recursos verificados de la comunidad</span>");
    // 6. tarjetas falsas -> datos reales (mismo diseño)
    const open = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">';
    const oi = s.indexOf(open);
    must(oi >= 0, "market grid");
    must(s.slice(oi, oi + 400).includes("CARD 1"), "market grid no es el de tarjetas");
    s = replaceDiv(s, oi, `<LiveDocuments q={liveQ} uni={liveUni} cycle={liveCycle} />`);
    save(f, s);
    changed++;
    console.log("MarketplaceStitch: tarjetas falsas -> LiveDocuments (vacío + crear + comprar)");
  } else console.log("MarketplaceStitch: ya parchado, se omite");
}

// ================= BAZAR =================
{
  const f = "BazarStitch.tsx";
  let s = load(f);
  if (!s.includes(MARK)) {
    // 1. imports + estados vivos
    must(s.includes('import { useState } from "react";'), "bazar import");
    s = s.replace(
      'import { useState } from "react";',
      `import { useState } from "react";\nimport { api } from "../lib/api";\nimport { LiveBazarItems } from "../live/live";\n${MARK}`
    );
    must(s.includes('const [modalOpen, setModalOpen] = useState(false);'), "bazar state");
    s = s.replace(
      "const [modalOpen, setModalOpen] = useState(false);",
      `const [modalOpen, setModalOpen] = useState(false);\n  const [liveQ, setLiveQ] = useState("");\n  const [pubMsg, setPubMsg] = useState("");`
    );
    // 2. buscador -> estado vivo
    must(/placeholder="[^"]*autor o marca[^"]*"/.test(s), "bazar search");
    s = s.replace(
      /(<input[^>]*placeholder="[^"]*autor o marca[^"]*")([^>]*\/>)/,
      `$1 value={liveQ} onChange={(e) => setLiveQ(e.target.value)}$2`
    );
    // 3. artículos falsos -> datos reales (respeta filtros Stitch via prop filter)
    const open = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg mb-space-2xl" id="items-grid">';
    const oi = s.indexOf(open);
    must(oi >= 0, "bazar grid");
    must(s.slice(oi, oi + 300).includes("<article"), "bazar grid sin articles");
    s = replaceDiv(s, oi, `<LiveBazarItems filter={filter} q={liveQ} />`);
    // 4. modal publicar: names para FormData
    must(/placeholder="Ej: Manual de Farmacolog[^"]*"/.test(s), "bazar title");
    s = s.replace(/(placeholder="Ej: Manual de Farmacolog[^"]*")/, `$1 name="bTitle"`);
    must(s.includes('placeholder="Ej: 80.00"'), "bazar price");
    s = s.replace('placeholder="Ej: 80.00"', 'placeholder="Ej: 80.00" name="bPrice"');
    must(s.includes("Libros de Referencia"), "bazar kind");
    s = s.replace(/(<select)([^>]*?>)(\s*<option[^>]*>Libros de Referencia<\/option>)/, `$1 name="bKind"$2$3`);
    must(s.includes("Venta Definitiva"), "bazar tx");
    s = s.replace(/(<select)([^>]*?>)(\s*<option[^>]*>Venta Definitiva<\/option>)/, `$1 name="bTx"$2$3`);
    must(s.includes("Hospital Honorio Delgado"), "bazar campus");
    s = s.replace(/(<select)([^>]*?>)(\s*<option[^>]*>[^<]*UNSA Biom[^<]*<\/option>)/, `$1 name="bCampus"$2$3`);
    // 5. submit del modal: publica de verdad (login + POST /bazar)
    const oldSubmit = " onSubmit={(e) => { e.preventDefault(); setModalOpen(false); }}";
    must(s.includes(oldSubmit), "bazar submit");
    s = s.replace(oldSubmit, ` onSubmit={async (e) => {
                  e.preventDefault();
                  setPubMsg("");
                  const token = localStorage.getItem("hub_access");
                  if (!token) { window.location.href = "/login"; return; }
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  const title = String(fd.get("bTitle") ?? "").trim();
                  const priceSoles = Number(String(fd.get("bPrice") ?? "").replace(",", ".")) || 0;
                  const kindIdx = (form.elements.namedItem("bKind") as unknown as HTMLSelectElement | null)?.selectedIndex ?? 0;
                  const txIdx = (form.elements.namedItem("bTx") as unknown as HTMLSelectElement | null)?.selectedIndex ?? 0;
                  const campusSel = form.elements.namedItem("bCampus") as unknown as HTMLSelectElement | null;
                  const campus = campusSel ? campusSel.options[campusSel.selectedIndex]?.text ?? "" : "";
                  try {
                    await api.post("/bazar", {
                      title,
                      kind: (["LIBRO", "INSTRUMENTO", "SCRUB", "INSTRUMENTO"] as const)[kindIdx] ?? "LIBRO",
                      tx: (["VENTA", "ALQUILER", "VENTA"] as const)[txIdx] ?? "VENTA",
                      priceCents: Math.round(priceSoles * 100),
                      description: campus ? ("Entrega: " + campus) : undefined,
                    }, { headers: { Authorization: "Bearer " + token } });
                    setModalOpen(false);
                    window.location.reload();
                  } catch (err) {
                    const m = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "error de red";
                    setPubMsg("No se pudo publicar: " + m);
                  }
                }}`);
    // 6. muestra error de publicación dentro del modal
    const mi = s.indexOf('id="publish-modal"');
    must(mi >= 0, "bazar modal");
    const fi = s.indexOf("<form", mi);
    must(fi >= 0 && fi - mi < 3000, "bazar form");
    s = s.slice(0, fi) + `{pubMsg && (<p className="mx-4 mb-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{pubMsg}</p>)}` + s.slice(fi);
    save(f, s);
    changed++;
    console.log("BazarStitch: artículos falsos -> LiveBazarItems + modal publica de verdad");
  } else console.log("BazarStitch: ya parchado, se omite");
}

// ================= MONETIZA =================
{
  const f = "MonetizaStitch.tsx";
  let s = load(f);
  if (!s.includes(MARK)) {
    // 1. imports + API URL + simulación real
    must(s.includes('import { useState } from "react";'), "monetiza import");
    s = s.replace(
      'import { useState } from "react";',
      `import { useEffect, useState } from "react";\n${MARK}`
    );
    const calcBlock = `  const gross = price * sales;
  const fee = resType === "digital" ? gross * 0.18 : 5 * sales;
  const net = resType === "digital" ? gross * 0.82 : Math.max(0, gross - fee);`;
    must(s.includes(calcBlock), "monetiza calc");
    s = s.replace(calcBlock, `  const API_URL = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL ?? "http://localhost:4000/api/v1") as string;
  const [sim, setSim] = useState<{ gross: number; fee: number; net: number } | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(API_URL + "/monetization/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avgPrice: price, salesPerMonth: sales, bazarExtra: 0, feePct: 13 }) });
        const j = await r.json();
        if (alive && j?.data) setSim(j.data);
      } catch { /* sin conexión: conserva último valor */ }
    })();
    return () => { alive = false; };
  }, [price, sales]);
  const simNet = sim?.net ?? 0;`);
    // 2. métricas -> resultado API (sin ganancias predeterminadas)
    s = s.replace("{pen2(gross)}</span>", `{sim ? pen2(sim.gross) : "S/ …"}</span>`);
    s = s.replace("{`- ${pen2(fee)}`}</span>", `{sim ? \`- \${pen2(sim.fee)}\` : "…"}</span>`);
    s = s.replace("{pen2(net)}</div>", `{sim ? pen2(sim.net) : "S/ …"}</div>`);
    s = s.replace("{pen2(net)}</span>", `{sim ? pen2(sim.net) : "S/ …"}</span>`);
    s = s.replace("ganas S/ ${net.toFixed(2)} netos directos a tu Yape", "ganas S/ ${simNet.toFixed(2)} netos directos a tu Yape");
    s = s.replace("recibes S/ ${net.toFixed(2)} netos.", "recibes S/ ${simNet.toFixed(2)} netos.");
    s = s.replace("net < 250", "simNet < 250").replace("net < 600", "simNet < 600");
    // 3. textos de comisión honestos (backend cobra 13%)
    s = s.replace("Comisión Plataforma (18%):", "Comisión Plataforma (13%):");
    s = s.replace("`Tarifa Bazar Fijo (S/ 5.00 x ${sales}):`", "`Comisión Bazar (13% x ${sales} ventas):`");
    s = s.replace("Se deduce una tasa del 18% para cubrir", "Se deduce una comisión del 13% para cubrir");
    s = s.replace(/Tarifa plana[^.]*?S\/ 5\.00[^.]*?vendido/, "Comisión del 13% por artículo vendido");
    // 4. precio del wizard editable (estaba fijo en 10)
    must(s.includes('required type="number" value="10"'), "monetiza price");
    s = s.replace('required type="number" value="10"', 'required type="number" defaultValue={10} name="wPrice"');
    // 5. names del wizard para publicar de verdad
    must(/placeholder="Ej\. Fichas PAE Pedi[^"]*"/.test(s), "wiz title");
    s = s.replace(/(placeholder="Ej\. Fichas PAE Pedi[^"]*")/, `$1 name="wTitle"`);
    must(/placeholder="Ej\. Farmacolog[^"]*"/.test(s), "wiz course");
    s = s.replace(/(placeholder="Ej\. Farmacolog[^"]*")/, `$1 name="wCourse"`);
    must(s.includes("UNSA - Fac. Enfermer"), "wiz uni");
    s = s.replace(/(<select)([^>]*?>)(\s*<option value="unsa">UNSA - Fac\. Enfermer)/, `$1 name="wUni"$2$3`);
    must(s.includes("3er Ciclo"), "wiz cycle");
    s = s.replace(/(<select)([^>]*?>)(\s*<option>3er Ciclo)/, `$1 name="wCycle"$2$3`);
    // 6. archivo de prueba falso -> input real
    must(s.includes("12.4 MB"), "wiz chip");
    {
      const start = s.indexOf('<div className="mt-space-md px-space-md py-space-xs rounded-lg bg-surface-container-lowest');
      must(start >= 0, "wiz chip div");
      const mb = s.indexOf("12.4 MB", start);
      const end = s.indexOf("</div>", mb) + 6;
      s = s.slice(0, start) + `<div className="mt-space-md"><input type="file" name="wFile" accept=".pdf,.jpg,.jpeg,.png" className="w-full font-body-sm text-body-sm text-on-surface-variant" /></div>` + s.slice(end);
    }
    // 7. estado de error + submit publica de verdad (login + upload + POST /documents)
    must(s.includes("const [yapeOk, setYapeOk] = useState(false);"), "wiz state");
    s = s.replace(
      "const [yapeOk, setYapeOk] = useState(false);",
      `const [yapeOk, setYapeOk] = useState(false);\n  const [pubErr, setPubErr] = useState("");`
    );
    must(s.includes('{showAlert && (<p className="'), "wiz alert");
    s = s.replace(
      '{showAlert && (<p className="',
      `{pubErr && (<p className="p-space-sm rounded-lg bg-error-container text-on-error-container font-label-md text-label-md">{pubErr}</p>)}{showAlert && (<p className="`
    );
    const oldWiz = "onSubmit={(e) => { e.preventDefault(); if (!legalOk || !yapeOk) { setShowAlert(true); return; } setShowAlert(false); setSubmitted(true); }}";
    must(s.includes(oldWiz), "wiz submit");
    s = s.replace(oldWiz, `onSubmit={async (e) => {
                    e.preventDefault();
                    if (!legalOk || !yapeOk) { setShowAlert(true); return; }
                    setShowAlert(false);
                    setPubErr("");
                    const token = localStorage.getItem("hub_access");
                    if (!token) { window.location.href = "/login"; return; }
                    try {
                      const fd = new FormData(e.currentTarget);
                      const title = String(fd.get("wTitle") ?? "").trim();
                      const course = String(fd.get("wCourse") ?? "").trim();
                      const priceSoles = Number(String(fd.get("wPrice") ?? "10").replace(",", ".")) || 10;
                      const uniRaw = String(fd.get("wUni") ?? "ucsm");
                      const university = uniRaw === "unsa" ? "UNSA" : uniRaw === "ucsm" ? "UCSM" : "OTRA";
                      const cycleRaw = String(fd.get("wCycle") ?? "");
                      const cycleMap: Record<string, string> = { "3er": "III", "4to": "IV", "5to": "V", "6to": "VI", "7mo": "VII", "8vo": "VIII", "9no": "IX" };
                      const cycle = cycleMap[Object.keys(cycleMap).find((k) => cycleRaw.startsWith(k)) ?? ""] ?? "VIII";
                      let fileUrl: string | undefined;
                      const wf = fd.get("wFile");
                      if (wf && wf instanceof File && wf.size > 0) {
                        const up = new FormData();
                        up.append("file", wf);
                        const ur = await fetch(API_URL + "/uploads", { method: "POST", headers: { Authorization: "Bearer " + token }, body: up });
                        const uj = await ur.json();
                        if (!ur.ok) throw new Error(uj?.error?.message ?? "Subida fallida");
                        fileUrl = API_URL.replace(/\\/api\\/v1$/, "") + uj.data.url;
                      }
                      const cr = await fetch(API_URL + "/documents", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ title, course, university, cycle, type: "APUNTE", priceCents: Math.round(priceSoles * 100), fileUrl, description: "Publicado desde el asistente de Monetiza." }) });
                      const cj = await cr.json();
                      if (!cr.ok) throw new Error(cj?.error?.message ?? "No se pudo publicar");
                      setSubmitted(true);
                    } catch (err) {
                      setPubErr(err instanceof Error ? err.message : "No se pudo publicar");
                    }
                  }}`);
    save(f, s);
    changed++;
    console.log("MonetizaStitch: calculadora API 13% + wizard publica de verdad");
  } else console.log("MonetizaStitch: ya parchado, se omite");
}

console.log(changed === 0 ? "wire-live: todo ya parchado" : `wire-live: ${changed} archivo(s) parchados`);
