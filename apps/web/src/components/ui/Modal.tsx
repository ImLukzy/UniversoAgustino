import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "../../lib/motion";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modal único de la app (auth, confirmaciones, QR): overlay con blur, tarjeta
// .card con spring 400/30, focus trap, Esc, cierre por backdrop y foco inicial
// en el primer [data-autofocus]; al cerrar, el foco vuelve a quien lo abrió.
export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  label,
  role = "dialog",
  locked = false,
  className = "max-w-sm",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  label?: string;
  role?: "dialog" | "alertdialog";
  locked?: boolean;
  className?: string;
}) {
  const card = useRef<HTMLDivElement>(null);
  const close = () => {
    if (!locked) onClose();
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => card.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return !locked && onClose();
      if (e.key !== "Tab" || !card.current) return;
      const items = [...card.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => getComputedStyle(el).visibility !== "hidden");
      if (!items.length) return;
      const [first, last] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose, locked]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            ref={card}
            role={role}
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-label={label}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={SPRING}
            className={`card relative max-h-[92vh] w-full overflow-y-auto p-7 ${className}`}
          >
            <button type="button" onClick={close} disabled={locked} aria-label="Cerrar" className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
