import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";

export function SellerPaymentActions({ orderId, confirmedAt }: { orderId: string; confirmedAt: string | null }) {
  const qc = useQueryClient(), [busy, setBusy] = useState(false), [reporting, setReporting] = useState(false), [reason, setReason] = useState(""), [message, setMessage] = useState("");
  const post = async (path: string, body?: unknown) => {
    setBusy(true); setMessage("");
    try { await api.post(path, body); setMessage(body ? "Reporte abierto. El equipo revisará el cobro." : "Cobro confirmado."); setReporting(false); await qc.invalidateQueries({ queryKey: ["case", orderId] }); }
    catch (error) { setMessage(apiError(error)); } finally { setBusy(false); }
  };
  return <div className="flex min-w-0 flex-col gap-2">
    {confirmedAt ? <p className="font-bold">Cobro confirmado por ti.</p> : <button type="button" disabled={busy} className="btn btn-primary btn-sm self-start" onClick={() => { if (window.confirm("¿Confirmas que recibiste el pago registrado por el trabajador?")) void post(`/cases/order/${orderId}/confirm-payment`); }}>Confirmar cobro</button>}
    <button type="button" disabled={busy} className="btn btn-secondary btn-sm self-start" onClick={() => setReporting(true)}>No recibí el pago</button>
    {reporting && <form className="flex min-w-0 flex-col gap-2" onSubmit={(e) => { e.preventDefault(); void post(`/cases/order/${orderId}/payment-report`, { reason: reason.trim() }); }}>
      <label className="flex flex-col gap-1 text-sm" htmlFor={`payment-report-${orderId}`}>Describe el problema (5–500 caracteres)
        <textarea id={`payment-report-${orderId}`} required minLength={5} maxLength={500} className="input min-h-20" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      <div className="flex flex-wrap gap-2"><button type="submit" disabled={busy || reason.trim().length < 5} className="btn btn-primary btn-sm">Abrir reporte</button><button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setReporting(false)}>Volver</button></div>
    </form>}
    <p className="min-h-5 break-words text-sm" role="status">{message}</p>
  </div>;
}
