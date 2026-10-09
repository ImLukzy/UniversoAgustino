import { useState, type FormEvent } from "react";
import { api, apiError } from "../../lib/api";
export function PaymentClaim({ orderId }: { orderId: string }) {
  const [reason, setReason] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [sent, setSent] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    try { await api.post("/reports", { targetType: "order", targetId: orderId, reason }); setSent(true); }
    catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  if (sent) return <p role="status">Reclamo enviado. Si la liquidación estaba pendiente, quedó congelada para revisión del Técnico.</p>;
  return <form className="flex flex-col gap-2" onSubmit={submit}><label className="text-sm">¿El producto no coincide con lo anunciado?
    <textarea className="input mt-1 w-full" value={reason} maxLength={2000} onChange={(e) => setReason(e.target.value)} placeholder="Describe el problema (mínimo10 caracteres)" /></label>
    <p className="text-xs text-zinc-600">Si el equipo aún no liquidó, tu reclamo congela el pago al vendedor.</p>{error && <p role="alert">{error}</p>}
    <button className="btn btn-secondary self-start" disabled={busy || reason.trim().length < 10}>{busy ? "Enviando…" : "Enviar reclamo"}</button></form>;
}
