// GENERADO por scripts/migrate-stitch.mjs desde portal_de_monetizaci_n_y_calculadora/code.html (diseño Stitch 1:1).
// La interactividad original (<script> de Stitch) está re-implementada con React (ver wire*).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StitchHeader } from "../components/StitchHeader";
import { StitchFooter } from "../components/StitchFooter";
import { useCareerTheme } from "../live/careerTheme";
/* LIVE-CAREER v1 */
import { UNSA_CAREERS } from "../data/unsa";
import { careerContent } from "../data/careerContent";
import { CareerAvatar } from "../components/CareerVisual";
/* LIVE-HEADER v1 */
/* LIVE-PATCH v1 */
export function MonetizaStitch() {
  const { accent, career: themeCareer } = useCareerTheme();
  const cc = careerContent(themeCareer);
  const [resType, setResType] = useState("digital");
  // Sugerencias iniciales según tu carrera; se actualizan si cambias el filtro.
  const [price, setPrice] = useState(cc.suggestPrice);
  const [sales, setSales] = useState(cc.suggestSales);
  useEffect(() => {
    setPrice(cc.suggestPrice);
    setSales(cc.suggestSales);
  }, [themeCareer]);
  // Carrera del asistente: arranca con tu filtro y lo sigue si lo cambias.
  const [wCareer, setWCareer] = useState(themeCareer && themeCareer !== "all" ? themeCareer : "ENFERMERIA");
  useEffect(() => {
    if (themeCareer && themeCareer !== "all") setWCareer(themeCareer);
  }, [themeCareer]);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [legalOk, setLegalOk] = useState(false);
  const [yapeOk, setYapeOk] = useState(false);
  const [pubErr, setPubErr] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const API_URL = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL ?? "http://localhost:4000/api/v1") as string;
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
  const simNet = sim?.net ?? 0;
  const pen2 = (n: number) => "S/ " + n.toFixed(2);
  const equiv: [string, string] =
    simNet < 250 ? cc.equivLow : simNet < 600 ? cc.equivMid : cc.equivHigh;
  return (
    <>
<StitchHeader active="monetiza" /><main className="w-full pt-20 bg-surface"><div className="flex flex-col w-full">
{/*Banner Contextual Superior con acento periwinkle/clínico*/}
<section className="relative overflow-hidden bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-2xl">
<div className="absolute -right-24 -top-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
<div className="absolute right-1/3 -bottom-20 w-80 h-80 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>
<div className="max-w-container-max mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-xl relative z-10">
<div className="flex-1 max-w-3xl">
<div className="inline-flex items-center gap-space-xs px-space-md py-space-xxs rounded-full bg-primary-container text-on-primary-container mb-space-md shadow-sm" style={accent ? { backgroundColor: accent.color } : undefined}>
<span className="material-symbols-outlined text-title-md">payments</span>
<span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">Monetización Académica Responsable</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface leading-tight tracking-tight mb-space-sm">
          Convierte tus noches de estudio y carpetas digitales en <span className="text-primary underline decoration-primary-fixed-dim decoration-4 underline-offset-4" style={accent ? { color: accent.color } : undefined}>ingresos pasivos</span> para tu colegiatura.
        </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
          {cc.monetizaDesc}
        </p>
        {accent && (
        <p className="mt-space-xs inline-flex items-center gap-space-xxs px-space-sm py-space-xxs rounded-full text-white font-label-sm text-label-sm font-bold" style={{ backgroundColor: accent.color }}>
          Viendo contenido para {accent.label}
        </p>
        )}
<div className="flex flex-wrap items-center gap-space-md mt-space-lg">
<a className="px-space-lg py-space-sm rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-all shadow-md flex items-center gap-space-xs" href="#simulador" style={accent ? { backgroundColor: accent.color } : undefined}>
<span className="material-symbols-outlined text-title-md">calculate</span>
            Calcular Ganancias
          </a>
<Link className="px-space-lg py-space-sm rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-all flex items-center gap-space-xs" to="/publicar">
<span className="material-symbols-outlined text-title-md">upload_file</span>
            Subir Material Nuevo
          </Link>
</div>
</div>
{/*Métricas en vivo del ecosistema Arequipa*/}
<div className="w-full lg:w-80 grid grid-cols-2 gap-space-sm">
<div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Pagado en 2024</span>
<span className="font-price-tag text-price-tag text-primary mt-space-xxs" style={accent ? { color: accent.color } : undefined}>S/ 24,850</span>
<span className="font-label-sm text-label-sm text-tertiary flex items-center gap-space-xxs mt-space-xxs">
<span className="material-symbols-outlined text-[16px]">trending_up</span> +34% este ciclo
          </span>
</div>
<div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Creadores Activos</span>
<span className="font-price-tag text-price-tag text-secondary mt-space-xxs">340+</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-xxs">Universo Agustino verificado</span>
</div>
<div className="col-span-2 p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-tertiary">bolt</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Desembolso Mínimo</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Instantáneo desde S/ 20.00</span>
</div>
</div>
<span className="px-space-sm py-space-xxs bg-tertiary-fixed text-on-tertiary-fixed rounded-full font-label-sm text-label-sm font-semibold">0% comisión cobro</span>
</div>
</div>
</div>
</section>
{/*SECCIÓN: Calculadora Interactiva de Ganancias y Comisiones*/}
<section className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-3xl" id="simulador">
<div className="flex flex-col mb-space-xl">
<span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider" style={accent ? { color: accent.color } : undefined}>Simulador Financiero Transparente</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xxs">Calcula tu retorno por ciclo formativo</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Conoce el desglose exacto de lo que ingresa a tu billetera sin descuentos ocultos.</p>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
{/*Columna Izquierda: Parámetros del Formulario Dinámico*/}
<div className="lg:col-span-7 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col gap-space-lg">
<div>
<label className="font-title-md text-title-md text-on-surface block mb-space-xs">Tipo de recurso a ofrecer</label>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
<button className={`p-space-md rounded-lg text-left font-label-lg text-label-lg flex items-start gap-space-sm transition-all ${resType === "digital" ? "bg-surface-container text-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"}`} id="btn-type-digital" onClick={() => setResType("digital")} type="button" style={resType === "digital" && accent ? { color: accent.color } : undefined}>
<span className="material-symbols-outlined text-headline-sm">description</span>
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-bold">{cc.resDigitalTitle}</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">{cc.digitalEx}</span>
</div>
</button>
<button className={`p-space-md rounded-lg text-left font-label-lg text-label-lg flex items-start gap-space-sm transition-all ${resType === "fisico" ? "bg-surface-container text-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"}`} id="btn-type-fisico" onClick={() => setResType("fisico")} type="button" style={resType === "fisico" && accent ? { color: accent.color } : undefined}>
<span className="material-symbols-outlined text-headline-sm">medical_services</span>
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-bold">{cc.resFisicoTitle}</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">{cc.fisicoEx}</span>
</div>
</button>
</div>
</div>
{/*Slider 1: Precio por Unidad*/}
<div>
<div className="flex justify-between items-center mb-space-xxs">
<label className="font-title-md text-title-md text-on-surface" htmlFor="price-slider">Precio de venta fijado</label>
<span className="font-price-tag text-price-tag text-primary bg-primary-fixed/20 px-space-sm py-space-xxs rounded-lg" id="price-val-badge" style={accent ? { color: accent.color } : undefined}>{pen2(price)}</span>
</div>
<input className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer" id="price-slider" max="50" min="5" onChange={(e) => setPrice(parseFloat(e.target.value))} step="1" type="range" value={price}/>
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mt-space-xxs">
<span>S/ 5.00</span>
<span>Precio sugerido{accent ? ` · ${accent.label}` : ""}: S/ {cc.suggestPrice}.00</span>
<span>S/ 50.00</span>
</div>
</div>
{/*Slider 2: Volumen de Estudiantes*/}
<div>
<div className="flex justify-between items-center mb-space-xxs">
<label className="font-title-md text-title-md text-on-surface" htmlFor="sales-slider">Alumnos proyectados por semestre</label>
<span className="font-price-tag text-price-tag text-secondary bg-secondary-fixed/30 px-space-sm py-space-xxs rounded-lg" id="sales-val-badge">{`${sales} alumnos`}</span>
</div>
<input className="w-full accent-secondary h-2 bg-surface-container rounded-lg cursor-pointer" id="sales-slider" max="200" min="10" onChange={(e) => setSales(parseInt(e.target.value))} step="5" type="range" value={sales}/>
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mt-space-xxs">
<span>10 alumnos (1 sección)</span>
<span>{cc.suggestSales} (Promedio {accent ? accent.label : "ciclo UNSA"})</span>
<span>200 alumnos</span>
</div>
</div>
{/*Callout aclaratorio comisión*/}
<div className="p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm" id="fee-explanation">{resType === "digital" ? (<>
<span className="material-symbols-outlined text-primary text-title-lg" style={accent ? { color: accent.color } : undefined}>info</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md font-bold text-on-surface">{cc.feeDigitalTitle}</span>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
              Se deduce una comisión del 13% para cubrir almacenamiento en la nube, verificación antiplagio y pasarela de pagos Yape/Plin sin recargo adicional.
            </p>
</div></>) : (<><span className="material-symbols-outlined text-secondary text-title-lg">local_shipping</span><div className="flex flex-col"><span className="font-label-md text-label-md font-bold text-on-surface">{cc.feeFisicoTitle}</span><p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">{cc.feeFisicoBody}</p></div></>)}</div>
</div>
{/*Columna Derecha: Tarjeta de Rentabilidad Desglosada*/}
<div className="lg:col-span-5 flex flex-col gap-space-md">
<div className="bg-inverse-surface text-inverse-on-surface p-space-xl rounded-xl shadow-xl relative overflow-hidden">
<div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/20 rounded-full blur-xl pointer-events-none"></div>
<span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-bold">Tu Retorno Estimado Neto</span>
<div className="my-space-md">
<div className="font-display text-display text-white font-bold" id="total-net-earnings">{sim ? pen2(sim.net) : "S/ …"}</div>
<p className="font-body-sm text-body-sm text-surface-dim mt-space-xxs" id="projection-narrative">{resType === "digital" ? `Vendiendo ${sales} copias de tu material digital a S/ ${price.toFixed(2)} ganas S/ ${simNet.toFixed(2)} netos directos a tu Yape.` : `Entregando ${sales} artículos a S/ ${price.toFixed(2)} en hospital recibes S/ ${simNet.toFixed(2)} netos.`}</p>
</div>
{/*Desglose de Operaciones*/}
<div className="space-y-space-sm bg-inverse-surface/60 p-space-md rounded-lg mb-space-lg backdrop-blur-sm">
<div className="flex justify-between items-center text-surface-dim font-body-sm text-body-sm">
<span>Monto Bruto Total:</span>
<span className="font-title-md text-title-md text-white font-semibold" id="metric-gross">{sim ? pen2(sim.gross) : "S/ …"}</span>
</div>
<div className="flex justify-between items-center text-surface-dim font-body-sm text-body-sm">
<span id="platform-fee-label">{resType === "digital" ? "Comisión Plataforma (13%):" : `Comisión Bazar (13% x ${sales} ventas):`}</span>
<span className="font-title-md text-title-md text-error-container font-semibold" id="metric-fee">{sim ? `- ${pen2(sim.fee)}` : "…"}</span>
</div>
<div className="h-[1px] bg-outline-variant/30 my-space-xs"></div>
<div className="flex justify-between items-center text-white font-title-md text-title-md">
<span className="flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-tertiary-fixed text-title-md">account_balance_wallet</span>
                Ganancia Neta (Yape/Plin):
              </span>
<span className="text-tertiary-fixed font-bold" id="metric-net-sub">{sim ? pen2(sim.net) : "S/ …"}</span>
</div>
</div>
{/*Equivalencia en la vida de un estudiante de Enfermería*/}
<div className="p-space-sm bg-surface-container-low/10 rounded-lg">
<span className="font-label-sm text-label-sm text-primary-fixed block font-semibold mb-space-xxs">¿Qué cubre este monto en Arequipa?</span>
<ul className="font-body-sm text-body-sm text-surface-dim space-y-space-xxs">
<li className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary-fixed text-label-sm">check_circle</span>
<span id="equip-equiv-1">{equiv[0]}</span>
</li>
<li className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary-fixed text-label-sm">check_circle</span>
<span id="equip-equiv-2">{equiv[1]}</span>
</li>
</ul>
</div>
</div>
{/*Banner de Billeteras Locales*/}
<div className="bg-surface-container p-space-md rounded-xl flex items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-headline-sm">
              Y
            </div>
<div className="w-10 h-10 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-headline-sm">
              P
            </div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Integración Arequipa Yape &amp; Plin</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Sin comisiones bancarias interplaza</span>
</div>
</div>
<span className="material-symbols-outlined text-tertiary text-headline-sm">verified_user</span>
</div>
</div>
</div>
</section>
{/*SECCIÓN: Flujo de Subida en 3 Pasos (Wizard)*/}
<section className="bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-3xl" id="publicar">
<div className="max-w-container-max mx-auto">
<div className="text-center max-w-2xl mx-auto mb-space-2xl">
<span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider" style={accent ? { color: accent.color } : undefined}>Asistente de Publicación</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xxs">Publica tus resúmenes y guías en 3 minutos</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Nuestro equipo académico valida el formato y autoría antes de habilitar las ventas automáticas.</p>
</div>
{/*Barra de Pasos / Stepper*/}
<div className="max-w-3xl mx-auto mb-space-xl">
<div className="grid grid-cols-3 gap-space-xs text-center">
<button className={`p-space-sm rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors ${step === 1 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`} id="step-tab-1" onClick={() => setStep(1)} type="button" style={step === 1 && accent ? { backgroundColor: accent.color } : undefined}>
<span className="w-6 h-6 rounded-full bg-surface-container-lowest text-primary text-label-sm flex items-center justify-center font-bold">1</span>
<span className="hidden sm:inline">Datos Académicos</span>
</button>
<button className={`p-space-sm rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors ${step === 2 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`} id="step-tab-2" onClick={() => setStep(2)} type="button" style={step === 2 && accent ? { backgroundColor: accent.color } : undefined}>
<span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm flex items-center justify-center font-bold">2</span>
<span className="hidden sm:inline">Documento &amp; Muestra</span>
</button>
<button className={`p-space-sm rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors ${step === 3 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`} id="step-tab-3" onClick={() => setStep(3)} type="button" style={step === 3 && accent ? { backgroundColor: accent.color } : undefined}>
<span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm flex items-center justify-center font-bold">3</span>
<span className="hidden sm:inline">Ética y Legal</span>
</button>
</div>
</div>
{/*Contenedor de Formularios del Wizard*/}
<div className="max-w-3xl mx-auto bg-surface-container-lowest p-space-xl rounded-xl shadow-md">
<form id="upload-wizard-form" className={submitted ? "hidden" : undefined} onSubmit={async (e) => {
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
                      const university = "UNSA";
                      const careerRaw = String(fd.get("wCareer") ?? "ENFERMERIA");
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
                        fileUrl = API_URL.replace(/\/api\/v1$/, "") + uj.data.url;
                      }
                      const cr = await fetch(API_URL + "/documents", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ title, course, university, career: careerRaw, cycle, type: "APUNTE", priceCents: Math.round(priceSoles * 100), fileUrl, description: "Publicado desde el asistente de Monetiza." }) });
                      const cj = await cr.json();
                      if (!cr.ok) throw new Error(cj?.error?.message ?? "No se pudo publicar");
                      setSubmitted(true);
                    } catch (err) {
                      setPubErr(err instanceof Error ? err.message : "No se pudo publicar");
                    }
                  }}>{pubErr && (<p className="p-space-sm rounded-lg bg-error-container text-on-error-container font-label-md text-label-md">{pubErr}</p>)}{showAlert && (<p className="p-space-sm rounded-lg bg-error-container text-on-error-container font-label-md text-label-md">Por favor marca las declaraciones juradas para garantizar el marco legal del material.</p>)}
{/*PASO 1: Metadatos Académicos*/}
<div className={`space-y-space-md ${step === 1 ? "" : "hidden"}`} id="step-content-1">
<h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary" style={accent ? { color: accent.color } : undefined}>school</span>
              Paso 1: Identificación y Clasificación del Apunte
            </h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Facilita que compañeros de ciclos menores encuentren con precisión tu aporte.</p>
<div>
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Título Descriptivo del Material</label>
<input className="w-full p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:bg-surface-container-low" placeholder={cc.publishTitlePh} name="wTitle" required type="text"/>
<span className="font-body-sm text-body-sm text-on-surface-variant block mt-space-xxs">Sé explícito: incluye el tema central y taxonomía utilizada.</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
<div>
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Carrera UNSA</label>
<select name="wCareer" value={wCareer} onChange={(e) => setWCareer(e.target.value)} className="w-full p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:bg-surface-container-low cursor-pointer">
{UNSA_CAREERS.map((c) => (
<option key={c.key} value={c.key}>{c.label} — {c.faculty}</option>
))}
</select>
</div>
<div>
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Asignatura / Módulo</label>
<input className="w-full p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:bg-surface-container-low" placeholder={cc.publishCoursePh} name="wCourse" required type="text"/>
</div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
<div>
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Ciclo Académico Correspondiente</label>
<select name="wCycle" className="w-full p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:bg-surface-container-low cursor-pointer">
<option>3er Ciclo ({cc.cycleFocus[0]})</option>
<option>4to Ciclo ({cc.cycleFocus[1]})</option>
<option>5to Ciclo ({cc.cycleFocus[2]})</option>
<option>6to Ciclo ({cc.cycleFocus[3]})</option>
<option>7mo Ciclo ({cc.cycleFocus[4]})</option>
<option selected>8vo Ciclo ({cc.cycleFocus[5]})</option>
<option>9no - 10mo Ciclo ({cc.cycleFocus[6]})</option>
</select>
</div>
<div>
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Precio Deseado (Soles PEN)</label>
<input className="w-full p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:bg-surface-container-low" max="50" min="5" required type="number" defaultValue={10} name="wPrice"/>
</div>
</div>
<div className="flex justify-end pt-space-sm">
<button className="px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold flex items-center gap-space-xs shadow-sm" style={accent ? { backgroundColor: accent.color } : undefined} onClick={() => setStep(2)} type="button">
                Continuar a Archivos
                <span className="material-symbols-outlined text-title-md">arrow_forward</span>
</button>
</div>
</div>
{/*PASO 2: Carga de Archivos y Vista Previa de Muestra*/}
<div className={`space-y-space-md ${step === 2 ? "" : "hidden"}`} id="step-content-2">
<h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary" style={accent ? { color: accent.color } : undefined}>cloud_upload</span>
              Paso 2: Carga de PDF y Muestra Gratuita (Preview)
            </h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Sube tu apunte en PDF. El sistema extraerá automáticamente las páginas que elijas para que los compradores revisen la calidad de tu caligrafía o esquemas.</p>
{/*Zona Drag and Drop*/}
<div className="p-space-xl bg-surface-container-low rounded-xl text-center cursor-pointer hover:bg-surface-container transition-colors flex flex-col items-center justify-center">
<div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-space-sm" style={accent ? { backgroundColor: accent.soft, color: accent.color } : undefined}>
<span className="material-symbols-outlined text-display">upload</span>
</div>
<span className="font-title-md text-title-md text-on-surface font-semibold">Arrastra tu PDF aquí o haz clic para explorar</span>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-space-xxs">Solo archivos PDF originales, máximo 45 MB</span>
<div className="mt-space-md"><input type="file" name="wFile" accept=".pdf,.jpg,.jpeg,.png" className="w-full font-body-sm text-body-sm text-on-surface-variant" /></div>
</div>
{/*Selección de 2 páginas de muestra*/}
<div className="bg-surface-container p-space-md rounded-lg">
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Selecciona las 2 páginas públicas de muestra gratuita</label>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mt-space-xs">
<label className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center gap-space-xs cursor-pointer shadow-sm">
<input checked className="accent-primary w-4 h-4" type="checkbox"/>
<span className="font-label-sm text-label-sm text-on-surface">Página 1 (Portada)</span>
</label>
<label className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center gap-space-xs cursor-pointer shadow-sm">
<input checked className="accent-primary w-4 h-4" type="checkbox"/>
<span className="font-label-sm text-label-sm text-on-surface">Página 3 (Ficha PAE)</span>
</label>
<label className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center gap-space-xs cursor-pointer shadow-sm opacity-60">
<input className="accent-primary w-4 h-4" type="checkbox"/>
<span className="font-label-sm text-label-sm text-on-surface">Página 5</span>
</label>
<label className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center gap-space-xs cursor-pointer shadow-sm opacity-60">
<input className="accent-primary w-4 h-4" type="checkbox"/>
<span className="font-label-sm text-label-sm text-on-surface">Página 8</span>
</label>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant block mt-space-xs">
                * Las páginas seleccionadas tendrán marca de agua ligera con tu nombre y el logo de Universo Agustino para evitar copias ilegítimas.
              </span>
</div>
<div className="flex justify-between items-center pt-space-sm">
<button className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container-high transition-colors" onClick={() => setStep(1)} type="button">
                ← Volver a Datos
              </button>
<button className="px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold flex items-center gap-space-xs shadow-sm" style={accent ? { backgroundColor: accent.color } : undefined} onClick={() => setStep(3)} type="button">
                Continuar a Verificación
                <span className="material-symbols-outlined text-title-md">arrow_forward</span>
</button>
</div>
</div>
{/*PASO 3: Declaración Jurada y Ética*/}
<div className={`space-y-space-md ${step === 3 ? "" : "hidden"}`} id="step-content-3">
<h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-space-xs">
<span className="material-symbols-outlined text-tertiary">gavel</span>
              Paso 3: Declaración Jurada de Autoría y Marco Legal
            </h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Universo Agustino promueve el aprendizaje colaborativo legítimo. Todo material debe cumplir la normativa peruana de derechos de autor.</p>
<div className="p-space-md bg-surface-container-high rounded-xl space-y-space-sm">
<div className="flex items-start gap-space-xs text-error">
<span className="material-symbols-outlined text-title-lg">policy</span>
<span className="font-label-md text-label-md font-bold">Prohibiciones Estrictas</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant text-[13px] leading-relaxed">
                No está permitida la venta de fotos directas de exámenes o rúbricas oficiales de docentes, fotocopias de libros comerciales sin autorización (Guyton, Bruner &amp; Suddarth, etc.) ni datos sensibles reales de pacientes internados (cumplimiento Ley de Protección de Datos Personales N° 29733 y código de ética del Colegio de Enfermeros del Perú).
              </p>
</div>
{/*Checkbox Declaración Jurada*/}
<div className="p-space-md bg-surface-container rounded-lg space-y-space-sm">
<label className="flex items-start gap-space-sm cursor-pointer">
<input className="accent-primary w-5 h-5 mt-space-xxs flex-shrink-0" id="legal-check" required type="checkbox" checked={legalOk} onChange={(e) => setLegalOk(e.target.checked)}/>
<span className="font-label-md text-label-md text-on-surface font-semibold leading-snug">
                  Certifico bajo juramento que este material es de mi autoría intelectual exclusiva (resúmenes, nemotecnias, esquemas propios), no infringe el Decreto Legislativo 822 (Ley sobre el Derecho de Autor) y autorizo a Universo Agustino a darlo de baja de inmediato si existe un reclamo fundado.
                </span>
</label>
<label className="flex items-start gap-space-sm cursor-pointer pt-space-xs">
<input className="accent-primary w-5 h-5 mt-space-xxs flex-shrink-0" id="yape-check" required type="checkbox" checked={yapeOk} onChange={(e) => setYapeOk(e.target.checked)}/>
<span className="font-label-md text-label-md text-on-surface leading-snug">
                  Confirmo que mi número de Yape/Plin o cuenta bancaria está a mi nombre como estudiante matriculado o colegiado para recibir los depósitos.
                </span>
</label>
</div>
<div className="flex justify-between items-center pt-space-sm">
<button className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container-high transition-colors" onClick={() => setStep(2)} type="button">
                ← Volver a Documento
              </button>
<button className="px-space-xl py-space-sm rounded-lg bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-lg text-label-lg font-bold flex items-center gap-space-xs shadow-md" type="submit">
<span className="material-symbols-outlined text-title-md">check_circle</span>
                Publicar y Empezar a Recibir Pagos
              </button>
</div>
</div>
</form>
{/*Mensaje de éxito post-envío (oculto por defecto)*/}
<div className={`${submitted ? "" : "hidden"} text-center py-space-xl space-y-space-sm`} id="upload-success-state">
<div className="w-16 h-16 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mx-auto shadow-sm">
<span className="material-symbols-outlined text-display">verified</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">¡Material enviado a revisión rápida!</h4>
<p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            El equipo estudiantil revisará la legibilidad de tu PDF. Recibirás una notificación en menos de 2 horas y tu enlace de cobro de Yape estará activo.
          </p>
<button className="mt-space-md px-space-lg py-space-sm rounded-lg bg-surface-container text-primary font-label-lg text-label-lg font-semibold" onClick={() => window.location.reload()} type="button" style={accent ? { color: accent.color } : undefined}>
            Subir otro recurso
          </button>
</div>
</div>
</div>
</section>
{/*SECCIÓN: Métodos de Cobro y Garantías de Liquidación*/}
<section className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-3xl">
<div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
<div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-space-sm">
<span className="material-symbols-outlined text-headline-md">send_to_mobile</span>
</div>
<h3 className="font-title-lg text-title-lg text-on-surface font-bold">Retiros por Yape &amp; Plin</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
            Sin montos mínimos excesivos. Solicita la liquidación de tu saldo desde <strong>S/ 20.00</strong> y recíbelo en tu número registrado en menos de 15 minutos en horario de 8:00 AM a 10:00 PM.
          </p>
</div>
<div className="pt-space-md mt-space-md flex items-center gap-space-xs text-primary font-label-sm text-label-sm font-semibold" style={accent ? { color: accent.color } : undefined}>
<span className="material-symbols-outlined text-title-md">schedule</span> Desembolso al instante
        </div>
</div>
<div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-space-sm" style={accent ? { backgroundColor: accent.soft, color: accent.color } : undefined}>
<span className="material-symbols-outlined text-headline-md">account_balance</span>
</div>
<h3 className="font-title-lg text-title-lg text-on-surface font-bold">Transferencia BCP &amp; Interbank</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
            Liquidación consolidada y automática cada fin de mes para creadores que generan más de S/ 200.00 mensuales. Recibes un comprobante contable en PDF para tu control tributario.
          </p>
</div>
<div className="pt-space-md mt-space-md flex items-center gap-space-xs text-tertiary font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-title-md">receipt_long</span> Reporte fiscal descargable
        </div>
</div>
<div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center mb-space-sm">
<span className="material-symbols-outlined text-headline-md">security</span>
</div>
<h3 className="font-title-lg text-title-lg text-on-surface font-bold">Protección Antifraude</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
            Los alumnos pagan mediante QR verificado antes de recibir la descarga cifrada. El saldo ingresa a tu bóveda segura y queda disponible de forma irrevocable.
          </p>
</div>
<div className="pt-space-md mt-space-md flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-title-md">lock</span> 100% cobro garantizado
        </div>
</div>
</div>
</section>
{/*SECCIÓN: Historias de Éxito de Estudiantes Reales*/}
<section className="bg-surface-container px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-3xl">
<div className="max-w-container-max mx-auto">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-2xl">
<div>
<span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider" style={accent ? { color: accent.color } : undefined}>Testimonios Universitarios</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xxs">Cómo financian su carrera con Universo Agustino</h2>
</div>
<p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          {cc.testiIntro}
        </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
{/*Historia 1: Sofía V. (Principal destacada)*/}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden">
<div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none"></div>
<div>
<div className="flex items-center gap-space-sm mb-space-md">
<CareerAvatar name={cc.testi[0].name} />
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface font-bold">{cc.testi[0].name}</span>
<span className="font-label-sm text-label-sm font-semibold text-secondary">{cc.testi[0].meta1}</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">{cc.testi[0].meta2}</span>
</div>
</div>
<div className="p-space-sm bg-primary-fixed/20 rounded-lg mb-space-sm inline-block">
<span className="font-price-tag text-price-tag text-primary" style={accent ? { color: accent.color } : undefined}>{cc.testi[0].price}</span>
<span className="font-label-sm text-label-sm text-on-surface-variant ml-space-xxs">{cc.testi[0].priceNote}</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant italic leading-relaxed">
              &ldquo;{cc.testi[0].quote}&rdquo;
            </p>
</div>
<div className="pt-space-md mt-space-md flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
<span className="flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-tertiary text-title-sm">verified</span> {cc.testi[0].downloads}
            </span>
<span className="font-semibold text-primary">{cc.testi[0].tag}</span>
</div>
</div>
{/*Historia 2: Renzo M. (UNSA)*/}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden">
<div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none"></div>
<div>
<div className="flex items-center gap-space-sm mb-space-md">
<CareerAvatar name={cc.testi[1].name} />
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface font-bold">{cc.testi[1].name}</span>
<span className="font-label-sm text-label-sm font-semibold text-primary">{cc.testi[1].meta1}</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">{cc.testi[1].meta2}</span>
</div>
</div>
<div className="p-space-sm bg-secondary-fixed/30 rounded-lg mb-space-sm inline-block">
<span className="font-price-tag text-price-tag text-secondary" style={accent ? { color: accent.color } : undefined}>{cc.testi[1].price}</span>
<span className="font-label-sm text-label-sm text-on-surface-variant ml-space-xxs">{cc.testi[1].priceNote}</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant italic leading-relaxed">
              &ldquo;{cc.testi[1].quote}&rdquo;
            </p>
</div>
<div className="pt-space-md mt-space-md flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
<span className="flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-tertiary text-title-sm">verified</span> {cc.testi[1].downloads}
            </span>
<span className="font-semibold text-secondary">{cc.testi[1].tag}</span>
</div>
</div>
{/*Historia 3: Claudia C. (UNSA / Egresada)*/}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden">
<div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none"></div>
<div>
<div className="flex items-center gap-space-sm mb-space-md">
<CareerAvatar name={cc.testi[2].name} />
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface font-bold">{cc.testi[2].name}</span>
<span className="font-label-sm text-label-sm font-semibold text-tertiary">{cc.testi[2].meta1}</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">{cc.testi[2].meta2}</span>
</div>
</div>
<div className="p-space-sm bg-tertiary-fixed/40 rounded-lg mb-space-sm inline-block">
<span className="font-price-tag text-price-tag text-tertiary" style={accent ? { color: accent.color } : undefined}>{cc.testi[2].price}</span>
<span className="font-label-sm text-label-sm text-on-surface-variant ml-space-xxs">{cc.testi[2].priceNote}</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant italic leading-relaxed">
              &ldquo;{cc.testi[2].quote}&rdquo;
            </p>
</div>
<div className="pt-space-md mt-space-md flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
<span className="flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-tertiary text-title-sm">verified</span> {cc.testi[2].downloads}
            </span>
<span className="font-semibold text-tertiary">{cc.testi[2].tag}</span>
</div>
</div>
</div>
</div>
</section>
{/*SECCIÓN FINAL: Call to Action de Colegiatura*/}
<section className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-3xl">
<div className="bg-primary text-on-primary p-space-xl md:p-space-2xl rounded-xl shadow-xl flex flex-col lg:flex-row items-center justify-between gap-space-xl relative overflow-hidden" style={accent ? { backgroundColor: accent.color } : undefined}>
<div className="absolute -left-12 -bottom-12 w-64 h-64 bg-primary-container rounded-full blur-2xl pointer-events-none" style={accent ? { backgroundColor: accent.soft } : undefined}></div>
<div className="max-w-2xl relative z-10">
<span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-bold">Financia tu futuro título</span>
<h2 className="font-headline-lg text-headline-lg text-white mt-space-xxs">{cc.ctaTitle}</h2>
<p className="font-body-md text-body-md text-surface-container-low mt-space-xs leading-relaxed">
          {cc.ctaBody}
        </p>
</div>
<div className="flex flex-col sm:flex-row items-center gap-space-sm relative z-10 w-full sm:w-auto">
<Link className="w-full sm:w-auto px-space-xl py-space-md rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg font-bold text-center hover:bg-surface transition-colors shadow-md" to="/publicar" style={accent ? { color: accent.color } : undefined}>
          Subir mi primer apunte ahora
        </Link>
<a className="w-full sm:w-auto px-space-lg py-space-md rounded-lg bg-primary-container text-on-primary-container font-label-lg text-label-lg font-semibold text-center hover:bg-opacity-90 transition-colors" href="#simulador" style={accent ? { backgroundColor: accent.soft, color: accent.color } : undefined}>
          Revisar calculadora
        </a>
</div>
</div>
</section>
</div>
{/*Lógica Interactiva Vanilla JS (Calculadora y Wizard de Pasos)*/}
</main><StitchFooter />
    </>
  );
}

/* LIVE-ACCENT v1 */
