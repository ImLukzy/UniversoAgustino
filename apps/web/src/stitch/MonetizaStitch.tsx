// GENERADO por scripts/migrate-stitch.mjs desde portal_de_monetizaci_n_y_calculadora/code.html (diseño Stitch 1:1).
// La interactividad original (<script> de Stitch) está re-implementada con React (ver wire*).
import { useEffect, useState } from "react";
import { StitchAuth } from "../live/StitchAuth";
import { useCareerTheme } from "../live/careerTheme";
/* LIVE-CAREER v1 */
import { UNSA_CAREERS } from "../data/unsa";
/* LIVE-HEADER v1 */
/* LIVE-PATCH v1 */
export function MonetizaStitch() {
  const { accent } = useCareerTheme();
  const [resType, setResType] = useState("digital");
  const [price, setPrice] = useState(12);
  const [sales, setSales] = useState(45);
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
    simNet < 250
      ? ["Trámites de laboratorio y vacunas de internado", "Juego de tijeras mayo, pinzas de disección y riñonera"]
      : simNet < 600
        ? ["Derecho de matrícula semestral completo", "2 juegos de chaquetas clínicas bordadas"]
        : ["Aporte del 50% al derecho de colegiatura del CEP", "Estetoscopio profesional tipo Littmann Classic III"];
  return (
    <>
<header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-20 max-w-[90rem] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md"><div className="flex items-center gap-space-md"><a className="flex items-center gap-space-sm group" data-path="explorar-marketplace" href="#"><img alt="Wawki Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuvy32rBRIBSNf8odU3lN0kIgy00ey01Mw9NqxSKdRoYVb-n2dEUaARklI6HcxyJwA_sX01pYy0PPbWns91EJy7-eLMIVb9FEOKwxT4eqOEaC3rD_EUKslyLHuVvaRUnkf3EQDjyDAg6LbZSGB0xLJe3AoCW_p9P0F2S62t6p79tzqfzkRV6Mo-mEmAEJXJobIhjg6hIwQKT27PfLKJA-QBWnCXmJtcZ_yjOEK6EJ6ZUIHz1fPfg31"/><div className="flex flex-col"><span style={accent ? { color: accent.color } : undefined} className="font-headline-sm text-headline-sm text-primary tracking-tight">Wawki <span className="text-secondary font-headline-sm text-headline-sm">Arequipa</span></span><span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Comunidad UNSA</span></div></a></div><nav className="hidden xl:flex items-center gap-space-xs" data-active-classes="bg-surface-container-high text-primary font-semibold rounded-lg"><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all" data-path="explorar-marketplace" href="#">Explorar Marketplace</a><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all" data-path="bazar-y-alquiler" href="#">Bazar &amp; Alquiler</a><a style={accent ? { backgroundColor: accent.soft, color: accent.color } : undefined} aria-current="page" className="px-space-md py-space-sm transition-all bg-surface-container-high text-primary font-semibold rounded-lg" data-path="vender-y-monetizar" href="#">Vender &amp; Monetizar</a><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all" data-path="marco-legal-y-etica-academica" href="#">Marco Legal &amp; Ética</a><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all flex items-center gap-space-xs" data-path="membresia-semestral" href="#"><span className="w-2 h-2 rounded-full bg-secondary"></span>Pase Semestral VIP</a></nav><div className="flex items-center gap-space-sm"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container-low rounded-full"><span className="material-symbols-outlined text-tertiary text-title-md">verified</span><span className="font-label-sm text-label-sm text-tertiary font-semibold">Yape / Plin Verificado</span></div><div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-space-sm py-space-xxs"><span className="material-symbols-outlined text-outline text-title-md mr-space-xxs">school</span><select onChange={(e) => { window.location.href = "/?career=" + e.target.value; }} className="bg-transparent font-label-sm text-label-sm text-on-surface font-semibold focus:outline-none cursor-pointer pr-space-xs" defaultValue="all"><option value="all">Todas las carreras</option><option value="ENFERMERIA">Enfermería</option><option value="MEDICINA">Medicina Humana</option><option value="PSICOLOGIA">Psicología</option><option value="BIOLOGIA">Biología</option><option value="DERECHO">Derecho</option><option value="EDUCACION">Educación</option><option value="ADMINISTRACION">Administración</option><option value="CONTABILIDAD">Contabilidad</option><option value="ECONOMIA">Economía</option><option value="ING_SISTEMAS">Ing. de Sistemas</option><option value="ING_CIVIL">Ing. Civil</option><option value="ING_INDUSTRIAL">Ing. Industrial</option><option value="ARQUITECTURA">Arquitectura</option><option value="AGRONOMIA">Agronomía</option><option value="OTRA_UNSA">Otra carrera UNSA</option></select></div><StitchAuth /></div></div></header><main className="w-full pt-20 bg-surface"><div className="flex flex-col w-full">
{/*Banner Contextual Superior con acento periwinkle/clínico*/}
<section className="relative overflow-hidden bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-2xl">
<div className="absolute -right-24 -top-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
<div className="absolute right-1/3 -bottom-20 w-80 h-80 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>
<div className="max-w-container-max mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-xl relative z-10">
<div className="flex-1 max-w-3xl">
<div className="inline-flex items-center gap-space-xs px-space-md py-space-xxs rounded-full bg-primary-container text-on-primary-container mb-space-md shadow-sm">
<span className="material-symbols-outlined text-title-md">payments</span>
<span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">Monetización Académica Responsable</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface leading-tight tracking-tight mb-space-sm">
          Convierte tus noches de estudio y carpetas digitales en <span className="text-primary underline decoration-primary-fixed-dim decoration-4 underline-offset-4">ingresos pasivos</span> para tu colegiatura.
        </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Cientos de estudiantes de la UNSA monetizan sus fichas PAE, tablas farmacológicas y manuales clínicos. Cobro semanal directo a Yape o Plin con total transparencia fiscal y cumplimiento legal.
        </p>
<div className="flex flex-wrap items-center gap-space-md mt-space-lg">
<a className="px-space-lg py-space-sm rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-all shadow-md flex items-center gap-space-xs" href="#simulador">
<span className="material-symbols-outlined text-title-md">calculate</span>
            Calcular Ganancias
          </a>
<a className="px-space-lg py-space-sm rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-all flex items-center gap-space-xs" href="#publicar">
<span className="material-symbols-outlined text-title-md">upload_file</span>
            Subir Material Nuevo
          </a>
</div>
</div>
{/*Métricas en vivo del ecosistema Arequipa*/}
<div className="w-full lg:w-80 grid grid-cols-2 gap-space-sm">
<div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Pagado en 2024</span>
<span className="font-price-tag text-price-tag text-primary mt-space-xxs">S/ 24,850</span>
<span className="font-label-sm text-label-sm text-tertiary flex items-center gap-space-xxs mt-space-xxs">
<span className="material-symbols-outlined text-[16px]">trending_up</span> +34% este ciclo
          </span>
</div>
<div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Creadores Activos</span>
<span className="font-price-tag text-price-tag text-secondary mt-space-xxs">340+</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-xxs">Comunidad UNSA verificada</span>
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
<span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Simulador Financiero Transparente</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xxs">Calcula tu retorno por ciclo formativo</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Conoce el desglose exacto de lo que ingresa a tu billetera sin descuentos ocultos.</p>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
{/*Columna Izquierda: Parámetros del Formulario Dinámico*/}
<div className="lg:col-span-7 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col gap-space-lg">
<div>
<label className="font-title-md text-title-md text-on-surface block mb-space-xs">Tipo de recurso a ofrecer</label>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
<button className={`p-space-md rounded-lg text-left font-label-lg text-label-lg flex items-start gap-space-sm transition-all ${resType === "digital" ? "bg-surface-container text-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"}`} id="btn-type-digital" onClick={() => setResType("digital")} type="button">
<span className="material-symbols-outlined text-headline-sm">description</span>
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-bold">Apunte Digital / PAE</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">PDF, Guías, Esquemas NANDA</span>
</div>
</button>
<button className={`p-space-md rounded-lg text-left font-label-lg text-label-lg flex items-start gap-space-sm transition-all ${resType === "fisico" ? "bg-surface-container text-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"}`} id="btn-type-fisico" onClick={() => setResType("fisico")} type="button">
<span className="material-symbols-outlined text-headline-sm">medical_services</span>
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-bold">Material Clínico Físico</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Bolsos, uniformes, estetoscopios</span>
</div>
</button>
</div>
</div>
{/*Slider 1: Precio por Unidad*/}
<div>
<div className="flex justify-between items-center mb-space-xxs">
<label className="font-title-md text-title-md text-on-surface" htmlFor="price-slider">Precio de venta fijado</label>
<span className="font-price-tag text-price-tag text-primary bg-primary-fixed/20 px-space-sm py-space-xxs rounded-lg" id="price-val-badge">{pen2(price)}</span>
</div>
<input className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer" id="price-slider" max="50" min="5" onChange={(e) => setPrice(parseFloat(e.target.value))} step="1" type="range" value={price}/>
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mt-space-xxs">
<span>S/ 5.00</span>
<span>Precio sugerido: S/ 10 - S/ 15</span>
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
<span>80 (Promedio ciclo UNSA)</span>
<span>200 alumnos</span>
</div>
</div>
{/*Callout aclaratorio comisión*/}
<div className="p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm" id="fee-explanation">{resType === "digital" ? (<>
<span className="material-symbols-outlined text-primary text-title-lg">info</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md font-bold text-on-surface">Modelo de retención para Apuntes Digitales</span>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
              Se deduce una comisión del 13% para cubrir almacenamiento en la nube, verificación antiplagio y pasarela de pagos Yape/Plin sin recargo adicional.
            </p>
</div></>) : (<><span className="material-symbols-outlined text-secondary text-title-lg">local_shipping</span><div className="flex flex-col"><span className="font-label-md text-label-md font-bold text-on-surface">Modelo para Bazar Clínico Físico</span><p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">Comisión del 13% por artículo vendido para coordinar el punto de entrega segura en campus o sedes hospitalarias de Arequipa.</p></div></>)}</div>
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
<span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Asistente de Publicación</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xxs">Publica tus resúmenes y guías en 3 minutos</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Nuestro equipo académico valida el formato y autoría antes de habilitar las ventas automáticas.</p>
</div>
{/*Barra de Pasos / Stepper*/}
<div className="max-w-3xl mx-auto mb-space-xl">
<div className="grid grid-cols-3 gap-space-xs text-center">
<button className={`p-space-sm rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors ${step === 1 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`} id="step-tab-1" onClick={() => setStep(1)} type="button">
<span className="w-6 h-6 rounded-full bg-surface-container-lowest text-primary text-label-sm flex items-center justify-center font-bold">1</span>
<span className="hidden sm:inline">Datos Académicos</span>
</button>
<button className={`p-space-sm rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors ${step === 2 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`} id="step-tab-2" onClick={() => setStep(2)} type="button">
<span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm flex items-center justify-center font-bold">2</span>
<span className="hidden sm:inline">Documento &amp; Muestra</span>
</button>
<button className={`p-space-sm rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors ${step === 3 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`} id="step-tab-3" onClick={() => setStep(3)} type="button">
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
<span className="material-symbols-outlined text-primary">school</span>
              Paso 1: Identificación y Clasificación del Apunte
            </h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Facilita que compañeros de ciclos menores encuentren con precisión tu aporte.</p>
<div>
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Título Descriptivo del Material</label>
<input className="w-full p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:bg-surface-container-low" placeholder="Ej. Fichas PAE Pediátricas con diagnósticos NANDA 2021-2023" name="wTitle" required type="text"/>
<span className="font-body-sm text-body-sm text-on-surface-variant block mt-space-xxs">Sé explícito: incluye el tema central y taxonomía utilizada.</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
<div>
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Carrera UNSA</label>
<select name="wCareer" className="w-full p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:bg-surface-container-low cursor-pointer">
{UNSA_CAREERS.map((c) => (
<option key={c.key} value={c.key}>{c.label} — {c.faculty}</option>
))}
</select>
</div>
<div>
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Asignatura / Módulo</label>
<input className="w-full p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:bg-surface-container-low" placeholder="Ej. Farmacología Clínica II, Cuidados Críticos" name="wCourse" required type="text"/>
</div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
<div>
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Ciclo Académico Correspondiente</label>
<select name="wCycle" className="w-full p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:bg-surface-container-low cursor-pointer">
<option>3er Ciclo (Bases del Cuidado)</option>
<option>4to Ciclo (Proceso de Atención de Enfermería)</option>
<option>5to Ciclo (Adulto y Anciano I)</option>
<option>6to Ciclo (Adulto y Anciano II / Quirúrgica)</option>
<option>7mo Ciclo (Salud de la Mujer y Niño)</option>
<option selected>8vo Ciclo (Enfermería Comunitaria y Pediátrica)</option>
<option>9no - 10mo Ciclo (Internado Clínico Hospitalario)</option>
</select>
</div>
<div>
<label className="block font-label-md text-label-md text-on-surface font-semibold mb-space-xxs">Precio Deseado (Soles PEN)</label>
<input className="w-full p-space-sm bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:bg-surface-container-low" max="50" min="5" required type="number" defaultValue={10} name="wPrice"/>
</div>
</div>
<div className="flex justify-end pt-space-sm">
<button className="px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold flex items-center gap-space-xs shadow-sm" onClick={() => setStep(2)} type="button">
                Continuar a Archivos
                <span className="material-symbols-outlined text-title-md">arrow_forward</span>
</button>
</div>
</div>
{/*PASO 2: Carga de Archivos y Vista Previa de Muestra*/}
<div className={`space-y-space-md ${step === 2 ? "" : "hidden"}`} id="step-content-2">
<h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary">cloud_upload</span>
              Paso 2: Carga de PDF y Muestra Gratuita (Preview)
            </h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Sube tu apunte en PDF. El sistema extraerá automáticamente las páginas que elijas para que los compradores revisen la calidad de tu caligrafía o esquemas.</p>
{/*Zona Drag and Drop*/}
<div className="p-space-xl bg-surface-container-low rounded-xl text-center cursor-pointer hover:bg-surface-container transition-colors flex flex-col items-center justify-center">
<div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-space-sm">
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
                * Las páginas seleccionadas tendrán marca de agua ligera con tu nombre y el logo de Wawki para evitar copias ilegítimas.
              </span>
</div>
<div className="flex justify-between items-center pt-space-sm">
<button className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container-high transition-colors" onClick={() => setStep(1)} type="button">
                ← Volver a Datos
              </button>
<button className="px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold flex items-center gap-space-xs shadow-sm" onClick={() => setStep(3)} type="button">
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
<p className="font-body-sm text-body-sm text-on-surface-variant">Wawki Arequipa promueve el aprendizaje colaborativo legítimo. Todo material debe cumplir la normativa peruana de derechos de autor.</p>
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
                  Certifico bajo juramento que este material es de mi autoría intelectual exclusiva (resúmenes, nemotecnias, esquemas propios), no infringe el Decreto Legislativo 822 (Ley sobre el Derecho de Autor) y autorizo a Wawki a darlo de baja de inmediato si existe un reclamo fundado.
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
<button className="mt-space-md px-space-lg py-space-sm rounded-lg bg-surface-container text-primary font-label-lg text-label-lg font-semibold" onClick={() => window.location.reload()} type="button">
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
<div className="pt-space-md mt-space-md flex items-center gap-space-xs text-primary font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-title-md">schedule</span> Desembolso al instante
        </div>
</div>
<div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-space-sm">
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
<span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Testimonios Universitarios</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xxs">Cómo financian su carrera con Wawki</h2>
</div>
<p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          Estudiantes de los principales hospitales de Arequipa monetizan el esfuerzo invertido en sus guardias y cuadernos de campo.
        </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
{/*Historia 1: Sofía V. (Principal destacada)*/}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden">
<div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none"></div>
<div>
<div className="flex items-center gap-space-sm mb-space-md">
<img className="w-14 h-14 rounded-full object-cover shadow-sm" data-alt="Close-up portrait of a 22-year-old Peruvian female nursing student smiling warmly in turquoise scrubs outside Hospital Honorio Delgado in Arequipa, soft daylight, professional and authentic look" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZCwD3Y-HDNYmPY_OTzM3x-fzGcNltYM1znyxk97K_mlPz3ywK1pMr4mpD2oytOWLaXYyhO-LcTOy1ZIZW53amqJK_sjq0Y9ZrOUEk4_ZP786dqH8uEfkWHxG3sG6AV2k0pew5p8A6WSWKE6QbOviCDZGAFM2esskVkdaLASTFMYLOoyvq-EqtjaQhXV7D_9Epd4qKu32K6bm10DIPczWMhLSGQvEJeWpflMFN8TBxxbaH_IzSW6le"/>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface font-bold">Sofía Valdivia</span>
<span className="font-label-sm text-label-sm text-secondary font-semibold">UNSA · 8vo Ciclo</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Rotación Hospital Goyeneche</span>
</div>
</div>
<div className="p-space-sm bg-primary-fixed/20 rounded-lg mb-space-sm inline-block">
<span className="font-price-tag text-price-tag text-primary">S/ 720.00</span>
<span className="font-label-sm text-label-sm text-on-surface-variant ml-space-xxs">generados en 2 meses</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant italic leading-relaxed">
              "Subí mis <strong>Fichas Nemotécnicas de Pediatría</strong> al terminar el 7mo ciclo. Con las descargas automáticas por Yape pude comprarme mi uniforme completo de internado, estetoscopio Littmann y pagar los derechos del trámite clínico sin pedirle dinero a mi familia."
            </p>
</div>
<div className="pt-space-md mt-space-md flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
<span className="flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-tertiary text-title-sm">verified</span> 84 descargas
            </span>
<span className="font-semibold text-primary">Guía Top Ventas UNSA</span>
</div>
</div>
{/*Historia 2: Renzo M. (UNSA)*/}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col justify-between">
<div>
<div className="flex items-center gap-space-sm mb-space-md">
<img className="w-14 h-14 rounded-full object-cover shadow-sm" data-alt="Portrait of a Peruvian male nursing intern in white clinical uniform in the courtyard of Hospital Carlos Alberto Seguin Escobedo in Arequipa, determined and friendly, natural sunlight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1JaKZ0GZm0nje7P2PfEL5JuH2A0sZ0JxwEVRX2AqbLh1xvOaxd2xYM-vDL0dOqwcxTKsd8-gLnJvrA1Is6niEj1hE8Ncav3r-LGWMlwRTa4b6EX_-YhJCthgklBp2jHUeVbqQ2O01CUm4x7eqa1UNmD6tj8Z_j4i8thnMxL-0RxaQ84M_SM7VAGasJLZPWWv4RhOq0XkMitrdldFvQ9VQN0IpLCqBr6PkS-k1LWm8xa0R6Y0ATZJA"/>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface font-bold">Renzo Mendoza</span>
<span className="font-label-sm text-label-sm text-primary font-semibold">UNSA • 10mo Ciclo</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Rotación EsSalud C.A.S.E.</span>
</div>
</div>
<div className="p-space-sm bg-secondary-fixed/30 rounded-lg mb-space-sm inline-block">
<span className="font-price-tag text-price-tag text-secondary">S/ 1,140.00</span>
<span className="font-label-sm text-label-sm text-on-surface-variant ml-space-xxs">en el semestre 2024-I</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant italic leading-relaxed">
              "En la UNSA los casos clínicos de Farmacología Médica son bastante rigurosos. Organicé un manual con cálculo de dosis y dilución en UCI. A S/ 15 por guía, cubrí mis pasajes diarios al hospital durante todo el semestre."
            </p>
</div>
<div className="pt-space-md mt-space-md flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
<span className="flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-tertiary text-title-sm">verified</span> 95 descargas
            </span>
<span className="font-semibold text-secondary">UNSA Biomédicas</span>
</div>
</div>
{/*Historia 3: Claudia C. (UNSA / Egresada)*/}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col justify-between">
<div>
<div className="flex items-center gap-space-sm mb-space-md">
<img className="w-14 h-14 rounded-full object-cover shadow-sm" data-alt="Portrait of an early career Peruvian female nurse in dark blue clinical scrubs with stethoscope, smiling confidentially indoors in modern medical clinic setting in Arequipa" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMq9S1G0h2knleouP5YCMwBT0wIvY-qHjNgei8cbSv4m78fDZvCVVsOsJX7Y-NMUhUGtYhMIPHEzQTZ_0cfiY17OK1sOldYHmV10qhtGFxiOSJ2-V4mYqkUJLv8Icf4IJjcMAulDWJGU9NfObGJYaE4uwODBUsz4Gc2abFz3viorM4d56A-ugGL6o2lcKgtetZl8p8tB_c9uOzz9UOY5EGz9wmPyuODnV_SW3mTaCjlccrkuYlzXEf"/>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface font-bold">Lic. Claudia Cárdenas</span>
<span className="font-label-sm text-label-sm text-tertiary font-semibold">Egresada San Pablo</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Colegiada CEP N° 98124</span>
</div>
</div>
<div className="p-space-sm bg-tertiary-fixed/40 rounded-lg mb-space-sm inline-block">
<span className="font-price-tag text-price-tag text-tertiary">S/ 480.00 / mes</span>
<span className="font-label-sm text-label-sm text-on-surface-variant ml-space-xxs">ingresos pasivos</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant italic leading-relaxed">
              "Incluso después de titularme mis guías de preparación para el ENAE (Examen Nacional de Enfermería) siguen vendiéndose solas a las promociones que vienen atrás. Es el mejor retorno por el esfuerzo que ya hice estudiando."
            </p>
</div>
<div className="pt-space-md mt-space-md flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
<span className="flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-tertiary text-title-sm">verified</span> 120 descargas
            </span>
<span className="font-semibold text-tertiary">Módulo ENAE 2024</span>
</div>
</div>
</div>
</div>
</section>
{/*SECCIÓN FINAL: Call to Action de Colegiatura*/}
<section className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-3xl">
<div className="bg-primary text-on-primary p-space-xl md:p-space-2xl rounded-xl shadow-xl flex flex-col lg:flex-row items-center justify-between gap-space-xl relative overflow-hidden">
<div className="absolute -left-12 -bottom-12 w-64 h-64 bg-primary-container rounded-full blur-2xl pointer-events-none"></div>
<div className="max-w-2xl relative z-10">
<span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-bold">Financia tu futuro título</span>
<h2 className="font-headline-lg text-headline-lg text-white mt-space-xxs">La colegiatura en el CEP Arequipa bordea los S/ 1,800.</h2>
<p className="font-body-md text-body-md text-surface-container-low mt-space-xs leading-relaxed">
          Comienza a generar el fondo hoy con tus apuntes de semestres cursados. Publicar un recurso toma menos de 5 minutos y el cobro se deposita directamente a tu billetera personal.
        </p>
</div>
<div className="flex flex-col sm:flex-row items-center gap-space-sm relative z-10 w-full sm:w-auto">
<a className="w-full sm:w-auto px-space-xl py-space-md rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg font-bold text-center hover:bg-surface transition-colors shadow-md" href="#publicar">
          Subir mi primer apunte ahora
        </a>
<a className="w-full sm:w-auto px-space-lg py-space-md rounded-lg bg-primary-container text-on-primary-container font-label-lg text-label-lg font-semibold text-center hover:bg-opacity-90 transition-colors" href="#simulador">
          Revisar calculadora
        </a>
</div>
</div>
</section>
</div>
{/*Lógica Interactiva Vanilla JS (Calculadora y Wizard de Pasos)*/}
</main><footer className="w-full bg-surface-container-low mt-space-3xl py-space-2xl"><div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl pb-space-xl"><div className="flex flex-col gap-space-sm"><div className="flex items-center gap-space-xs"><span className="font-headline-sm text-headline-sm text-primary">Wawki</span><span className="font-label-sm text-label-sm bg-surface-container-high text-secondary px-space-sm py-space-xxs rounded-full font-semibold">Arequipa</span></div><p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Plataforma académica y red cooperativa de estudiantes de la UNSA Arequipa. Intercambio responsable y fiscalizado.</p><div className="flex flex-wrap gap-space-xs pt-space-xs"><span className="font-label-sm text-label-sm px-space-sm py-space-xxs bg-surface-container text-on-surface-variant rounded-full">Sede Honorio Delgado</span><span className="font-label-sm text-label-sm px-space-sm py-space-xxs bg-surface-container text-on-surface-variant rounded-full">Sede Goyeneche</span></div></div><div className="flex flex-col gap-space-xs"><span className="font-title-md text-title-md text-on-surface font-semibold">Red Hospitalaria &amp; Campus</span><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="explorar-marketplace" href="#">UNSA Área Biomédicas (Av. Alcides Carrión)</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="explorar-marketplace" href="#">EsSalud Seguín Escobedo Rotaciones</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="explorar-marketplace" href="#">Puntos de Entrega Segura en Hospitales</a></div><div className="flex flex-col gap-space-xs"><span className="font-title-md text-title-md text-on-surface font-semibold">Soporte Estudiantil</span><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="vender-y-monetizar" href="#">Calculadora de Comisiones (15%-20%)</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="vender-y-monetizar" href="#">Billeteras Yape &amp; Plin Estudiantes</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="membresia-semestral" href="#">Pase VIP S/ 15.00 por Ciclo</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="soporte-guardias" href="#">Centro de Ayuda en Guardias</a></div><div className="flex flex-col gap-space-xs"><span className="font-title-md text-title-md text-on-surface font-semibold">Marco Regulatorio</span><div className="p-space-sm bg-surface-container rounded-lg"><div className="flex items-center gap-space-xxs text-tertiary mb-space-xxs"><span className="material-symbols-outlined text-title-sm">gavel</span><span className="font-label-sm text-label-sm font-bold">D.L. 822 Cumplimiento</span></div><p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-snug">Prohibida la comercialización no autorizada de material bajo derecho de autor. Solo se admiten resúmenes originales, fichas PAE de elaboración propia y guías elaboradas por pares.</p></div><a className="font-label-sm text-label-sm text-primary font-semibold hover:underline mt-space-xs" data-path="marco-legal-y-etica-academica" href="#">Ver Normativa y Protocolo de Retiro →</a></div></div><div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant"><div className="flex items-center gap-space-sm"><span className="font-label-sm text-label-sm">© 2024 Wawki Arequipa. Impulsado por estudiantes UNSA.</span></div><div className="flex items-center gap-space-md"><a className="font-label-sm text-label-sm hover:text-on-surface" data-path="marco-legal-y-etica-academica" href="#">Términos y Condiciones</a><a className="font-label-sm text-label-sm hover:text-on-surface" data-path="marco-legal-y-etica-academica" href="#">Políticas DL 822</a><a className="font-label-sm text-label-sm hover:text-on-surface" data-path="marco-legal-y-etica-academica" href="#">Protocolo Ética NANDA</a></div></div></div></footer>
    </>
  );
}

/* LIVE-ACCENT v1 */
