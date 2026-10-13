import { useState } from "react";
import { api, apiError } from "../../lib/api";

const categories = [
  ["NOT_AS_DESCRIBED", "No es lo anunciado"],
  ["OTHER", "Contenido inapropiado o copiado"],
  ["OTHER", "Otro"],
] as const;

export function ReportListingForm({ type, listingId }: { type: "document" | "bazar"; listingId: string }) {
  const [categoryIndex, setCategoryIndex] = useState(0);
  const category = categories[categoryIndex][0];
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
      await api.post("/reports", { targetType: type, targetId: listingId, category, reason: reason.trim() });
      setMessage("Reporte enviado. El equipo lo revisará.");
      setReason("");
    } catch (cause) {
      setError(apiError(cause));
    } finally {
      setBusy(false);
    }
  };

  return <form onSubmit={submit} className="flex min-w-0 flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">Motivo del reporte</legend>
      {categories.map(([value, label], index) => <label key={`${value}-${index}`} className="flex min-w-0 items-center gap-2 text-sm">
        <input className="accent-primary" type="radio" name={`report-category-${listingId}`} value={value} checked={categoryIndex === index} onChange={() => setCategoryIndex(index)} />
        <span>{label}</span>
      </label>)}
    </fieldset>
    <label htmlFor={`report-reason-${listingId}`} className="flex min-w-0 flex-col gap-1 text-sm">Cuéntanos los detalles
      <textarea id={`report-reason-${listingId}`} aria-describedby={`report-count-${listingId}`} className="input min-h-24 w-full min-w-0" required minLength={10} maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} />
    </label>
    <p id={`report-count-${listingId}`} className="text-right text-xs text-zinc-500">{reason.length}/2000</p>
    {error && <p className="wrap-break-word text-sm text-[#b91c1c]" role="alert">{error}</p>}
    {message && <p className="text-sm text-zinc-700" role="status">{message}</p>}
    <button className="btn btn-primary btn-sm self-start" type="submit" disabled={busy || reason.trim().length < 10}>{busy ? "Enviando…" : "Enviar reporte"}</button>
  </form>;
}
