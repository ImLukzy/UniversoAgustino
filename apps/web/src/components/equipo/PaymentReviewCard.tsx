import { useState } from "react";
import { api, apiError, pen, type HubOrder } from "../../lib/api";
import { PrivateImage } from "../PrivateImage";
interface PendingPayment extends HubOrder { document?: { course: string; description?: string | null }; }
export function PaymentReviewCard({ order, refreshed }: { order: PendingPayment; refreshed: () => void }) {
  const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const review = async (accept: boolean) => {
    if (accept && !window.confirm("¿Verificaste el abono en el historial real de la cuenta destino? Aceptar atribuye el apunte al comprador.")) return;
    setBusy(true); setError("");
    try { await api.post(`/staff/payments/${order.id}/${accept ? "accept" : "deny"}`, accept ? {} : { reason }); refreshed(); }
    catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  return <article className="card flex min-w-0 flex-col gap-3 p-5">
    <h3 className="break-words font-bold">{order.itemTitle}</h3>
    <p className="break-words text-sm">{order.document?.course} · {order.document?.description}</p>
    <p className="break-words text-sm">Comprador: {order.buyer?.profile?.fullName || order.buyer?.email} · {pen(order.amountCents)}</p>
    <p className="break-words text-sm">Destino: {order.payHolder} · {order.payMethod} · {order.payDetail}</p>
    {order.payProof && <p className="break-words text-sm">Operación: {order.payProof}</p>}
    {order.payProofUrl && <PrivateImage expandable path={order.payProofUrl} alt="Comprobante del comprador" />}
    <p className="text-sm text-zinc-600">Comprueba el abono en tu aplicación antes de aceptar. La foto por sí sola no confirma el dinero.</p>
    <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void review(true)}>Aceptar pago</button>
    <label className="flex min-w-0 flex-col gap-1 text-sm">Motivo para denegar (5–300 caracteres)<textarea className="input w-full min-w-0" value={reason} minLength={5} maxLength={300} onChange={(e) => setReason(e.target.value)} /></label>
    <button type="button" className="btn btn-secondary" disabled={busy || reason.trim().length < 5} onClick={() => void review(false)}>Denegar comprobante</button>
    {error && <p role="alert" className="break-words text-sm text-[#b91c1c]">{error}</p>}
  </article>;
}
