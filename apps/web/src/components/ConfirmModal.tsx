import { useEffect } from "react";

// Confirmación destructiva con el mismo lenguaje visual que QrModal
// (overlay fijo, tarjeta centrada, cierre por backdrop/Escape/Botón).
// Reemplaza a window.confirm para no romper el diseño ni bloquear el hilo.
export interface ConfirmInfo {
  title: string;
  message: string;
  confirmLabel?: string;
}

export function ConfirmModal({
  info,
  busy,
  onConfirm,
  onClose,
}: {
  info: ConfirmInfo | null;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!info) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [info, onClose]);

  if (!info) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={info.title}
        className="relative flex w-full max-w-sm flex-col rounded-2xl bg-white p-5 shadow-2xl"
      >
        <button
          onClick={onClose}
          disabled={busy}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-50"
          aria-label="Cancelar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <span className="material-symbols-outlined mb-1 text-4xl text-red-600">warning</span>
        <h3 className="font-display text-lg font-extrabold">{info.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{info.message}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-lg border border-red-200 bg-red-600 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Eliminando…" : (info.confirmLabel ?? "Eliminar")}
          </button>
        </div>
      </div>
    </div>
  );
}
