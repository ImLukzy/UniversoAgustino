import { useState } from "react";
import { api, apiError } from "../../lib/api";
import type { CaseSave } from "./caseTypes";

export function ReturnForm({ caseId, busy, save }: { caseId: string; busy: boolean; save: CaseSave }) {
  const [condition, setCondition] = useState("OK"), [note, setNote] = useState(""), [confirmed, setConfirmed] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null), [uploading, setUploading] = useState(false), [error, setError] = useState("");
  return <form className="flex min-w-0 flex-col gap-3" onSubmit={async (e) => {
    e.preventDefault(); setError(""); setUploading(true);
    try { let photoUrl: string | undefined;
      if (photo) { const form = new FormData(); form.append("file", photo); photoUrl = (await api.post("/uploads", form)).data.data.url; }
      await save(`/staff/cases/${caseId}/return`, { condition, conditionNote: note, photoUrl, reviewConfirmed: confirmed });
    } catch (err) { setError(apiError(err)); } finally { setUploading(false); }
  }}>
    <h3 className="font-bold">Revisar devolución del alquiler</h3>
    <label className="flex flex-col gap-1 text-sm" htmlFor={`condition-${caseId}`}>Estado revisado
      <select id={`condition-${caseId}`} className="input" value={condition} onChange={(e) => setCondition(e.target.value)}><option value="OK">Conforme</option><option value="DAMAGED">Con observaciones</option></select></label>
    <label className="flex flex-col gap-1 text-sm" htmlFor={`return-note-${caseId}`}>Nota de revisión (5–500 caracteres)
      <textarea id={`return-note-${caseId}`} className="input min-h-24" required minLength={5} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></label>
    <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor={`return-photo-${caseId}`}>Foto de devolución (opcional, JPG o PNG)
      <input id={`return-photo-${caseId}`} className="input w-full min-w-0" type="file" accept="image/jpeg,image/png" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></label>
    <label className="flex items-start gap-2 text-sm" htmlFor={`return-confirm-${caseId}`}><input id={`return-confirm-${caseId}`} type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />Recibí el objeto y revisé su estado. Queda bajo custodia hasta devolverlo al vendedor.</label>
    {error && <p role="alert">{error}</p>}<button type="submit" disabled={busy || uploading || !confirmed || note.trim().length < 5} className="btn btn-primary self-start">{uploading ? "Guardando…" : "Registrar devolución revisada"}</button>
  </form>;
}
