import { pen } from "../../lib/api";
import { ConfirmModal } from "../ConfirmModal";
import type { useListingEditor } from "./useListingEditor";

// Pie común de los editores: aviso de precio congelado, mensajes y acciones.
export function EditorActions({ ed, title, liveOrders, oldPrice, newPrice, onSave }: {
  ed: ReturnType<typeof useListingEditor>;
  title: string;
  liveOrders: number;
  oldPrice: number;
  newPrice: number;
  onSave: () => void;
}) {
  return (
    <>
      {ed.msg && <p role="alert" className="text-xs font-semibold text-[#dc2626]">{ed.msg}</p>}
      {liveOrders > 0 && newPrice !== oldPrice && (
        <p className="rounded-lg border border-zinc-900 bg-[#fef3c7] px-3 py-2 text-xs font-semibold text-zinc-900">
          Tienes {liveOrders} pedido(s) activos con el precio anterior ({pen(oldPrice)}). El cambio solo aplicará a nuevas reservas.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={ed.busy} onClick={onSave} className="btn btn-primary btn-sm">Guardar cambios</button>
        {ed.pausedAt
          ? <button type="button" disabled={ed.busy} onClick={ed.resume} className="btn btn-secondary btn-sm">Reactivar</button>
          : <button type="button" disabled={ed.busy} onClick={ed.askPause} className="btn btn-secondary btn-sm">Pausar</button>}
        <button type="button" disabled={ed.busy} onClick={ed.askDelete} className="btn btn-secondary btn-sm text-[#dc2626]">Eliminar</button>
      </div>
      <ConfirmModal
        info={ed.confirmingPause ? { title: "Pausar publicación", message: `¿Pausar "${title}"? No aparecerá en el catálogo hasta que la reactives.`, confirmLabel: "Pausar" } : null}
        busy={false}
        onConfirm={ed.pause}
        onClose={ed.cancelPause}
      />
      <ConfirmModal
        info={ed.confirming ? { title: "Eliminar publicación", message: `¿Eliminar "${title}"? Esta acción no se puede deshacer.` } : null}
        busy={ed.busy}
        onConfirm={ed.remove}
        onClose={ed.cancelDelete}
      />
    </>
  );
}
