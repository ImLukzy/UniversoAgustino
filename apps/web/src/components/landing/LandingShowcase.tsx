import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ROUTES } from "../../lib/routes";
import { Reveal } from "./Reveal";
import { SPRING } from "../../lib/motion";
import { AREAS, byArea, SHOWCASE, TOP_COURSES, type Area } from "../../data/landingCareers";
import { ChipTabs } from "./ChipTabs";

// Escuelas UNSA (spec 17): cada tarjeta abre /explorar?career=KEY, que filtra
// el catálogo y aplica el color de la escuela. El cambio de área anima la
// grilla con layout (solo tras una interacción: no cuenta como CLS).
export function LandingShowcase() {
  const [area, setArea] = useState<Area>("Todas");
  const list = byArea(area);

  return (
    <section id="carreras" className="scroll-mt-4 bg-zinc-50 py-20 sm:py-24">
      <Reveal className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-balance font-display text-4xl font-extrabold leading-tight tracking-tight text-zinc-950 sm:text-5xl">Explora lo que estudian en la UNSA</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 sm:text-xl">{SHOWCASE.length} escuelas profesionales. Elige la tuya y encuentra el material de tus cursos.</p>
        <ChipTabs
          id="showcase-filter"
          label="Área"
          items={AREAS.map((f) => ({ value: f, label: <>{f} <span className="opacity-60">{byArea(f).length}</span></> }))}
          value={area}
          onChange={setArea}
        />
      </Reveal>
      <motion.ul layout className="mx-auto mt-10 grid max-w-6xl grid-cols-1 content-start gap-4 px-4 text-left sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {list.map((c) => (
            <motion.li key={c.key} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={SPRING}>
              <Link to={`${ROUTES.explore}?career=${c.key}`} className="card card-hover flex h-full items-start gap-4 p-4">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-900 text-2xl"
                  style={{ background: c.soft, color: c.color }}
                >
                  {c.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold leading-tight text-zinc-950">{c.label}</span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-zinc-500">{c.faculty}</span>
                  <span className="mt-2 block text-sm leading-snug text-zinc-600">{c.courses}</span>
                </span>
                <span aria-hidden="true" className="material-symbols-outlined self-center text-zinc-400">arrow_forward</span>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      <div className="mx-auto mt-12 max-w-4xl px-4 text-center">
        <p className="eyebrow">Cursos destacados</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {TOP_COURSES.map((c) => (
            <Link key={c} to={`${ROUTES.explore}?q=${encodeURIComponent(c)}`} className="chip">
              {c}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
