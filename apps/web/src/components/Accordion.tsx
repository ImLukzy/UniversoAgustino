import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "../lib/motion";

// Acordeón único de la app (FAQ landing, Monetiza, Legal): <button> con
// aria-expanded + región con aria-labelledby; un ítem abierto a la vez.
// Variante "rows" = filas con borde inferior; "cards" = tarjetas sólidas.
interface AccordionItem {
  id: string;
  icon?: string;
  eyebrow?: string;
  title: string;
  body: ReactNode;
}

export function Accordion({ items, defaultOpen = -1, variant = "cards" }: { items: AccordionItem[]; defaultOpen?: number; variant?: "cards" | "rows" }) {
  const [open, setOpen] = useState(defaultOpen);
  const rows = variant === "rows";
  return (
    <div className={rows ? "border-t-2 border-zinc-900" : "flex flex-col gap-3"}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.id} className={rows ? "border-b border-zinc-300" : "card overflow-hidden"}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              aria-controls={`acc-panel-${it.id}`}
              id={`acc-button-${it.id}`}
              className={`flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${rows ? "py-6" : "p-5"}`}
            >
              <span className="flex min-w-0 items-center gap-3">
                {it.icon && <span className="material-symbols-outlined shrink-0 text-2xl text-primary">{it.icon}</span>}
                <span className="min-w-0">
                  {it.eyebrow && <span className="eyebrow block">{it.eyebrow}</span>}
                  <span className="block font-bold text-zinc-950">{it.title}</span>
                </span>
              </span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={SPRING} className="material-symbols-outlined shrink-0 text-zinc-700" aria-hidden="true">
                expand_more
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`acc-panel-${it.id}`}
                  role="region"
                  aria-labelledby={`acc-button-${it.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={SPRING}
                  className="overflow-hidden"
                >
                  <div className={`max-w-3xl leading-relaxed text-zinc-600 ${rows ? "pb-6" : "px-5 pb-5"}`}>{it.body}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
