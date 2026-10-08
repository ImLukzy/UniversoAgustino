import { useState } from "react";
import { api, apiError } from "../../lib/api";
import type { CaseSave } from "./caseTypes";

export function ReceiveForm({ caseId, busy, save }: { caseId: string; busy: boolean; save: CaseSave }) {
  const [photo, setPhoto] = useState<File | null>(null), [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false), [error, setError] = useState("");
  return <form className="flex min-w-0 flex-col gap-2" onSubmit={async (e) => {
    e.preventDefault(); if (!photo) return; setUploading(true); setError("");
    try { const form = new FormData(); form.append("file", photo); const result = await api.post("/uploads", form);
      await save(`/staff/cases/${caseId}/receive`, { photoUrl: result.data.data.url, conditionNote: note });
    } catch (err) { setError(apiError(err)); } finally { setUploading(false); }
  }}>
    <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor={`photo-${caseId}`}>Foto del objeto (JPG o PNG)
      <input id={`photo-${caseId}`} className="input w-full min-w-0" type="file" accept="image/jpeg,image/png" required onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></label>
    <label className="flex flex-col gap-1 text-sm" htmlFor={`note-${caseId}`}>Estado del objeto (5–500 caracteres)
      <textarea id={`note-${caseId}`} className="input min-h-24" required minLength={5} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></label>
    {error && <p role="alert">{error}</p>}<button type="submit" disabled={busy || uploading || !photo || note.trim().length < 5} className="btn btn-primary self-start">{uploading ? "Guardando…" : "Recibir objeto"}</button>
  </form>;
}
