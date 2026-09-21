// GENERADO por scripts/migrate-stitch.mjs desde bazar_y_alquiler_de_libros_y_scrubs/code.html (diseño Stitch 1:1).
// La interactividad original (<script> de Stitch) está re-implementada con React (ver wire*).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LiveBazarItems } from "../live/live";
import { StitchHeader } from "../components/StitchHeader";
import { StitchFooter } from "../components/StitchFooter";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/careerContent";
/* LIVE-CAREER v1 */
/* LIVE-HEADER v1 */
/* LIVE-PATCH v1 */
export function BazarStitch() {
  const { accent, career: liveCareer } = useCareerTheme();
  const cc = careerContent(liveCareer);
  const [filter, setFilter] = useState("all");
  const [liveQ, setLiveQ] = useState("");
  const nav = useNavigate();
  return (
    <>
<StitchHeader active="bazar" /><main className="w-full pt-20 bg-surface"><div className="flex flex-col w-full">
<div className="w-full bg-surface-container-low py-space-xl relative overflow-hidden">
<div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
<div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none"></div>
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop relative z-10">
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
<div className="max-w-3xl flex flex-col gap-space-xs">
<div className="flex items-center gap-space-xs mb-space-xxs">
<span className="inline-flex items-center gap-1.5 px-space-sm py-space-xxs rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm" style={accent ? { color: accent.color } : undefined}>
<span className="material-symbols-outlined text-[16px] text-primary" style={accent ? { color: accent.color, fontVariationSettings: "'FILL' 1" } : {fontVariationSettings: "'FILL' 1"}}>recycling</span>
              Sostenibilidad Estudiantil • Región Arequipa
            </span>
<span className="inline-flex items-center gap-1 px-space-sm py-space-xxs rounded-full bg-tertiary-container/15 text-tertiary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[14px]">verified_user</span> Escrow Activo
            </span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Economía Circular en Enfermería: Libros Oficiales, Scrubs y Herramientas Médicas de Segunda Vida en Arequipa
          </h1>
<p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Optimiza tus gastos clínicos mediante compra de reventa verificada o alquiler por ciclo. Ahorra hasta un 65% en insumos aprobados por el claustro docente de la UNSA.
          </p>
</div>
<div className="flex flex-col sm:flex-row lg:flex-col gap-space-sm shrink-0">
<button className="inline-flex items-center justify-center gap-space-xs px-space-lg py-space-md rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container transition-colors group" id="open-publish-modal" onClick={() => nav("/publicar")} style={accent ? { backgroundColor: accent.color } : undefined}>
<span className="material-symbols-outlined text-title-md group-hover:rotate-90 transition-transform">add_circle</span>
            Publicar Libro o Instrumental
          </button>
<div className="flex items-center justify-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-secondary text-[16px]">account_balance_wallet</span>
            Tarifa plana intermediación: S/ 5.00 a S/ 10.00
          </div>
</div>
</div>
<div className="mt-space-lg p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
<div className="flex items-start md:items-center gap-space-sm">
<div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-secondary text-title-lg">pin_drop</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Puntos de encuentro seguros en Arequipa</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Campus UNSA (Área Biomédicas), Hospital Honorio Delgado, Hospital Goyeneche o entrega delivery coordinada.</span>
</div>
</div>
<div className="flex items-center gap-space-xs shrink-0 self-end md:self-center">
<span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
<span className="font-label-sm text-label-sm text-tertiary font-medium">9 casilleros activos hoy</span>
</div>
</div>
</div>
{accent && (
<div className="mt-space-md p-space-md rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm" style={{ backgroundColor: accent.soft }}>
<div className="flex items-center gap-space-sm">
<span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: accent.color }}></span>
<p className="font-body-sm text-body-sm text-on-surface"><span className="font-bold" style={{ color: accent.color }}>{accent.label}: </span>{cc.bazarHint}</p>
</div>
{cc.bazarSuggest && (
<button type="button" onClick={() => setLiveQ(cc.bazarSuggest)} className="shrink-0 px-space-md py-space-xs rounded-lg text-white font-label-md text-label-md font-bold" style={{ backgroundColor: accent.color }}>
Buscar &ldquo;{cc.bazarSuggest}&rdquo;
</button>
)}
</div>
)}
</div>
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-xl w-full">
<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md mb-space-xl">
<div className="flex flex-wrap items-center gap-space-xs" id="filter-container">
<button onClick={() => setFilter("all")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "all" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`} style={filter === "all" && accent ? { backgroundColor: accent.color } : undefined}>
          Todos los ítems (28)
        </button>
<button onClick={() => setFilter("libros")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "libros" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`} style={filter === "libros" && accent ? { backgroundColor: accent.color } : undefined}>
          Libros de Referencia
        </button>
<button onClick={() => setFilter("instrumental")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "instrumental" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`} style={filter === "instrumental" && accent ? { backgroundColor: accent.color } : undefined}>
          Instrumental &amp; Herramientas
        </button>
<button onClick={() => setFilter("uniformes")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "uniformes" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`} style={filter === "uniformes" && accent ? { backgroundColor: accent.color } : undefined}>
          Uniformes y Scrubs Clínicos
        </button>
<button onClick={() => setFilter("alquiler")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "alquiler" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`} style={filter === "alquiler" && accent ? { backgroundColor: accent.color } : undefined}>
          Alquiler para Internado/Rotaciones
        </button>
</div>
<div className="flex items-center gap-space-sm w-full lg:w-auto">
<div className="relative flex-1 lg:w-64">
<span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-title-md">search</span>
<input className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Buscar por código, autor o marca..." value={liveQ} onChange={(e) => setLiveQ(e.target.value)} type="text"/>
</div>
<button className="p-2 rounded-lg bg-surface-container-lowest text-on-surface-variant shadow-sm hover:bg-surface-container transition-colors" title="Ordenar lista">
<span className="material-symbols-outlined text-title-md">swap_vert</span>
</button>
</div>
</div>
<LiveBazarItems filter={filter} q={liveQ} accentColor={accent?.color ?? null} />
<section className="rounded-2xl bg-surface-container-low p-space-xl md:p-space-2xl relative overflow-hidden shadow-sm">
<div className="max-w-3xl mb-space-xl">
<div className="inline-flex items-center gap-space-xxs px-space-sm py-space-xxs rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm mb-space-xs font-semibold">
<span className="material-symbols-outlined text-[16px]">security</span> Protocolo Anti-Estafas Estudiantil
        </div>
<h2 className="font-headline-lg text-headline-lg text-on-surface">
          Protocolo de Intermediación y Custodia Segura (Escrow Académico)
        </h2>
<p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">
          Nunca transfieras directamente a desconocidos. Universo Agustino actúa como garante neutral para proteger tu presupuesto universitario de pérdidas o material deteriorado.
        </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg relative">
<div className="flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm relative">
<div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-headline-sm text-headline-sm mb-space-md font-bold">
            1
          </div>
<h4 className="font-title-lg text-title-lg text-on-surface mb-space-xs font-semibold">Depósito en Custodia</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Pagas el valor del libro o instrumental a la plataforma por Yape/Plin. El dinero queda protegido en nuestra cuenta de fideicomiso y el vendedor es notificado para apartar el ítem.
          </p>
<div className="mt-space-md pt-space-sm flex items-center text-primary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px] mr-1">lock</span> Retención 100% Blindada
          </div>
</div>
<div className="flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm relative">
<div className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-headline-sm text-headline-sm mb-space-md font-bold">
            2
          </div>
<h4 className="font-title-lg text-title-lg text-on-surface mb-space-xs font-semibold">Revisión Presencial</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Se coordinan en los puntos seguros: Cafetería de Enfermería UNSA, Área Biomédicas o entrada de Hospitales. Verificas el estado real, hojas completas y funcionamiento.
          </p>
<div className="mt-space-md pt-space-sm flex items-center text-secondary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px] mr-1">location_on</span> Puntos de Alta Seguridad
          </div>
</div>
<div className="flex flex-col p-space-lg rounded-xl bg-surface-container-lowest shadow-sm relative">
<div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-headline-sm text-headline-sm mb-space-md font-bold">
            3
          </div>
<h4 className="font-title-lg text-title-lg text-on-surface mb-space-xs font-semibold">Liberación Inmediata</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Ingresas a la app y das el "Visto Bueno". Liberamos el monto al vendedor descontando únicamente la tarifa plana solidaria de S/ 5.00 a S/ 10.00 para sostener el servidor estudiantil.
          </p>
<div className="mt-space-md pt-space-sm flex items-center text-tertiary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px] mr-1">check_circle</span> Liberación en &lt; 2 min
          </div>
</div>
</div>
<div className="mt-space-xl p-space-md rounded-xl bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-md">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-outline text-title-lg">help_center</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">
            ¿El producto no coincide con las fotos o tiene roturas ocultas? Cancela la operación en el punto de encuentro y recuperas tu dinero al 100%.
          </span>
</div>
<a className="shrink-0 font-label-sm text-label-sm text-primary font-semibold hover:underline flex items-center gap-1" data-path="marco-legal-y-etica-academica" href="#">
          Leer Términos de Garantía Fideicomiso →
        </a>
</div>
</section>
<div className="mt-space-2xl grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
<div className="lg:col-span-7 flex flex-col gap-space-sm">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Comunidad Cooperativa Arequipeña</span>
<h3 className="font-headline-lg text-headline-lg text-on-surface">
          {cc.impactTitle}
        </h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {cc.impactBody}
        </p>
<div className="grid grid-cols-3 gap-space-md pt-space-md">
{cc.impactStats.map((s, i) => (
<div key={s.label} className="flex flex-col p-space-md rounded-xl bg-surface-container-low">
<span className={`font-headline-sm text-headline-sm font-bold ${i === 0 ? "text-primary" : i === 1 ? "text-secondary" : "text-tertiary"}`}>{s.value}</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">{s.label}</span>
</div>
))}
</div>
</div>
<div className="lg:col-span-5 p-space-xl rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
<h4 className="font-title-lg text-title-lg text-on-surface font-semibold flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary">pin_drop</span>
          Mapa de Entregas Seguras
        </h4>
<div className="w-full h-52 bg-cover bg-center rounded-xl relative overflow-hidden flex items-end p-space-sm" data-location="Universidad Nacional de San Agustin Biomédicas, Arequipa, Perú" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBC8jtFILWvUHFmPq3JxGcwsGucXkTlejV-qp70eYQjcBLEpn5ZoaQFLw-8FO86EQFv-qt3iWJl3uhFBrw0YRwmGB5qJElTYhylb_6zdGxJXa7BhVnMLhjc945dH-ZItVCqYlGAFUTlL_xr6eFIJT8un9IAm6ZMGYhP3KgE_Mla8D6Ifi4nFHNfR1TSNmaNz_NZAlExUUPjRO7hwxj4b5Db6mtyoaajB1emaBXcorq1P7katjndY3dM')"}}>
<div className="px-space-sm py-space-xxs rounded-lg bg-surface-container-lowest/95 backdrop-blur-md shadow-sm flex items-center gap-space-xs text-on-surface">
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
<span className="font-label-sm text-label-sm font-medium">{cc.mapLabel}</span>
</div>
</div>
<div className="flex flex-col gap-space-xs">
{cc.meetSpots.map((spot, i) => (
<div key={spot} className={`flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm py-1 ${i === 0 ? "border-b border-surface-container" : ""}`}>
<span>{spot}</span>
<span className="font-semibold text-tertiary">{cc.meetTimes[i]}</span>
</div>
))}
</div>
</div>
</div>
</div>

</div></main><StitchFooter />
    </>
  );
}

/* LIVE-ACCENT v1 */
