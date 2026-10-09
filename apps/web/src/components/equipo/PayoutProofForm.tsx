import { useState, type FormEvent } from "react";
import { API_ORIGIN, api, apiError, uploadFileWithProgress } from "../../lib/api";
export function PayoutProofForm({ id, refreshed, refund = false }: { id: string; refreshed: () => void; refund?: boolean }) {
  const [proof, setProof] = useState(""), [ref, setRef] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [progress, setProgress] = useState<number | null>(null);
  const upload = async (file?: File) => {
    if (!file) return; setError(""); setProof("");
    if (!["image/png", "image/jpeg"].includes(file.type)) return setError("Adjunta una foto JPG o PNG.");
    setProgress(0);
    try { setProof((await uploadFileWithProgress(file, setProgress, "payment-proof")).replace(API_ORIGIN, "")); }
    catch (e) { setError(apiError(e)); } finally { setProgress(null); }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!proof || progress !== null || busy) return;
    if (!window.confirm(refund ? "¿Ya devolviste al comprador el precio completo indicado? Se revocará el acceso digital." : "¿Ya pagaste al vendedor el neto indicado? El comprobante quedará visible en Mis cobros.")) return;
    setBusy(true); setError("");
    try { await api.post(`/staff/payouts/${id}/${refund ? "refund" : "complete"}`, { proofUrl: proof, paymentRef: ref.trim() || undefined }); refreshed(); }
    catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  return <form className="flex min-w-0 flex-col gap-3" onSubmit={submit}>
    <label className="flex min-w-0 flex-col gap-1 text-sm">{refund ? "Foto del reembolso al comprador (obligatoria)" : "Foto del pago al vendedor (obligatoria)"}
      <input className="input max-w-full min-w-0 text-xs" type="file" accept="image/jpeg,image/png" disabled={busy || progress !== null} onChange={(e) => void upload(e.target.files?.[0])} /></label>
    {progress !== null && <p role="status">Subiendo: {progress}%</p>}{proof && <p role="status">Foto adjunta</p>}
    <label className="flex flex-col gap-1 text-sm">N.º de operación (opcional)<input className="input" maxLength={160} value={ref} disabled={busy} onChange={(e) => setRef(e.target.value)} /></label>
    {error && <p role="alert" className="break-words text-sm text-error">{error}</p>}
    <button className="btn btn-primary self-start" disabled={busy || !proof || progress !== null || (!!ref.trim() && ref.trim().length < 3)}>{busy ? "Guardando…" : refund ? "Registrar reembolso" : "Registrar liquidación"}</button>
  </form>;
}
