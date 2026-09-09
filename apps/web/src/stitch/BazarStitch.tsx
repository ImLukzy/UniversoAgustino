// GENERADO por scripts/migrate-stitch.mjs desde bazar_y_alquiler_de_libros_y_scrubs/code.html (diseño Stitch 1:1).
// La interactividad original (<script> de Stitch) está re-implementada con React (ver wire*).
import { useState } from "react";
import { api } from "../lib/api";
import { LiveBazarItems } from "../live/live";
import { StitchAuth } from "../live/StitchAuth";
import { useCareerTheme } from "../live/careerTheme";
/* LIVE-CAREER v1 */
/* LIVE-HEADER v1 */
/* LIVE-PATCH v1 */
export function BazarStitch() {
  const { accent } = useCareerTheme();
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [liveQ, setLiveQ] = useState("");
  const [pubMsg, setPubMsg] = useState("");
  return (
    <>
<header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-20 max-w-[90rem] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md"><div className="flex items-center gap-space-md"><a className="flex items-center gap-space-sm group" data-path="explorar-marketplace" href="#"><img alt="Wawki Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuvy32rBRIBSNf8odU3lN0kIgy00ey01Mw9NqxSKdRoYVb-n2dEUaARklI6HcxyJwA_sX01pYy0PPbWns91EJy7-eLMIVb9FEOKwxT4eqOEaC3rD_EUKslyLHuVvaRUnkf3EQDjyDAg6LbZSGB0xLJe3AoCW_p9P0F2S62t6p79tzqfzkRV6Mo-mEmAEJXJobIhjg6hIwQKT27PfLKJA-QBWnCXmJtcZ_yjOEK6EJ6ZUIHz1fPfg31"/><div className="flex flex-col"><span style={accent ? { color: accent.color } : undefined} className="font-headline-sm text-headline-sm text-primary tracking-tight">Wawki <span className="text-secondary font-headline-sm text-headline-sm">Arequipa</span></span><span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Comunidad UNSA</span></div></a></div><nav className="hidden xl:flex items-center gap-space-xs" data-active-classes="bg-surface-container-high text-primary font-semibold rounded-lg"><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all" data-path="explorar-marketplace" href="#">Explorar Marketplace</a><a style={accent ? { backgroundColor: accent.soft, color: accent.color } : undefined} aria-current="page" className="px-space-md py-space-sm transition-all bg-surface-container-high text-primary font-semibold rounded-lg" data-path="bazar-y-alquiler" href="#">Bazar &amp; Alquiler</a><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all" data-path="vender-y-monetizar" href="#">Vender &amp; Monetizar</a><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all" data-path="marco-legal-y-etica-academica" href="#">Marco Legal &amp; Ética</a><a className="px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all flex items-center gap-space-xs" data-path="membresia-semestral" href="#"><span className="w-2 h-2 rounded-full bg-secondary"></span>Pase Semestral VIP</a></nav><div className="flex items-center gap-space-sm"><div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container-low rounded-full"><span className="material-symbols-outlined text-tertiary text-title-md">verified</span><span className="font-label-sm text-label-sm text-tertiary font-semibold">Yape / Plin Verificado</span></div><div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-space-sm py-space-xxs"><span className="material-symbols-outlined text-outline text-title-md mr-space-xxs">school</span><select onChange={(e) => { window.location.href = "/?career=" + e.target.value; }} className="bg-transparent font-label-sm text-label-sm text-on-surface font-semibold focus:outline-none cursor-pointer pr-space-xs" defaultValue="all"><option value="all">Todas las carreras</option><option value="ENFERMERIA">Enfermería</option><option value="MEDICINA">Medicina Humana</option><option value="PSICOLOGIA">Psicología</option><option value="BIOLOGIA">Biología</option><option value="DERECHO">Derecho</option><option value="EDUCACION">Educación</option><option value="ADMINISTRACION">Administración</option><option value="CONTABILIDAD">Contabilidad</option><option value="ECONOMIA">Economía</option><option value="ING_SISTEMAS">Ing. de Sistemas</option><option value="ING_CIVIL">Ing. Civil</option><option value="ING_INDUSTRIAL">Ing. Industrial</option><option value="ARQUITECTURA">Arquitectura</option><option value="AGRONOMIA">Agronomía</option><option value="OTRA_UNSA">Otra carrera UNSA</option></select></div><StitchAuth /></div></div></header><main className="w-full pt-20 bg-surface"><div className="flex flex-col w-full">
<div className="w-full bg-surface-container-low py-space-xl relative overflow-hidden">
<div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
<div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none"></div>
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop relative z-10">
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
<div className="max-w-3xl flex flex-col gap-space-xs">
<div className="flex items-center gap-space-xs mb-space-xxs">
<span className="inline-flex items-center gap-1.5 px-space-sm py-space-xxs rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>recycling</span>
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
<button className="inline-flex items-center justify-center gap-space-xs px-space-lg py-space-md rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container transition-colors group" id="open-publish-modal" onClick={() => setModalOpen(true)}>
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
</div>
<div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-xl w-full">
<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md mb-space-xl">
<div className="flex flex-wrap items-center gap-space-xs" id="filter-container">
<button onClick={() => setFilter("all")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "all" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
          Todos los ítems (28)
        </button>
<button onClick={() => setFilter("libros")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "libros" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
          Libros de Referencia
        </button>
<button onClick={() => setFilter("instrumental")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "instrumental" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
          Instrumental &amp; Herramientas
        </button>
<button onClick={() => setFilter("uniformes")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "uniformes" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
          Uniformes y Scrubs Clínicos
        </button>
<button onClick={() => setFilter("alquiler")} className={`filter-btn px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${filter === "alquiler" ? "active bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
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
<LiveBazarItems filter={filter} q={liveQ} />
<section className="rounded-2xl bg-surface-container-low p-space-xl md:p-space-2xl relative overflow-hidden shadow-sm">
<div className="max-w-3xl mb-space-xl">
<div className="inline-flex items-center gap-space-xxs px-space-sm py-space-xxs rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm mb-space-xs font-semibold">
<span className="material-symbols-outlined text-[16px]">security</span> Protocolo Anti-Estafas Estudiantil
        </div>
<h2 className="font-headline-lg text-headline-lg text-on-surface">
          Protocolo de Intermediación y Custodia Segura (Escrow Académico)
        </h2>
<p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">
          Nunca transfieras directamente a desconocidos. Wawki actúa como garante neutral para proteger tu presupuesto universitario de pérdidas o material deteriorado.
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
          Impacto en el Presupuesto de Salud 2024
        </h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Los estudiantes de enfermería en Arequipa invierten un promedio de S/ 1,400 por semestre en uniformes reglamentarios, instrumental de signos vitales y textos especializados. A través de nuestro bazar circular, la comunidad ha mitigado más de 45 toneladas de desechos textiles y ahorrado más de S/ 38,000 en insumos de rotación.
        </p>
<div className="grid grid-cols-3 gap-space-md pt-space-md">
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-low">
<span className="font-headline-sm text-headline-sm text-primary font-bold">S/ 185</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Ahorro medio por rotación</span>
</div>
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-low">
<span className="font-headline-sm text-headline-sm text-secondary font-bold">420+</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Libros recirculados</span>
</div>
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-low">
<span className="font-headline-sm text-headline-sm text-tertiary font-bold">0%</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Tasa de fraude reportada</span>
</div>
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
<span className="font-label-sm text-label-sm font-medium">Campus San Agustín: Puerta 1 Av. Alcides Carrión</span>
</div>
</div>
<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm py-1 border-b border-surface-container">
<span>Campus UNSA (Área Biomédicas)</span>
<span className="font-semibold text-tertiary">Lun - Sáb (8:00 - 18:00)</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm py-1">
<span>Hospital Goyeneche (Hall Principal)</span>
<span className="font-semibold text-tertiary">Cambio de Turno (13:30)</span>
</div>
</div>
</div>
</div>
</div>
<div className={`fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm items-center justify-center p-space-md ${modalOpen ? "flex" : "hidden"}`} id="publish-modal" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
<div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-xl shadow-xl flex flex-col gap-space-lg relative animate-in fade-in zoom-in-95 duration-200">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-title-lg">add_box</span>
</div>
<div>
<h3 className="font-title-lg text-title-lg text-on-surface font-semibold">Publicar en el Bazar Circular</h3>
<span className="font-label-sm text-label-sm text-on-surface-variant">Revisión de autenticidad en menos de 2 horas</span>
</div>
</div>
<button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface" id="close-publish-modal" onClick={() => setModalOpen(false)}>
<span className="material-symbols-outlined text-title-md">close</span>
</button>
</div>
{pubMsg && (<p className="mx-4 mb-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{pubMsg}</p>)}<form className="flex flex-col gap-space-md" onSubmit={async (e) => {
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
                }}>
<div>
<label className="block font-label-sm text-label-sm text-on-surface font-semibold mb-1">Título del Artículo o Libro</label>
<input className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ej: Manual de Farmacología Clínica 9na ed." name="bTitle" type="text"/>
</div>
<div className="grid grid-cols-2 gap-space-sm">
<div>
<label className="block font-label-sm text-label-sm text-on-surface font-semibold mb-1">Categoría</label>
<select name="bKind" className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm outline-none cursor-pointer">
<option>Libros de Referencia</option>
<option>Instrumental Médico</option>
<option>Scrubs y Uniformes</option>
<option>Accesorios de Práctica</option>
</select>
</div>
<div>
<label className="block font-label-sm text-label-sm text-on-surface font-semibold mb-1">Modalidad</label>
<select name="bTx" className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm outline-none cursor-pointer">
<option>Venta Definitiva</option>
<option>Alquiler por Rotación</option>
<option>Ambas Opciones</option>
</select>
</div>
</div>
<div className="grid grid-cols-2 gap-space-sm">
<div>
<label className="block font-label-sm text-label-sm text-on-surface font-semibold mb-1">Precio Sugerido (S/)</label>
<input className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm outline-none" placeholder="Ej: 80.00" name="bPrice" type="number"/>
</div>
<div>
<label className="block font-label-sm text-label-sm text-on-surface font-semibold mb-1">Campus / Punto de Entrega</label>
<select className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface font-body-sm text-body-sm outline-none cursor-pointer">
<option>UNSA Biomédicas</option>
<option>UNSA Campus Central</option>
<option>Hospital Honorio Delgado</option>
<option>Hospital Goyeneche</option>
</select>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span>Comisión fija de plataforma tras venta:</span>
<span className="font-bold text-primary">S/ 5.00</span>
</div>
<div className="flex items-center gap-space-sm pt-space-xs">
<button className="w-1/2 py-space-md rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors" id="cancel-publish-modal" onClick={() => setModalOpen(false)} type="button">
            Cancelar
          </button>
<button className="w-1/2 py-space-md rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm" type="submit">
            Enviar a Validación
          </button>
</div>
</form>
</div>
</div>

</div></main><footer className="w-full bg-surface-container-low mt-space-3xl py-space-2xl"><div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl pb-space-xl"><div className="flex flex-col gap-space-sm"><div className="flex items-center gap-space-xs"><span className="font-headline-sm text-headline-sm text-primary">Wawki</span><span className="font-label-sm text-label-sm bg-surface-container-high text-secondary px-space-sm py-space-xxs rounded-full font-semibold">Arequipa</span></div><p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Plataforma académica y red cooperativa de estudiantes de la UNSA Arequipa. Intercambio responsable y fiscalizado.</p><div className="flex flex-wrap gap-space-xs pt-space-xs"><span className="font-label-sm text-label-sm px-space-sm py-space-xxs bg-surface-container text-on-surface-variant rounded-full">Sede Honorio Delgado</span><span className="font-label-sm text-label-sm px-space-sm py-space-xxs bg-surface-container text-on-surface-variant rounded-full">Sede Goyeneche</span></div></div><div className="flex flex-col gap-space-xs"><span className="font-title-md text-title-md text-on-surface font-semibold">Red Hospitalaria &amp; Campus</span><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="explorar-marketplace" href="#">UNSA Área Biomédicas (Av. Alcides Carrión)</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="explorar-marketplace" href="#">EsSalud Seguín Escobedo Rotaciones</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="explorar-marketplace" href="#">Puntos de Entrega Segura en Hospitales</a></div><div className="flex flex-col gap-space-xs"><span className="font-title-md text-title-md text-on-surface font-semibold">Soporte Estudiantil</span><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="vender-y-monetizar" href="#">Calculadora de Comisiones (15%-20%)</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="vender-y-monetizar" href="#">Billeteras Yape &amp; Plin Estudiantes</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="membresia-semestral" href="#">Pase VIP S/ 15.00 por Ciclo</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="soporte-guardias" href="#">Centro de Ayuda en Guardias</a></div><div className="flex flex-col gap-space-xs"><span className="font-title-md text-title-md text-on-surface font-semibold">Marco Regulatorio</span><div className="p-space-sm bg-surface-container rounded-lg"><div className="flex items-center gap-space-xxs text-tertiary mb-space-xxs"><span className="material-symbols-outlined text-title-sm">gavel</span><span className="font-label-sm text-label-sm font-bold">D.L. 822 Cumplimiento</span></div><p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-snug">Prohibida la comercialización no autorizada de material bajo derecho de autor. Solo se admiten resúmenes originales, fichas PAE de elaboración propia y guías elaboradas por pares.</p></div><a className="font-label-sm text-label-sm text-primary font-semibold hover:underline mt-space-xs" data-path="marco-legal-y-etica-academica" href="#">Ver Normativa y Protocolo de Retiro →</a></div></div><div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant"><div className="flex items-center gap-space-sm"><span className="font-label-sm text-label-sm">© 2024 Wawki Arequipa. Impulsado por estudiantes UNSA.</span></div><div className="flex items-center gap-space-md"><a className="font-label-sm text-label-sm hover:text-on-surface" data-path="marco-legal-y-etica-academica" href="#">Términos y Condiciones</a><a className="font-label-sm text-label-sm hover:text-on-surface" data-path="marco-legal-y-etica-academica" href="#">Políticas DL 822</a><a className="font-label-sm text-label-sm hover:text-on-surface" data-path="marco-legal-y-etica-academica" href="#">Protocolo Ética NANDA</a></div></div></div></footer>
    </>
  );
}

/* LIVE-ACCENT v1 */
