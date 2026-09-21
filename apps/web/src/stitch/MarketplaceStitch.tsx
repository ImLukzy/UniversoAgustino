// GENERADO por scripts/migrate-stitch.mjs desde marketplace_de_apuntes_y_gu_as_pae/code.html (diseño Stitch 1:1).
// La interactividad original (<script> de Stitch) está re-implementada con React (ver wire*).
import { useEffect, useRef, useState } from "react";
import { LiveDocuments } from "../live/live";
import { StitchHeader } from "../components/StitchHeader";
import { StitchFooter } from "../components/StitchFooter";
/* LIVE-CAREER v1 */
import { UNSA_CAREERS } from "../data/unsa";
import { careerContent } from "../data/careerContent";
import { useCareerTheme } from "../live/careerTheme";
/* LIVE-HEADER v1 */
/* LIVE-PATCH v1 */
export function MarketplaceStitch() {
  const [liveQ, setLiveQ] = useState("");
  const { career: liveCareer, setCareer: setLiveCareer, accent } = useCareerTheme();
  const [liveCycle, setLiveCycle] = useState("all");
  const [docType, setDocType] = useState("all");
  // Personalización automática: textos, chips y acentos cambian según la carrera filtrada.
  const cc = careerContent(liveCareer);
  const accentBg = accent?.color ?? "rgb(var(--hub-p, 0 104 95))";
  // Desplegable de carrera con la opción activa siempre marcada (✓ + color).
  const [careerMenuOpen, setCareerMenuOpen] = useState(false);
  const careerMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!careerMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!careerMenuRef.current?.contains(e.target as Node)) setCareerMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCareerMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [careerMenuOpen]);

  return (
    <>
<StitchHeader active="marketplace" /><main className="w-full pt-20 bg-surface"><div className="flex flex-col w-full">
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
            {cc.heroLead}{" "}
<span className="font-bold" style={{ background: "linear-gradient(90deg,#5eead4,#a5b4fc)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>UNSA</span>.
          </h1>
<p className="text-white/75 max-w-2xl leading-relaxed" style={{ fontSize: "1.05rem" }}>
            {cc.heroDesc}
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
<span className="font-body-sm text-body-sm text-on-surface-variant">15 carreras · una sola comunidad agustina</span>
</div>
{accent ? (<span className="px-space-sm py-space-xxs rounded-full text-white font-label-sm text-label-sm font-bold whitespace-nowrap" style={{ backgroundColor: accent.color }}>{accent.label}</span>) : (<span className="px-space-sm py-space-xxs rounded-full bg-surface-container font-label-sm text-label-sm font-bold text-on-surface-variant whitespace-nowrap">Todas</span>)}
</div>
<div className="flex flex-wrap gap-space-xs">
<button type="button" onClick={() => setLiveCareer("all")} className="px-space-sm py-space-xs rounded-full font-label-md text-label-md font-semibold transition-all" style={liveCareer === "all" ? { backgroundColor: "rgb(var(--hub-p, 0 104 95))", color: "#fff" } : { backgroundColor: "#f2f3ff", color: "#3d4947" }}>Todas</button>
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
{/*Quick Filter Categories Chips*/}
<section className="w-full bg-surface py-space-md overflow-x-auto">
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="flex items-center gap-space-xs whitespace-nowrap overflow-x-auto pb-space-xxs">
<button type="button" onClick={() => { setDocType("all"); setLiveQ(""); }} className={docType === "all" && liveQ === "" ? "px-space-md py-space-xs rounded-full text-white font-label-md text-label-md font-semibold shadow-sm transition-colors" : "px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors"} style={docType === "all" && liveQ === "" ? { backgroundColor: accentBg } : undefined}>Todos los Recursos</button>
{cc.chips.map((chip) => {
  const active = docType === chip.docType && liveQ === chip.q;
  return (
    <button key={chip.label} type="button" onClick={() => { setDocType(chip.docType); setLiveQ(chip.q); }} className={active ? "px-space-md py-space-xs rounded-full text-white font-label-md text-label-md font-semibold shadow-sm transition-colors" : "px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors"} style={active ? { backgroundColor: accentBg } : undefined}>{chip.label}</button>
  );
})}
</div>
</div>
</section>
{/*Interactive Filter Toolbar*/}
<section className="w-full bg-surface-container-low py-space-md">
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md items-center">
{/*Career Filter (UNSA)*/}
<div className="flex flex-col gap-space-xxs">
<label className="font-label-sm text-label-sm text-on-surface-variant font-medium flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-label-md">school</span>
            Carrera UNSA
          </label>
<div className="relative bg-surface-container-low rounded-lg p-space-xxs flex items-center gap-space-xxs" style={accent ? { boxShadow: `0 0 0 2px ${accent.color}` } : undefined}>
{accent && <span className="w-3 h-3 rounded-full flex-shrink-0 ml-space-xs" style={{ backgroundColor: accent.color }} />}
<div className="relative w-full" ref={careerMenuRef}>
<button type="button" onClick={() => setCareerMenuOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={careerMenuOpen} className="w-full bg-transparent font-label-md text-label-md text-on-surface p-space-xs font-semibold focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer flex items-center justify-between gap-space-xs text-left">
<span className="truncate">{accent ? accent.label : "Todas las carreras UNSA"}</span>
<span className="material-symbols-outlined text-title-md flex-shrink-0">expand_more</span>
</button>
{careerMenuOpen && (
<ul role="listbox" aria-label="Carrera UNSA" className="absolute left-0 right-0 top-full mt-1 z-50 max-h-72 overflow-auto rounded-xl bg-surface-container-lowest shadow-xl border border-surface-container-high p-1">
<li>
<button type="button" role="option" aria-selected={liveCareer === "all"} onClick={() => { setLiveCareer("all"); setCareerMenuOpen(false); }} className="w-full flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg text-left font-label-md text-label-md hover:bg-surface-container-low transition-colors" style={liveCareer === "all" ? { backgroundColor: "rgb(var(--hub-p, 0 104 95) / 0.08)", color: "rgb(var(--hub-p, 0 104 95))", fontWeight: 700 } : undefined}>
<span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-outline"></span>
<span className="flex-1 truncate">Todas las carreras UNSA</span>
{liveCareer === "all" && <span className="material-symbols-outlined text-title-md flex-shrink-0">check</span>}
</button>
</li>
{UNSA_CAREERS.map((c) => {
const active = liveCareer === c.key;
return (
<li key={c.key}>
<button type="button" role="option" aria-selected={active} title={c.faculty} onClick={() => { setLiveCareer(c.key); setCareerMenuOpen(false); }} className="w-full flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg text-left font-label-md text-label-md hover:bg-surface-container-low transition-colors" style={active ? { backgroundColor: c.soft, color: c.color, fontWeight: 700 } : undefined}>
<span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }}></span>
<span className="flex-1 truncate">{c.label}</span>
{active && <span className="material-symbols-outlined text-title-md flex-shrink-0">check</span>}
</button>
</li>
);
})}
</ul>
)}
</div>
</div>
</div>
{/*Academic Cycle Filter (etapas neutras: válidas para las 15 carreras UNSA)*/}
<div className="flex flex-col gap-space-xxs">
<label className="font-label-sm text-label-sm text-on-surface-variant font-medium flex items-center gap-space-xxs">
<span className="material-symbols-outlined text-label-md">timeline</span>
            Ciclo de Formación
          </label>
<div className="relative bg-surface-container-low rounded-lg p-space-xxs">
<select value={liveCycle} onChange={(e) => setLiveCycle(e.target.value)} className="w-full bg-transparent font-label-md text-label-md text-on-surface p-space-xs font-semibold focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
<option value="all">Cualquier ciclo (I – X)</option>
<option value="c1-3">Ciclos iniciales (I – III)</option>
<option value="c4-6">Ciclos intermedios (IV – VI)</option>
<option value="c7-8">Ciclos avanzados (VII – VIII)</option>
<option value="c9-10">Ciclos finales (IX – X)</option>
</select>
</div>
</div>
{/*Search Action & Clear*/}
<div className="flex items-end gap-space-xs pt-space-xs lg:pt-0">
<div className="relative flex-1">
<input className="w-full bg-surface-container-low rounded-lg pl-space-lg pr-space-sm py-space-xs font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder={cc.searchPlaceholder} value={liveQ} onChange={(e) => setLiveQ(e.target.value)} type="text"/>
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
<h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{cc.sectionTitle}</h2>
<p className="font-body-md text-body-md text-on-surface-variant">{cc.sectionSub}</p>
</div>
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span>Recursos verificados de la comunidad agustina</span>
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
<LiveDocuments q={liveQ} cycle={liveCycle} career={liveCareer} docType={docType} accentColor={accent?.color ?? null} emptyHint={cc.emptyHint} />
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

</div></main><StitchFooter />
    </>
  );
}

{/* LIVE-CAREER market */}

/* LIVE-ACCENT v1 */
