import { motion, AnimatePresence } from "framer-motion";
import type { ToastItem } from "../context/ToastContext";
import { SPRING } from "../lib/motion";

// Pila visual de toasts (Sprint 3). role=status/alert para lector de pantalla,
// botón de cierre con aria-label, tarjeta .card del sistema de diseño con color por tono.
// Craftsmanship: entrada slide+fade con spring, salida con fade; el viewport
// siempre montado para conservar la animación de salida.
const TONE: Record<ToastItem["tone"], { wrap: string; icon: string; iconName: string }> = {
  success: {
    wrap: "bg-[#dcfce7]",
    icon: "text-[#15803d]",
    iconName: "check_circle",
  },
  error: {
    wrap: "bg-[#fee2e2]",
    icon: "text-[#b91c1c]",
    iconName: "error",
  },
  info: {
    wrap: "bg-white",
    icon: "text-primary",
    iconName: "info",
  },
};

export function ToastStack({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
      <AnimatePresence>
        {items.map((t) => {
          const s = TONE[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={SPRING}
              role={t.tone === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 card px-3 py-2.5 text-zinc-950 ${s.wrap}`}
            >
              <span className={`material-symbols-outlined text-xl ${s.icon}`}>{s.iconName}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug">{t.title}</p>
                {t.detail && <p className="mt-0.5 break-words text-xs opacity-80">{t.detail}</p>}
              </div>
              <motion.button
                onClick={() => onDismiss(t.id)}
                aria-label="Descartar notificación"
                whileTap={{ scale: 0.9 }}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors hover:bg-black/5"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
