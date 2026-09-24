import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "../../lib/motion";

// "Explicación experta": aparece al responder, abierta por defecto y
// plegable. Vive dentro del cuerpo con scroll de la tarjeta (sin CLS).
export function ExplanationBox({ correct, why }: { correct: boolean; why: string }) {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  // Al responder, el cuerpo de la tarjeta se desplaza para mostrarla entera
  // (o su cabecera arriba, si no cabe). Solo scroll interno: la página no se mueve.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const el = ref.current;
      const sc = el?.closest<HTMLElement>("[data-quiz-scroll]");
      if (!el || !sc) return;
      const fit = el.offsetTop + el.offsetHeight - sc.clientHeight + 8;
      sc.scrollTo({ top: Math.max(0, Math.min(fit, el.offsetTop - 8)), behavior: "smooth" });
    }, 350);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className={`mt-3 rounded-xl border-2 ${correct ? "border-primary bg-primary-soft" : "border-zinc-900 bg-zinc-50"}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-2.5 text-left">
        <span className={`material-symbols-outlined text-lg ${correct ? "text-primary" : "text-[#b91c1c]"}`} aria-hidden="true">
          {correct ? "check_circle" : "cancel"}
        </span>
        <span className="min-w-0 flex-1 text-sm">
          <b className={correct ? "text-zinc-950" : "text-[#b91c1c]"}>{correct ? "¡Correcto!" : "Incorrecto."}</b>
          <span className="text-zinc-600"> Explicación experta</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={SPRING} className="material-symbols-outlined text-xl text-zinc-500" aria-hidden="true">
          expand_more
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="why" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} className="overflow-hidden">
            <p className="px-4 pb-3 text-sm leading-relaxed text-zinc-700">{why}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
