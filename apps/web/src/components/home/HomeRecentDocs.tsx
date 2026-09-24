import { motion } from "framer-motion";
import { DocumentCard } from "../DocumentCard";
import { EmptyState } from "../EmptyState";
import type { HubDocument } from "../../lib/api";
import { SPRING } from "../../lib/motion";

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] justify-items-center gap-6 sm:justify-items-start";

// "Añadidos recientemente": grilla limpia de DocumentCard. Los skeletons
// reservan el mismo alto/ancho que la card para evitar layout shift.
export function HomeRecentDocs({ docs, loading, searching }: { docs: HubDocument[]; loading: boolean; searching: boolean }) {
  return (
    <section className="px-4 pb-16">
      <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
        <span className="h-5 w-1 rounded-full bg-primary theme-transition" aria-hidden="true" />
        {searching ? "Resultados" : "Añadidos recientemente"}</h2>
      <p className="mt-1 text-sm text-zinc-500">
        {searching ? "Documentos que coinciden con tu búsqueda." : "Lo último que subieron estudiantes de tu universidad."}
      </p>
      <div className="mt-6 min-h-[15rem]">
        {loading ? (
          <div className={GRID} aria-label="Cargando documentos">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[15.5rem] w-48 animate-pulse rounded-xl bg-zinc-100" aria-hidden="true" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-2xl border border-zinc-100 bg-white p-6">
            <EmptyState
              icon="description"
              title={searching ? "Sin resultados" : "Aún no hay documentos aquí"}
              hint={searching ? "Prueba con otro curso o tema." : "Vuelve pronto: el catálogo crece cada semana."}
            />
          </div>
        ) : (
          <div className={GRID}>
            {docs.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: Math.min(i, 8) * 0.03 }}
              >
                <DocumentCard doc={d} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
