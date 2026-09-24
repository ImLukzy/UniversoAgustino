import { Modal } from "../ui/Modal";

export type QrInfo = { title: string; price: string; method: string; qr: string | null; detail: string };

// QR de cobro de una publicación (lo que ve el comprador al pagar).
export function QrModal({ info, onClose }: { info: QrInfo | null; onClose: () => void }) {
  return (
    <Modal open={!!info} onClose={onClose} label={info ? `Cobro de ${info.title}` : undefined}>
      <div className="flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-4xl text-primary">qr_code_2</span>
        <h3 className="h-display mt-1 text-xl">Cobro de material</h3>
        <p className="max-w-full truncate text-sm text-zinc-600">{info?.title}</p>
        <div className="my-4 rounded-xl border-2 border-zinc-900 bg-white p-3">
          {info?.qr ? (
            <img src={info.qr} alt={`QR de cobro · ${info.title}`} className="h-44 w-44 object-cover" />
          ) : (
            <p className="max-w-[220px] text-xs text-zinc-500">Esta publicación aún no tiene QR. Edítala para subirlo.</p>
          )}
        </div>
        <p className="price text-2xl text-primary">{info?.price}</p>
        <p className="mt-1 text-xs text-zinc-500">{info?.method}{info?.detail ? ` · ${info.detail}` : ""}</p>
        <button type="button" onClick={onClose} data-autofocus className="btn btn-dark mt-5 w-full">Listo</button>
      </div>
    </Modal>
  );
}
