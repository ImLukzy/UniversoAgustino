import { lazy, Suspense, useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api, pen, type HubBazarItem, type HubDocument } from "../lib/api";
import { careerColor, careerLabel, careerSoft } from "../data/unsa";
import { careerContent } from "../data/careerContent";
// F4-04 p2: PagePreview arrastra pdfjs-dist (471 KB). Lazy para que el parseo
// solo ocurra cuando una tarjeta con preview realmente se renderiza, no en
// cada página que importa este módulo (/, /bazar y —por el grafo— /p/*).
const PagePreview = lazy(() => import("../components/PdfPreview").then((m) => ({ default: m.PagePreview })));
import { CardGridSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { useAuth } from "../auth/AuthContext";

const PAGE_SIZE = 9;

const CYCLE_MAP: Record<string, string[]> = {
  "c1-3": ["I", "II", "III"],
  "c4-6": ["IV", "V", "VI"],
  "c7-8": ["VII", "VIII"],
  "c9-10": ["IX", "X"],
};

// Ver detalle lleva a otra pestaña: visor protegido (/v/:id) para apuntes,
// detalle (/p/bazar/:id) para bazar. Ahí se crea el pedido y sigue el checkout.
function useGoDetail() {
  const nav = useNavigate();
  return (itemType: "document" | "bazar", id: string) =>
    nav(itemType === "document" ? `/v/${id}` : `/p/bazar/${id}`);
}

export interface LiveDocsFilters {
  q: string;
  cycle: string;
  career: string;
  docType: string;
  accentColor: string | null;
  emptyHint?: string;
}

// ---- Marketplace: datos reales UNSA con todos los filtros + paginación real + paleta de carrera ----
export function LiveDocuments({ q, cycle, career, docType, accentColor, emptyHint }: LiveDocsFilters) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [q, cycle, career, docType]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["live-documents", q, cycle, career, docType, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { pageSize: PAGE_SIZE, page, university: "UNSA" };
      if (q.trim()) params.q = q.trim();
      if (career && career !== "all") params.career = career;
      if (docType && docType !== "all") params.type = docType;
      const r = await api.get("/documents", { params });
      return r.data as { data: HubDocument[]; total: number; page: number; pageSize: number };
    },
  });
  const { user } = useAuth();
  const goDetail = useGoDetail();

  const accent = accentColor ?? "rgb(var(--hub-p, 0 104 95))";
  const cc = careerContent(career);
  const rows = (data?.data ?? []).filter((d) => {
    if (cycle && cycle !== "all") {
      const allowed = CYCLE_MAP[cycle];
      if (allowed && !allowed.includes((d.cycle || "").toUpperCase().trim())) return false;
    }
    return true;
  });

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {isLoading && <CardGridSkeleton count={PAGE_SIZE} gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg" />}
      {isError && (
        <p className="font-body-md text-body-md text-on-surface-variant">
          No se pudo conectar con la API. <button className="underline font-semibold" onClick={() => refetch()}>Reintentar</button>
        </p>
      )}
      {data && rows.length === 0 && (
        <div className="p-space-lg bg-surface-container-low rounded-xl">
          <EmptyState
            icon="description"
            title="Aún no hay recursos aquí"
            hint={user ? (emptyHint ?? "Sé la primera persona en publicar con el asistente de Monetiza.") : "Entra o crea tu cuenta para publicar el primer apunte."}
            action={
              !user ? (
                <Link to="/register" className="px-space-md py-space-xs rounded-lg text-white font-label-md text-label-md font-bold" style={{ backgroundColor: accent }}>Crear cuenta gratis</Link>
              ) : undefined
            }
          />
        </div>
      )}
      {/* Craftsmanship: AnimatePresence + enter/exit con spring (stiffness 400,
          damping 25). Sin prop `layout` a propósito: las imágenes lazy del
          preview recalculan geometría y el layout-anim layout haría jank. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((d) => (
            <motion.article
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.985 }}
              className="bg-surface-container-lowest rounded-xl flex flex-col justify-between border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              style={{ "--card-accent": accent } as CSSProperties}
            >
              <div className="relative h-44 overflow-hidden bg-surface-container">
                {d.fileUrl ? (
                  <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-200" aria-hidden="true" />}>
                    <PagePreview fileUrl={d.fileUrl} page={1} scale={0.7} careerImg={cc.imgQuote} title={d.title} imgClassName="h-full w-full object-cover object-top" />
                  </Suspense>
                ) : (
                  <div className="flex h-full w-full items-center gap-space-sm p-space-md">
                    <span className="material-symbols-outlined text-display" style={{ color: accent }}>description</span>
                    <div className="flex flex-col gap-space-xxs">
                      <span className="font-label-sm text-label-sm font-bold" style={{ color: accent }}>UNSA · {d.career ? careerLabel(d.career) : "General"}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{d.type} · Ciclo {d.cycle}</span>
                    </div>
                  </div>
                )}
                <span className="absolute bottom-2 right-2 px-space-sm py-space-xxs text-white rounded-lg font-price-tag text-price-tag shadow" style={{ backgroundColor: accent }}>{pen(d.priceCents)}</span>
              </div>
              <div className="flex flex-col gap-space-sm p-space-md">
                <div className="flex flex-wrap items-center gap-space-xxs">
                  <span className="px-space-xs py-space-xxs bg-surface-container-lowest/95 rounded-full font-label-sm text-label-sm font-bold" style={{ color: accent }}>UNSA</span>
                  {d.career && (
                    <span
                      className="px-space-xs py-space-xxs rounded-full font-label-sm text-label-sm font-semibold"
                      style={{ backgroundColor: careerSoft(d.career), color: careerColor(d.career) }}
                    >
                      {careerLabel(d.career)}
                    </span>
                  )}
                  <span className="px-space-xs py-space-xxs bg-tertiary text-on-tertiary rounded-full font-label-sm text-label-sm font-semibold">{d.type}</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold line-clamp-2 leading-snug transition-colors group-hover:text-[var(--card-accent)]">{d.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {d.course} · Ciclo {d.cycle}
                  {d.author?.profile?.fullName ? ` · ${d.author.profile.fullName}` : ""}
                </p>
                {d.description && <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">{d.description}</p>}
              </div>
              <div className="flex flex-col gap-space-xs p-space-md pt-0">
                <button
                  onClick={() => goDetail("document", d.id)}
                  className="px-space-sm py-space-xs rounded-lg text-white font-label-md text-label-md font-bold transition-colors flex items-center justify-center gap-space-xxs shadow-sm"
                  style={{ backgroundColor: accent }}
                >
                  <span className="material-symbols-outlined text-title-sm">visibility</span>
                  {user ? "Ver detalle" : "Entrar y ver detalle"}
                </button>
                <span className="text-[10px] text-center text-outline">Compra en custodia: se libera al confirmar recepción</span>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      {data && total > 0 && (
        <div className="mt-space-xl flex flex-col sm:flex-row items-center justify-between gap-space-md p-space-md bg-surface-container-lowest rounded-xl shadow-sm">
          <span className="font-body-sm text-body-sm text-on-surface-variant">Página {page} de {pages} • {total} recurso(s) para Arequipa</span>
          <div className="flex items-center gap-space-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-space-md py-space-xs rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-space-md py-space-xs rounded-lg text-white font-label-md text-label-md font-semibold" style={{ backgroundColor: accent }}>{page}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Bazar: datos reales, filtros Stitch (all/libros/instrumental/uniformes/alquiler) ----
export function LiveBazarItems({ filter, q, accentColor }: { filter: string; q: string; accentColor?: string | null }) {
  const accentBg = accentColor ? { backgroundColor: accentColor } : undefined;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["live-bazar", q],
    queryFn: async () => {
      const r = await api.get("/bazar", { params: { q: q.trim() || undefined, pageSize: 24 } });
      return r.data as { data: HubBazarItem[]; total: number };
    },
  });
  const { user } = useAuth();
  const goDetail = useGoDetail();

  const rows = (data?.data ?? []).filter((b) => {
    if (filter === "all") return true;
    if (filter === "libros") return b.kind === "LIBRO";
    if (filter === "instrumental") return b.kind === "INSTRUMENTO";
    if (filter === "uniformes") return b.kind === "SCRUB";
    if (filter === "alquiler") return b.tx === "ALQUILER";
    return true;
  });

  return (
    <div>
      {isLoading && <CardGridSkeleton count={6} gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg" />}
      {isError && (
        <p className="font-body-md text-body-md text-on-surface-variant">
          No se pudo conectar con la API. <button className="underline font-semibold" onClick={() => refetch()}>Reintentar</button>
        </p>
      )}
      {data && rows.length === 0 && (
        <div className="p-space-lg bg-surface-container-low rounded-xl">
          <EmptyState
            icon="storefront"
            title="Bazar vacío en este filtro"
            hint={user ? "Publica el primer artículo con el botón Publicar." : "Entra o crea tu cuenta para publicar."}
            action={
              !user ? (
                <Link to="/register" className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold" style={accentBg}>Crear cuenta gratis</Link>
              ) : undefined
            }
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((b) => (
            <motion.article
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.985 }}
              className="flex flex-col rounded-xl bg-surface-container-lowest border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              style={{ "--card-accent": accentColor ?? "rgb(var(--hub-p, 0 104 95))" } as CSSProperties}
            >
              {b.photos?.[0] && (
                <div className="relative">
                  <img src={b.photos[0]} alt={b.title} loading="lazy" className="h-44 w-full object-cover" />
                  {(b.photos?.length ?? 0) > 1 && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white">
                      +{(b.photos?.length ?? 1) - 1} fotos
                    </span>
                  )}
                </div>
              )}
              <div className="p-space-lg flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-space-xs mb-space-xs">
                    <span className="px-space-sm py-space-xxs rounded-full bg-surface-container-lowest/90 font-label-sm text-label-sm text-on-surface font-semibold shadow-sm">{b.kind}</span>
                    <span className="px-space-sm py-space-xxs rounded-full bg-tertiary text-on-tertiary font-label-sm text-label-sm shadow-sm">{b.tx}</span>
                    <span className="px-space-sm py-space-xxs rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant">{b.status}</span>
                  </div>
                  <h3 className="font-title-lg text-title-lg text-on-surface transition-colors group-hover:text-[var(--card-accent)] leading-snug">{b.title}</h3>
                  {b.description && <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{b.description}</p>}
                </div>
                <div className="mt-space-md pt-space-md bg-surface-container-low -mx-space-lg -mb-space-lg p-space-lg rounded-b-xl flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-space-sm py-space-xxs bg-primary text-on-primary rounded-lg font-price-tag text-price-tag shadow" style={accentBg}>{pen(b.priceCents)}</span>
                    {b.depositCents ? <span className="font-label-sm text-label-sm text-on-surface-variant">Garantía {pen(b.depositCents)}</span> : null}
                  </div>
                  <button
                    onClick={() => goDetail("bazar", b.id)}
                    className="px-space-sm py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors shadow-sm disabled:opacity-60" style={accentBg}
                  >
                    {user ? "Ver y reservar" : "Entrar y reservar"}
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
