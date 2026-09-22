import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, apiError, pen, type HubDocument } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/careerContent";
import { careerLabel } from "../data/unsa";
import { CareerAvatar } from "../components/CareerVisual";
import { PagePreview } from "../components/PdfPreview";

interface Person {
  fullName: string;
  career?: string | null;
  cycle?: string | null;
  university?: string | null;
}

type Doc = HubDocument & { author?: { profile?: Person | null } | null };

const WATERMARK = (career: string) => [
  "Vista previa protegida · Universo Agustino · D.L. 822",
  "Prohibida su reproducción · Copia no autorizada",
  `Uso exclusivo evaluación · ${career}`,
];

export function Visor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { accent } = useCareerTheme();
  const nav = useNavigate();
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(false);
  const [page, setPage] = useState<1 | 2>(1);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const doc = useQuery({
    queryKey: ["visor-doc", id],
    queryFn: async () => (await api.get(`/documents/${id}`)).data.data as Doc,
    enabled: !!id,
  });
  const d = doc.data;
  const cc = careerContent(d?.career);
  const person = d?.author?.profile;

  const buy = async () => {
    if (!user) {
      nav("/login");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const r = await api.post("/orders", { itemType: "document", itemId: id });
      nav(`/checkout/${r.data.data.id}`);
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  if (doc.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p>Cargando visor…</p>
      </main>
    );
  }
  if (!d) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6 text-center">
          <p className="font-bold">Este documento ya no existe.</p>
          <Link className="mt-2 inline-block font-semibold text-primary underline" to="/">Volver al marketplace</Link>
        </div>
      </main>
    );
  }

  const careerName = careerLabel(d.career);

  return (
    <main className="mx-auto max-w-6xl space-y-3 px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-low px-4 py-2 text-sm">
        <div className="flex min-w-0 items-center gap-1.5 text-slate-500">
          <Link to="/" className="flex items-center gap-0.5 font-semibold hover:text-primary">
            <span className="material-symbols-outlined text-base">home</span> Marketplace
          </Link>
          <span>/</span>
          <span className="font-semibold">{d.type}</span>
          <span>/</span>
          <span className="truncate font-bold text-slate-800">{d.title.slice(0, 40)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary" style={accent ? { color: accent.color } : undefined}>
            <span className="material-symbols-outlined text-sm">shield</span> D.L. 822 Verificado
          </span>
          <span className="hidden text-slate-500 sm:inline">ID: {d.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Visor */}
        <div className="flex flex-col gap-2 lg:col-span-7 xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-primary/10 p-1 text-primary" style={accent ? { color: accent.color } : undefined}>
                <span className="material-symbols-outlined">menu_book</span>
              </span>
              <div>
                <p className="flex items-center gap-2 text-sm font-bold">
                  Visor Protegido Universo Agustino
                  <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Muestra activa</span>
                </p>
                <p className="text-xs text-slate-500">Páginas <b className="text-primary" style={accent ? { color: accent.color } : undefined}>1 y 2</b> autorizadas para lectura previa</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
                <button onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.1).toFixed(2)))} className="rounded p-1 hover:bg-slate-200" title="Alejar zoom" aria-label="Alejar zoom">
                  <span className="material-symbols-outlined text-lg">zoom_out</span>
                </button>
                <span className="px-1 text-xs font-bold">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))} className="rounded p-1 hover:bg-slate-200" title="Acercar zoom" aria-label="Acercar zoom">
                  <span className="material-symbols-outlined text-lg">zoom_in</span>
                </button>
              </div>
              <button onClick={() => setRotate((r) => !r)} className="rounded-lg bg-slate-100 p-1.5 hover:bg-slate-200" title="Rotar vista" aria-label="Rotar vista">
                <span className="material-symbols-outlined text-base">rotate_right</span>
              </button>
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5" title="Moverse entre las páginas permitidas">
                <button onClick={() => setPage(1)} disabled={page === 1} className="rounded p-1 hover:bg-slate-200 disabled:opacity-40" aria-label="Página anterior">
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <span className="px-1 text-xs font-bold">Pág. {page} / 2</span>
                <button onClick={() => setPage(2)} disabled={page === 2} className="rounded p-1 hover:bg-slate-200 disabled:opacity-40" aria-label="Página siguiente">
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
              <span className="flex cursor-not-allowed items-center gap-1 rounded-lg bg-slate-100 px-2 py-1.5 text-xs text-slate-500" title="Completa tu compra para modo pantalla completa">
                <span className="material-symbols-outlined text-base">fullscreen</span>
                <span className="material-symbols-outlined text-sm text-red-500">lock</span>
              </span>
            </div>
          </div>

          {/* Hoja 1 */}
          <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-md" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-1 text-xs font-bold">
                <span className="material-symbols-outlined text-base text-primary" style={accent ? { color: accent.color } : undefined}>description</span>
                Página {page}: {d.course} · Ciclo {d.cycle}
              </span>
              <span className="text-xs text-slate-500">{careerName}</span>
            </div>
            <div
              className="relative select-none overflow-hidden bg-white"
              onContextMenu={(e) => e.preventDefault()}
            >
              <div style={rotate ? { transform: "rotate(90deg) scale(0.75)" } : undefined}>
                <PagePreview fileUrl={d.fileUrl} page={page} careerImg={cc.imgQuote} title={d.title} />
              </div>
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-around overflow-hidden opacity-25">
                {WATERMARK(careerName).map((w) => (
                  <div key={w} className="-rotate-12 whitespace-nowrap text-center text-lg font-extrabold uppercase tracking-wider text-slate-700">
                    {w}
                  </div>
                ))}
              </div>
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 rounded-md bg-black/75 px-2 py-1 text-[11px] text-white backdrop-blur">
                <span className="material-symbols-outlined text-sm text-emerald-300">verified</span>
                Página real del documento · Vista previa verificada
              </div>
            </div>
            <div className="space-y-1 p-4">
              <div className="flex items-center justify-between">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary" style={accent ? { color: accent.color } : undefined}>
                  {cc.visorTemario[0]?.t ?? d.type}
                </span>
                <span className="text-xs text-slate-500">Pág. {page} · Revisión 2024</span>
              </div>
              <h4 className="font-bold">{d.title}</h4>
              <p className="text-sm leading-relaxed text-slate-500">
                {d.description || "Documento original verificado por la comunidad agustina. El contenido completo, sin marcas de agua y en alta resolución, se desbloquea al comprar."}
              </p>
              <div className="grid grid-cols-3 gap-1 pt-1">
                {cc.visorTemario.slice(0, 3).map((s) => (
                  <div key={s.t} className="rounded-lg bg-slate-50 p-2">
                    <span className="block text-xs font-semibold text-primary" style={accent ? { color: accent.color } : undefined}>{s.t}</span>
                    <span className="text-[11px] text-slate-500">{s.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-2xl items-center gap-2 text-xs text-slate-500">
            <span className="h-px w-16 bg-slate-200"></span>
            <span>Inicio de Página 2 (muestra parcial)</span>
            <span className="h-px w-16 bg-slate-200"></span>
          </div>

          {/* Hoja 2 bloqueada */}
          <div className="relative mx-auto flex min-h-[430px] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-md">
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
              <span className="text-xs font-bold">Página 2: {cc.visorTemario[1]?.t ?? "Contenido"}</span>
              <span className="text-xs font-semibold text-primary" style={accent ? { color: accent.color } : undefined}>Vista previa</span>
            </div>
            <div className="pointer-events-none max-h-72 select-none overflow-hidden opacity-60 blur-[4px]">
              {d.fileUrl ? (
                <PagePreview fileUrl={d.fileUrl} page={2} careerImg={cc.imgQuote} title={d.title} />
              ) : (
                <div className="space-y-2 p-4">
                  <h5 className="font-bold">{cc.visorTemario[2]?.t ?? d.course}</h5>
                  <p className="text-sm text-slate-500">{cc.visorTemario[2]?.d ?? d.description ?? ""}</p>
                  <div className="rounded-lg bg-slate-100 p-2 text-xs text-slate-600">
                    <span className="font-bold text-primary" style={accent ? { color: accent.color } : undefined}>{cc.visorTemario[3]?.t}</span>
                    <p>{cc.visorTemario[3]?.d}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute inset-0 z-20 flex flex-1 flex-col items-center justify-center overflow-y-auto bg-gradient-to-t from-white via-white/95 to-white/40 p-6 text-center backdrop-blur-[2px]">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </span>
              <span className="mt-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-500">
                Contenido restringido
              </span>
              <h3 className="mt-1 font-display text-xl font-extrabold">Páginas 3 en adelante bloqueadas</h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Adquiere el apunte completo por solo <b className="text-primary" style={accent ? { color: accent.color } : undefined}>{pen(d.priceCents)}</b> para desbloquear la guía completa y descargar el <b className="text-slate-800">archivo en alta resolución sin marcas de agua</b>.
              </p>
              <div className="mt-3 flex w-full max-w-md flex-col justify-center gap-2 sm:flex-row">
                <button disabled={busy} onClick={buy} className="btn-primary disabled:opacity-50" style={accent ? { backgroundColor: accent.color } : undefined}>
                  {busy ? "Creando pedido…" : `Desbloquear por ${pen(d.priceCents)}`}
                </button>
              </div>
              {err && <p className="mt-2 max-w-md rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{err}</p>}
            </div>
          </div>

          {/* Temario */}
          <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-indigo-600">format_list_numbered</span>
                Estructura &amp; Temario completo
              </h4>
              <span className="text-xs text-slate-500">{careerName}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {cc.visorTemario.map((s, i) => (
                <div key={s.t} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
                    style={accent ? { backgroundColor: accent.color } : undefined}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <span className="block text-xs font-bold">{s.t}</span>
                    <span className="text-[11px] text-slate-500">{s.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-xl bg-white p-3 text-xs leading-snug shadow-sm">
            <span className="material-symbols-outlined shrink-0 text-xl text-emerald-700">verified_user</span>
            <div className="text-slate-500">
              <b className="text-slate-800">Material avalado por la red UNSA:</b> este resumen corresponde a notas elaboradas por estudiantes. Cumple el D.L. 822 de Derechos de Autor; no se comercializan fotocopias de libros comerciales.
            </div>
          </div>
        </div>

        {/* Ficha lateral */}
        <div className="flex flex-col gap-3 lg:col-span-5 xl:col-span-4">
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-md">
            <div className="flex flex-wrap items-center gap-1">
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">UNSA</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{careerName}</span>
              <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="material-symbols-outlined text-sm">check_circle</span> Ciclo {d.cycle}
              </span>
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold leading-tight">{d.title}</h1>
              <p className="mt-1 text-sm text-slate-500">{d.course} · {d.type}</p>
            </div>
            <div className="grid grid-cols-1 gap-1 rounded-lg bg-slate-50 p-3 text-xs">
              <p className="flex items-center gap-1"><span className="material-symbols-outlined text-base text-emerald-700">fact_check</span><span><b>Verificado Antiplagio:</b> contenido inédito de estudio</span></p>
              <p className="flex items-center gap-1"><span className="material-symbols-outlined text-base text-primary" style={accent ? { color: accent.color } : undefined}>draw</span><span><b>Autoría 100% Original:</b> esquemas propios digitalizados</span></p>
              <p className="flex items-center gap-1"><span className="material-symbols-outlined text-base text-indigo-600">school</span><span><b>D.L. 822 UNSA:</b> material original verificado</span></p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-semibold uppercase text-slate-500">Precio de descarga digital</span>
              <span className="font-display text-4xl font-extrabold text-primary" style={accent ? { color: accent.color } : undefined}>
                {pen(d.priceCents)}
              </span>
              <span className="text-xs text-slate-500">Compra única · sin suscripción</span>
            </div>
            <div className="flex flex-col gap-2">
              <button disabled={busy} onClick={buy} className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50" style={accent ? { backgroundColor: accent.color } : undefined}>
                <span className="material-symbols-outlined text-xl">payments</span>
                <span>{busy ? "Creando pedido…" : `Comprar Ahora vía Yape / Plin (${pen(d.priceCents)})`}</span>
              </button>
              <Link to="/pedidos" className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-100 py-2.5 font-semibold text-indigo-800 transition-colors hover:bg-indigo-200">
                <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                <span>Mis pedidos y custodia</span>
              </Link>
              <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
                <span className="material-symbols-outlined text-base text-emerald-700">bolt</span>
                Entrega en tu cuenta al confirmar el pago
              </p>
            </div>
            {err && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{err}</p>}
            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Autoría del material</span>
              <div className="flex items-center gap-2">
                <CareerAvatar name={person?.fullName ?? "?"} className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 font-bold">
                    <span className="truncate">{person?.fullName ?? "Vendedor UNSA"}</span>
                    <span className="material-symbols-outlined text-base text-emerald-600" title="Verificado UNSA">verified</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {[person?.career ? careerLabel(person.career) : null, person?.cycle ? `Ciclo ${person.cycle}` : null].filter(Boolean).join(" · ") || "Universo Agustino"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
