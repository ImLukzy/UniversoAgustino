// GENERADO por scripts/migrate-stitch.mjs desde marketplace_de_apuntes_y_gu_as_pae/code.html (diseño Stitch 1:1).
// La interactividad original (<script> de Stitch) está re-implementada con React (ver wire*).
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { LiveDocuments } from "../live/live";
import { StitchAuth } from "../live/StitchAuth";
/* LIVE-CAREER v1 */
import { UNSA_CAREERS } from "../data/unsa";
import { useCareerTheme } from "../live/careerTheme";
/* LIVE-HEADER v1 */
/* LIVE-PATCH v1 */
const CAREER_KEYS = UNSA_CAREERS.map((c) => c.key);
export function MarketplaceStitch() {
  const [liveQ, setLiveQ] = useState("");
  const { career: liveCareer, setCareer: setLiveCareer, accent } = useCareerTheme();
  const [liveCycle, setLiveCycle] = useState("all");
  const [docType, setDocType] = useState("all");
  const [payMode, setPayMode] = useState("all");
  // Personalización automática: la UI toma el color identidad de la carrera filtrada.
  
  const accentBg = accent?.color ?? "#0d9488";

  return (
    <>
<header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-20 max-w-[90rem] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md"><div className="flex items-center gap-space-md"><a className="flex items-center gap-space-sm group" data-path="explorar-marketplace" href="#"><img alt="Wawki Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuvy32rBRIBSNf8odU3lN0kIgy00ey01Mw9NqxSKdRoYVb-n2dEUaARklI6HcxyJwA_sX01pYy0PPbWns91EJy7-eLMIVb9FEOKwxT4eqOEaC3rD_EUKslyLHuVvaRUnkf3EQDjyDAg6LbZSGB0xLJe3AoCW_p9P0F2S62t6p79tzqfzkRV6Mo-mEmAEJXJobIhjg6hIwQKT27PfLKJA-QBWnCXmJtcZ_yjOEK6EJ6ZUIHz1fPfg31"/><div className="flex flex-col"><span style={accent ? { color: accent.color } : undefined} className="font-headline-sm text-headline-sm text-primary tracking-tight">Wawki <span className="text-secondary font-headline-sm text-headline-sm">Arequipa</span></span><span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Comunidad UNSA</span></div></a></div><nav className="hidden xl:flex items-center gap-space-xs" data-active-classes="bg-surface-container-high text-primary font-semibold rounded-lg"><a style={accent ? { backgroundColor: accent.soft, color: accent.color } : undefined} aria-current="page" className="px-space-md py-space-sm transition-all bg-surface-container-high text-primary font-semibold rounded-lg" data-path="explorar-marketplace" href="#">Explorar Marketplace</a><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all" data-path="bazar-y-alquiler" href="#">Bazar &amp; Alquiler</a><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all" data-path="vender-y-monetizar" href="#">Vender &amp; Monetizar</a><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all" data-path="marco-legal-y-etica-academica" href="#">Marco Legal &amp; Ética</a><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all flex items-center gap-space-xs" data-path="membresia-semestral" href="#"><span className="w-2 h-2 rounded-full bg-secondary"></span>Pase Semestral VIP</a></nav><div className="flex items-center gap-space-sm"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container-low rounded-full"><span className="material-symbols-outlined text-tertiary text-title-md">verified</span><span className="font-label-sm text-label-sm text-tertiary font-semibold">Yape / Plin Verificado</span></div><div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-space-sm py-space-xxs"><span className="material-symbols-outlined text-outline text-title-md mr-space-xxs">school</span><select onChange={(e) => { window.location.href = "/?career=" + e.target.value; }} className="bg-transparent font-label-sm text-label-sm text-on-surface font-semibold focus:outline-none cursor-pointer pr-space-xs"><option value="all">Todas las carreras</option><option value="ENFERMERIA">Enfermería</option><option value="MEDICINA">Medicina Humana</option><option value="PSICOLOGIA">Psicología</option><option value="BIOLOGIA">Biología</option><option value="DERECHO">Derecho</option><option value="EDUCACION">Educación</option><option value="ADMINISTRACION">Administración</option><option value="CONTABILIDAD">Contabilidad</option><option value="ECONOMIA">Economía</option><option value="ING_SISTEMAS">Ing. de Sistemas</option><option value="ING_CIVIL">Ing. Civil</option><option value="ING_INDUSTRIAL">Ing. Industrial</option><option value="ARQUITECTURA">Arquitectura</option><option value="AGRONOMIA">Agronomía</option><option value="OTRA_UNSA">Otra carrera UNSA</option></select></div><StitchAuth /></div></div></header><main className="w-full pt-20 bg-surface"><div className="flex flex-col w-full">
{/*Hero Institucional UNSA — rediseño v2*/}
<section className="relative w-full overflow-hidden pt-space-2xl pb-space-2xl text-white" style={{ background: "linear-gradient(135deg,#06272b 0%,#0d383f 48%,#20265f 100%)" }}>
<div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.45) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.45) 1px,transparent 1px)", backgroundSize: "46px 46px", maskImage: "radial-gradient(ellipse 90% 80% at 50% 20%,black 30%,transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 20%,black 30%,transparent 75%)" }}></div>
<div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none" style={{ background: accent ? accent.color : "#14b8a6", opacity: 0.4 }}></div>
<div className="absolute -bottom-36 -left-24 w-[26rem] h-[26rem] rounded-full blur-3xl pointer-events-none" style={{ background: "#6366f1", opacity: 0.4 }}></div>
<div className="relative max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
{/*Hero Copy & Value Prop*/}
<div className="lg:col-span-7 flex flex-col gap-space-md">
<div className="inline-flex items-center gap-space-xs px-space-md py-space-xxs rounded-full w-fit border border-white/25 bg-white/10 backdrop-blur">
<span className="material-symbols-outlined text-emerald-300 text-title-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
<span className="font-label-sm text-label-sm text-white font-bold uppercase tracking-wider">Comunidad exclusiva UNSA · @unsa.edu.pe</span>
</div>
<h1 className="font-display text-white tracking-tight text-balance" style={{ fontSize: "clamp(2rem,4.5vw,3.4rem)", lineHeight: 1.08 }}>
            Apuntes verificados, Guías PAE y Balotarios hechos por estudiantes{" "}
<span className="font-bold" style={{ background: "linear-gradient(90deg,#5eead4,#a5b4fc)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>UNSA</span>.
          </h1>
<p className="text-white/75 max-w-2xl leading-relaxed" style={{ fontSize: "1.05rem" }}>
            Material original validado por egresados y alumnos de décimo ciclo. Protocolos adaptados a Honorio Delgado, Goyeneche y EsSalud Seguín Escobedo. Compra en custodia con Yape o Plin.
          </p>
<div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
<a href="#recursos" className="px-space-lg py-space-sm rounded-xl bg-white font-label-lg text-label-lg font-bold shadow-lg hover:bg-emerald-50 transition-colors flex items-center gap-space-xs" style={{ color: "#07332f" }}>
<span className="material-symbols-outlined text-title-md">explore</span>
              Explorar recursos
            </a>
<a data-path="vender-y-monetizar" href="#" className="px-space-lg py-space-sm rounded-xl border border-white/30 text-white font-label-lg text-label-lg font-semibold hover:bg-white/10 transition-colors flex items-center gap-space-xs">
<span className="material-symbols-outlined text-title-md">payments</span>
              Vender mis apuntes
            </a>
</div>
{/*Stats institucionales*/}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-space-sm">
<div className="p-space-md rounded-2xl flex items-center gap-space-sm border border-white/15 bg-white/10 backdrop-blur">
<div className="w-11 h-11 rounded-xl bg-white/15 text-emerald-200 flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-title-lg">download_done</span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-white font-bold">+1,240</span>
<span className="font-label-sm text-label-sm text-white/70">Descargas este mes</span>
</div>
</div>
<div className="p-space-md rounded-2xl flex items-center gap-space-sm border border-white/15 bg-white/10 backdrop-blur">
<div className="w-11 h-11 rounded-xl bg-white/15 text-violet-200 flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-title-lg">payments</span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-white font-bold">S/ 4,850</span>
<span className="font-label-sm text-label-sm text-white/70">Pagados a tutores pares</span>
</div>
</div>
<div className="p-space-md rounded-2xl flex items-center gap-space-sm border border-white/15 bg-white/10 backdrop-blur">
<div className="w-11 h-11 rounded-xl bg-white/15 text-amber-200 flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-title-lg">verified_user</span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-white font-bold">100% Legal</span>
<span className="font-label-sm text-label-sm text-white/70">D.L. 822 &amp; Ética Académica</span>
</div>
</div>
</div>
</div>
{/*Explorador por carrera*/}
<div className="lg:col-span-5 flex flex-col gap-space-md">
<div className="bg-white text-on-surface p-space-lg rounded-2xl shadow-2xl flex flex-col gap-space-md">
<div className="flex items-center justify-between gap-space-sm">
<div className="flex flex-col">
<span className="font-title-md text-title-md font-bold">Explora por tu carrera</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">15 carreras · una sola comunidad UNSA</span>
</div>
{accent ? (<span className="px-space-sm py-space-xxs rounded-full text-white font-label-sm text-label-sm font-bold whitespace-nowrap" style={{ backgroundColor: accent.color }}>{accent.label}</span>) : (<span className="px-space-sm py-space-xxs rounded-full bg-surface-container font-label-sm text-label-sm font-bold text-on-surface-variant whitespace-nowrap">Todas</span>)}
</div>
<div className="flex flex-wrap gap-space-xs">
<button type="button" onClick={() => setLiveCareer("all")} className="px-space-sm py-space-xs rounded-full font-label-md text-label-md font-semibold transition-all" style={liveCareer === "all" ? { backgroundColor: "#0d9488", color: "#fff" } : { backgroundColor: "#f2f3ff", color: "#3d4947" }}>Todas</button>
{UNSA_CAREERS.map((c) => (
<button key={c.key} type="button" onClick={() => setLiveCareer(c.key)} title={c.faculty} className="px-space-sm py-space-xs rounded-full font-label-md text-label-md font-semibold transition-all flex items-center gap-space-xxs" style={liveCareer === c.key ? { backgroundColor: c.color, color: "#fff", boxShadow: "0 4px 14px rgba(0,0,0,.25)" } : { backgroundColor: "#fff", color: "#3d4947", border: "1.5px solid " + c.color + "55" }}>
<span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }}></span>
{c.label}
</button>
))}
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">El filtro y los acentos de la página toman el color de tu carrera.</p>
</div>
<div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-space-md flex items-center gap-space-md">
<div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-title-lg">badge</span>
</div>
<div className="flex flex-col gap-space-xxs">
<span className="font-label-md text-label-md text-white font-bold">Acceso verificado en 3 pasos</span>
<span className="text-white/70" style={{ fontSize: "0.8rem", lineHeight: 1.45 }}>1. Regístrate con tu @unsa.edu.pe · 2. Filtra por tu carrera · 3. Compra en custodia con Yape o Plin.</span>
</div>
</div>
</div>
</div>
</div>
</section>
{/*Sticky VIP Banner Ribbon*/}
<section className="sticky top-20 z-40 w-full bg-secondary text-on-secondary shadow-md py-space-sm">
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-surface-container-lowest text-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
<span className="material-symbols-outlined text-title-md" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
</div>
<div className="flex flex-col sm:flex-row sm:items-center gap-x-space-sm">
<span className="font-title-md text-title-md font-bold">Pase Semestral VIP por solo S/ 15.00/ciclo</span>
<span className="hidden md:inline font-label-md text-label-md text-secondary-fixed">| Descargas ilimitadas de apuntes básicos + 20% dscto en bazar físico</span>
</div>
</div>
<div className="flex items-center gap-space-xs">
<button className="px-space-md py-space-xxs bg-surface-container-lowest text-secondary font-label-lg text-label-lg rounded-full font-bold shadow hover:bg-surface-container-high transition-all">
          Activar por Yape / Plin
        </button>
</div>
</div>
</section>
{/*Quick Filter Categories Chips*/}
<section className="w-full bg-surface py-space-md overflow-x-auto">
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="flex items-center gap-space-xs whitespace-nowrap overflow-x-auto pb-space-xxs">
<button type="button" onClick={() => { setDocType("all"); setLiveQ(""); }} className={docType === "all" && liveQ === "" ? "px-space-md py-space-xs rounded-full text-white font-label-md text-label-md font-semibold shadow-sm transition-colors" : "px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors"} style={docType === "all" && liveQ === "" ? { backgroundColor: accentBg } : undefined}>Todos los Recursos</button>
<button type="button" onClick={() => { setDocType("APUNTE") }} className={docType === "APUNTE" ? "px-space-md py-space-xs rounded-full text-white font-label-md text-label-md font-semibold shadow-sm transition-colors" : "px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors"} style={docType === "APUNTE" ? { backgroundColor: accentBg } : undefined}>Fichas de Fármacos y Dilución</button>
<button type="button" onClick={() => { setDocType("PAE") }} className={docType === "PAE" ? "px-space-md py-space-xs rounded-full text-white font-label-md text-label-md font-semibold shadow-sm transition-colors" : "px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors"} style={docType === "PAE" ? { backgroundColor: accentBg } : undefined}>Guías de Supervivencia PAE</button>
<button type="button" onClick={() => { setDocType("all"); setLiveQ("mapa") }} className={liveQ === "mapa" ? "px-space-md py-space-xs rounded-full text-white font-label-md text-label-md font-semibold shadow-sm transition-colors" : "px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors"} style={liveQ === "mapa" ? { backgroundColor: accentBg } : undefined}>Mapas Anatomía/Fisio</button>
<button type="button" onClick={() => { setDocType("BALOTARIO") }} className={docType === "BALOTARIO" ? "px-space-md py-space-xs rounded-full text-white font-label-md text-label-md font-semibold shadow-sm transition-colors" : "px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors"} style={docType === "BALOTARIO" ? { backgroundColor: accentBg } : undefined}>Simulacros &amp; Balotarios Propios</button>
<button type="button" onClick={() => { setDocType("GUIA") }} className={docType === "GUIA" ? "px-space-md py-space-xs rounded-full text-white font-label-md text-label-md font-semibold shadow-sm transition-colors" : "px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors"} style={docType === "GUIA" ? { backgroundColor: accentBg } : undefined}>Plantillas de Valoración</button>
</div>
</div>
</section>
{/*Interactive Filter Toolbar*/}
<section className="w-full bg-surface-container-low py-space-md">
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md items-center">
{/*Career Filter (UNSA)*/}
<div className="flex flex-col gap-space-xxs">
<label className="font-label-sm text-label-sm text-on-surface-variant font-medium flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-label-md">school</span>
            Carrera UNSA
          </label>
<div className="relative bg-surface-container-low rounded-lg p-space-xxs flex items-center gap-space-xxs" style={accent ? { boxShadow: `0 0 0 2px ${accent.color}` } : undefined}>
{accent && <span className="w-3 h-3 rounded-full flex-shrink-0 ml-space-xs" style={{ backgroundColor: accent.color }} />}
<select value={liveCareer} onChange={(e) => setLiveCareer(e.target.value)} className="w-full bg-transparent font-label-md text-label-md text-on-surface p-space-xs font-semibold focus:outline-none cursor-pointer">
<option value="all">Todas las carreras UNSA</option>
{UNSA_CAREERS.map((c) => (
<option key={c.key} value={c.key}>{c.label}</option>
))}
</select>
</div>
</div>
{/*Academic Cycle Filter*/}
<div className="flex flex-col gap-space-xxs">
<label className="font-label-sm text-label-sm text-on-surface-variant font-medium flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-label-md">timeline</span>
            Ciclo de Formación
          </label>
<div className="relative bg-surface-container-low rounded-lg p-space-xxs">
<select value={liveCycle} onChange={(e) => setLiveCycle(e.target.value)} className="w-full bg-transparent font-label-md text-label-md text-on-surface p-space-xs font-semibold focus:outline-none cursor-pointer">
<option value="all">Cualquier Ciclo (1ro a 10mo)</option>
<option value="c1-3">Ciclos Iniciales (1ro - 3ro)</option>
<option value="c4-6">Ciclos Intermedios Clínicos (4to - 6to)</option>
<option value="c7-8">Pre-Internado &amp; UCI (7mo - 8vo)</option>
<option value="c9-10">Internado Hospitalario (9no - 10mo)</option>
</select>
</div>
</div>
{/*Payment Mode Filter*/}
<div className="flex flex-col gap-space-xxs">
<label className="font-label-sm text-label-sm text-on-surface-variant font-medium flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-label-md">account_balance_wallet</span>
            Modalidad de Pago
          </label>
<div className="relative bg-surface-container-low rounded-lg p-space-xxs">
<select value={payMode} onChange={(e) => setPayMode(e.target.value)} className="w-full bg-transparent font-label-md text-label-md text-on-surface p-space-xs font-semibold focus:outline-none cursor-pointer">
<option value="all">Yape, Plin o Saldo VIP</option>
<option value="yape">Yape Directo (QR Alumno)</option>
<option value="plin">Plin Interbancario</option>
<option value="vip">Canje Membresía VIP (S/ 0.00)</option>
</select>
</div>
</div>
{/*Search Action & Clear*/}
<div className="flex items-end gap-space-xs pt-space-xs lg:pt-0">
<div className="relative flex-1">
<input className="w-full bg-surface-container-low rounded-lg pl-space-lg pr-space-sm py-space-xs font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none" placeholder="Buscar por tema o fármaco..." value={liveQ} onChange={(e) => setLiveQ(e.target.value)} type="text"/>
<span className="material-symbols-outlined absolute left-2 top-2 text-outline text-title-md">search</span>
</div>
<button className="h-10 px-space-md bg-primary text-on-primary rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center hover:bg-primary-container transition-colors shadow-sm" onClick={() => document.getElementById("recursos")?.scrollIntoView({ behavior: "smooth" })} style={{ backgroundColor: accentBg }}>Filtrar</button>
</div>
</div>
</div>
</section>
{/*Marketplace Product Grid (6 Rich Clinical Items)*/}
<section id="recursos" className="w-full py-space-xl scroll-mt-24">
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-xs pb-space-lg">
<div>
<h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Material Destacado de la Semana</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Archivos en formato PDF vectorial de alta resolución, listos para imprimir o importar en tablets.</p>
</div>
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span>Recursos verificados de la comunidad UNSA</span>
<span className="w-1 h-1 rounded-full bg-outline"></span>
{accent ? (
<button onClick={() => setLiveCareer("all")} className="px-space-sm py-space-xxs rounded-full font-bold text-white flex items-center gap-space-xxs" style={{ backgroundColor: accent.color }}>
{accent.label} ✕
</button>
) : (
<span className="text-tertiary font-bold">Filtro Antifraude Activo</span>
)}
</div>
</div>
<LiveDocuments q={liveQ} cycle={liveCycle} career={liveCareer} docType={docType} payVip={payMode === "vip"} accentColor={accent?.color ?? null} />
{/*Pagination / Load More*/}
{/*Paginación real dentro de LiveDocuments*/}
</div>
</section>
{/*Interactive Trust Indicators Bar (Bento Strip)*/}
<section className="w-full py-space-2xl bg-surface-container-low">
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
{/*Trust 1*/}
<div className="p-space-lg bg-surface-container-lowest rounded-xl flex items-start gap-space-md shadow-sm">
<div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-headline-sm">fact_check</span>
</div>
<div className="flex flex-col gap-space-xxs">
<span className="font-title-lg text-title-lg text-on-surface font-bold">Verificación Anti-Plagio</span>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Cada material es analizado con herramientas de similitud semántica. Cero fotocopias de libros comerciales; únicamente resúmenes originales y síntesis estudiantil.
            </p>
</div>
</div>
{/*Trust 2*/}
<div className="p-space-lg bg-surface-container-lowest rounded-xl flex items-start gap-space-md shadow-sm">
<div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-headline-sm">gavel</span>
</div>
<div className="flex flex-col gap-space-xxs">
<span className="font-title-lg text-title-lg text-on-surface font-bold">Aprobado bajo D.L. 822</span>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Respetamos plenamente la Ley de Derechos de Autor del Perú. Si detectas contenido que vulnere la propiedad intelectual, se retira de inmediato en menos de 2 horas.
            </p>
</div>
</div>
{/*Trust 3*/}
<div className="p-space-lg bg-surface-container-lowest rounded-xl flex items-start gap-space-md shadow-sm">
<div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-headline-sm">send_and_archive</span>
</div>
<div className="flex flex-col gap-space-xxs">
<span className="font-title-lg text-title-lg text-on-surface font-bold">Entrega Inmediata 24/7</span>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Valida tu captura de Yape/Plin mediante nuestro bot o paga directo. El PDF protegido contra edición se envía al instante a tu WhatsApp para tus turnos de guardia.
            </p>
</div>
</div>
</div>
</div>
</section>
{/*Interactive Quick-Preview Modal Simulation Script*/}

</div></main><footer className="w-full bg-surface-container-low mt-space-3xl py-space-2xl"><div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl pb-space-xl"><div className="flex flex-col gap-space-sm"><div className="flex items-center gap-space-xs"><span className="font-headline-sm text-headline-sm text-primary">Wawki</span><span className="font-label-sm text-label-sm bg-surface-container-high text-secondary px-space-sm py-space-xxs rounded-full font-semibold">Arequipa</span></div><p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Plataforma académica y red cooperativa de estudiantes de la UNSA Arequipa. Intercambio responsable y fiscalizado.</p><div className="flex flex-wrap gap-space-xs pt-space-xs"><span className="font-label-sm text-label-sm px-space-sm py-space-xxs bg-surface-container text-on-surface-variant rounded-full">Sede Honorio Delgado</span><span className="font-label-sm text-label-sm px-space-sm py-space-xxs bg-surface-container text-on-surface-variant rounded-full">Sede Goyeneche</span></div></div><div className="flex flex-col gap-space-xs"><span className="font-title-md text-title-md text-on-surface font-semibold">Red Hospitalaria &amp; Campus</span><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="explorar-marketplace" href="#">UNSA Área Biomédicas (Av. Alcides Carrión)</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="explorar-marketplace" href="#">EsSalud Seguín Escobedo Rotaciones</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="explorar-marketplace" href="#">Puntos de Entrega Segura en Hospitales</a></div><div className="flex flex-col gap-space-xs"><span className="font-title-md text-title-md text-on-surface font-semibold">Soporte Estudiantil</span><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="vender-y-monetizar" href="#">Calculadora de Comisiones (15%-20%)</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="vender-y-monetizar" href="#">Billeteras Yape &amp; Plin Estudiantes</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="membresia-semestral" href="#">Pase VIP S/ 15.00 por Ciclo</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="soporte-guardias" href="#">Centro de Ayuda en Guardias</a></div><div className="flex flex-col gap-space-xs"><span className="font-title-md text-title-md text-on-surface font-semibold">Marco Regulatorio</span><div className="p-space-sm bg-surface-container rounded-lg"><div className="flex items-center gap-space-xxs text-tertiary mb-space-xxs"><span className="material-symbols-outlined text-title-sm">gavel</span><span className="font-label-sm text-label-sm font-bold">D.L. 822 Cumplimiento</span></div><p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-snug">Prohibida la comercialización no autorizada de material bajo derecho de autor. Solo se admiten resúmenes originales, fichas PAE de elaboración propia y guías elaboradas por pares.</p></div><a className="font-label-sm text-label-sm text-primary font-semibold hover:underline mt-space-xs" data-path="marco-legal-y-etica-academica" href="#">Ver Normativa y Protocolo de Retiro →</a></div></div><div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant"><div className="flex items-center gap-space-sm"><span className="font-label-sm text-label-sm">© 2024 Wawki Arequipa. Impulsado por estudiantes UNSA.</span></div><div className="flex items-center gap-space-md"><a className="font-label-sm text-label-sm hover:text-on-surface" data-path="marco-legal-y-etica-academica" href="#">Términos y Condiciones</a><a className="font-label-sm text-label-sm hover:text-on-surface" data-path="marco-legal-y-etica-academica" href="#">Políticas DL 822</a><a className="font-label-sm text-label-sm hover:text-on-surface" data-path="marco-legal-y-etica-academica" href="#">Protocolo Ética NANDA</a></div></div></div></footer>
    </>
  );
}

{/* LIVE-CAREER market */}

/* LIVE-ACCENT v1 */
