import { Modal } from "./ui/Modal";

// Confirmación destructiva sobre el Modal único (reemplaza window.confirm).
interface ConfirmInfo {
  title: string;
  message: string;
  confirmLabel?: string;
}

export function ConfirmModal({ info, busy, onConfirm, onClose }: { info: ConfirmInfo | null; busy: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={!!info} onClose={onClose} locked={busy} role="alertdialog" label={info?.title}>
      <span className="material-symbols-outlined text-4xl text-[#dc2626]">warning</span>
      <h3 className="h-display mt-1 text-xl">{info?.title}</h3>
      <p className="mt-1 text-sm text-zinc-600">{info?.message}</p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onClose} disabled={busy} data-autofocus className="btn btn-secondary flex-1">
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className="btn flex-1 bg-[#dc2626] text-white">
          {busy ? "Eliminando…" : (info?.confirmLabel ?? "Eliminar")}
        </button>
      </div>
    </Modal>
  );
}
