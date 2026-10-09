import { useState } from "react";
import { api, apiError, fmtDate, pen } from "../../lib/api";
import { PrivateImage } from "../PrivateImage";
import { PayoutProofForm } from "./PayoutProofForm";
import type { PayoutRow } from "./payoutTypes";
export function PayoutCard({ row: p, admin, refreshed }: { row: PayoutRow; admin: boolean; refreshed: () => void }) {
  const [reason, setReason] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const resolve = async (refund = false) => {
    setBusy(true); setError(""); try { await api.post(`/staff/payouts/${p.id}/${refund ? "refund-required" : "resume"}`, { reason }); refreshed(); }
    catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  return <article className="card flex min-w-0 flex-col gap-3 p-4 sm:p-6">
    <h3 className="break-words font-semibold">{p.order.itemTitle}</h3>
    <p className="break-all text-sm">Vendedor: {p.seller?.profile?.fullName || p.seller?.email}</p>
    <p className="break-all text-sm">Comprador: {p.order.buyer?.profile?.fullName || p.order.buyer?.email}</p>
    <p className="text-lg font-bold">Monto a pagar: {pen(p.netCents)}</p>
    <p className="text-sm text-zinc-600">Precio {pen(p.amountCents)} · Comisión {pen(p.feeCents)} · {p.status === "COMPLETED" ? `Pagado ${fmtDate(p.completedAt)}` : `Vence ${fmtDate(p.dueAt)}`}</p>
    {p.status === "PENDING" && <><p className="break-all text-sm">{p.payMethod || "Método no indicado"} · {p.payDetail || "Solicita los datos de cobro al vendedor"}</p>
      {p.payQrUrl && <PrivateImage path={p.payQrUrl} alt="QR del vendedor" expandable />}<PayoutProofForm id={p.id} refreshed={refreshed} /></>}
    {p.status === "COMPLETED" && p.proofUrl && <PrivateImage path={p.proofUrl} alt="Comprobante de liquidación" expandable />}
    {p.paymentRef && <p className="break-all text-sm">Operación: {p.paymentRef}</p>}
    {p.status === "FROZEN" && <><p className="break-words text-sm">Congelada: {p.frozenReason}</p>{admin && !p.refundRequired ? <div className="flex flex-col gap-2">
      <label className="text-sm">Motivo de resolución<textarea className="input w-full" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} /></label>
      <button type="button" className="btn btn-secondary self-start" disabled={busy || reason.trim().length < 5} onClick={() => void resolve()}>Autorizar liquidación</button>
      <button type="button" className="btn btn-secondary !h-auto min-h-9 whitespace-normal self-start" disabled={busy || reason.trim().length < 5} onClick={() => void resolve(true)}>Marcar que requiere reembolso</button>
    </div> : <p className="text-sm">El Técnico debe revisar el reclamo.</p>}</>}
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
  </article>;
}
