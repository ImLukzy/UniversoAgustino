import { AnimatePresence, motion } from "framer-motion";
import { DocumentCard } from "../DocumentCard";
import { EmptyState } from "../EmptyState";
import { BazarCard } from "./BazarCard";
import type { CatalogEntry } from "../../lib/useCatalog";
import { SPRING } from "../../lib/motion";

const CATALOG_GRID = "grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] justify-items-center gap-6 sm:justify-items-start";

// Grilla híbrida: apuntes (gratis / de pago) y productos del bazar comparten
// geometría. `layout` solo en los contenedores de celda (nunca en <img> lazy);
// los skeletons reservan el alto exacto de la card (CLS≈0).
export function CatalogGrid({ entries, loading, error, onRetry }: { entries: CatalogEntry[]; loading: boolean; error: boolean; onRetry: () => void }) {
  if (loading) {
    return (
      <div className={CATALOG_GRID} aria-label="Cargando catálogo">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[15.5rem] w-48 animate-pulse rounded-xl bg-zinc-100" aria-hidden="true" />
        ))}
      </div>
    );
  }
  if (error && entries.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500">
        No se pudo cargar el catálogo.{" "}
        <button type="button" onClick={onRetry} className="font-semibold text-primary underline">Reintentar</button>
      </p>
    );
  }
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-100 bg-white p-6">
        <EmptyState icon="search" title="Sin resultados" hint="Prueba con otro filtro o término de búsqueda." />
      </div>
    );
  }
  return (
    <motion.div layout transition={SPRING} className={CATALOG_GRID}>
      <AnimatePresence mode="popLayout" initial={false}>
        {entries.map((e) => (
          <motion.div
            key={`${e.kind}-${e.item.id}`}
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={SPRING}
          >
            {e.kind === "doc" ? <DocumentCard doc={e.item} /> : <BazarCard item={e.item} />}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
