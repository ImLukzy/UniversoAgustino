import { useState } from "react";
import { api, apiError } from "../../lib/api";

const CATEGORIES = [
  ["NO_SHOW", "No se presentó"],
  ["NO_PRODUCT", "No llevó el producto"],
  ["NOT_AS_DESCRIBED", "No es lo anunciado"],
  ["OTHER", "Otro"],
] as const;

export function ReportSellerForm({ orderId }: { orderId: string }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number][0]>("NO_SHOW");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || reason.trim().length < 10) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.post("/reports", { targetType: "order", targetId: orderId, category, reason: reason.trim() });
      setMessage("Reporte enviado. El equipo lo revisará.");
      setReason("");
    } catch (cause) {
      setError(apiError(cause));
    } finally {
      setBusy(false);
    }
  };

  return <form className="flex min-w-0 flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3" onSubmit={submit}>
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">¿Qué ocurrió?</legend>
      {CATEGORIES.map(([value, label]) => <label key={value} className="flex min-w-0 items-center gap-2 text-sm">
        <input className="accent-primary" type="radio" name={`report-category-${orderId}`} value={value} checked={category === value} onChange={() => setCategory(value)} />
        <span>{label}</span>
      </label>)}
    </fieldset>
    <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor={`report-reason-${orderId}`}>Cuéntanos los detalles
      <textarea id={`report-reason-${orderId}`} aria-describedby={`report-count-${orderId}`} className="input min-h-24 w-full min-w-0" required minLength={10} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} />
    </label>
    <p id={`report-count-${orderId}`} className="text-right text-xs text-zinc-500">{reason.length}/2000</p>
    {error && <p className="break-words text-sm text-[#b91c1c]" role="alert">{error}</p>}
    {message && <p className="text-sm text-zinc-700" role="status">{message}</p>}
    <button className="btn btn-primary btn-sm self-start" type="submit" disabled={busy || reason.trim().length < 10}>
      {busy ? "Enviando…" : "Enviar reporte"}
    </button>
  </form>;
}
