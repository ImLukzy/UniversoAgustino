import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { fmtDate, pen } from "../../lib/api";

export interface ReviewItem {
  id: string; type: "document" | "bazar"; title: string; priceCents: number; createdAt: string; previewUrl: string;
  description?: string | null; author: { id: string; email: string; fullName: string; approvedCount: number };
}
export function ReviewCard({ item, busy, decide }: {
  item: ReviewItem; busy: boolean; decide: (item: ReviewItem, reason?: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  function reject(event: FormEvent) { event.preventDefault(); decide(item, reason.trim()); }
  return (
    <article className="card flex min-w-0 flex-col gap-3 break-words p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 font-bold">{item.title}</h3><span className="price text-primary">{pen(item.priceCents)}</span>
      </div>
      <p className="text-sm text-zinc-600">{item.type === "document" ? "Documento" : "Bazar"} · {fmtDate(item.createdAt)}</p>
      <div className="min-w-0 text-sm"><p className="font-bold">{item.author.fullName || item.author.email}</p>
        <p className="break-all text-zinc-600">{item.author.email}</p><p>{item.author.approvedCount} publicaciones aprobadas</p></div>
      {item.description && <p className="text-sm text-zinc-700">{item.description}</p>}
      <Link to={item.previewUrl} target="_blank" rel="noreferrer" className="font-bold text-primary underline">Abrir vista previa</Link>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => decide(item)}>Aprobar</button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setRejecting(!rejecting)} aria-expanded={rejecting}>Rechazar</button>
      </div>
      {rejecting && <form onSubmit={reject} className="flex min-w-0 flex-col gap-2">
        <label htmlFor={`reason-${item.type}-${item.id}`} className="text-sm font-bold">Motivo del rechazo (10–300 caracteres)</label>
        <textarea id={`reason-${item.type}-${item.id}`} className="input w-full min-w-0" required minLength={10} maxLength={300}
          value={reason} onChange={(e) => setReason(e.target.value)} />
        <button type="submit" className="btn btn-secondary btn-sm w-fit" disabled={busy || reason.trim().length < 10}>Confirmar rechazo</button>
      </form>}
    </article>
  );
}
