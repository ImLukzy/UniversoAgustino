import type { ToastItem } from "../context/ToastContext";

// Pila visual de toasts (Sprint 3). role=status/alert para lector de pantalla,
// botón de cierre con aria-label, colores por tono con el sistema existente.
const TONE: Record<ToastItem["tone"], { wrap: string; icon: string; iconName: string }> = {
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: "text-emerald-700",
    iconName: "check_circle",
  },
  error: {
    wrap: "border-red-200 bg-red-50 text-red-900",
    icon: "text-red-600",
    iconName: "error",
  },
  info: {
    wrap: "border-indigo-200 bg-indigo-50 text-indigo-900",
    icon: "text-indigo-700",
    iconName: "info",
  },
};

export function ToastStack({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  if (items.length === 0) return null;
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
      {items.map((t) => {
        const s = TONE[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border px-3 py-2.5 shadow-lg ${s.wrap}`}
          >
            <span className={`material-symbols-outlined text-xl ${s.icon}`}>{s.iconName}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-snug">{t.title}</p>
              {t.detail && <p className="mt-0.5 break-words text-xs opacity-80">{t.detail}</p>}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Descartar notificación"
              className="rounded-full p-1 transition-colors hover:bg-black/5"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
