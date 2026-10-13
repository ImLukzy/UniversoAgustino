import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { fmtDate } from "../../lib/api";
import { SanctionForm } from "./SanctionForm";

export type ReportEntry = {
  id: string;
  targetType: string;
  targetId: string;
  category?: string | null;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: { id: string; nombre: string } | null;
  owner?: { id: string; nombre: string; correo: string } | null;
  publication?: { type: string; id: string; title: string };
};
type Decision = "ACTIONED" | "DISMISSED";
const CATEGORIES: Record<string, string> = { NO_SHOW: "No se presentó", NO_PRODUCT: "No llevó el producto", NOT_AS_DESCRIBED: "No es lo anunciado", OTHER: "Otro" };

export function ReportCard({ report, admin, busy, onAction }: { report: ReportEntry; admin: boolean; busy: boolean; onAction: (id: string, decision: Decision, reason?: string) => void }) {
  const [removing, setRemoving] = useState(false), [reason, setReason] = useState(""), [sanctioning, setSanctioning] = useState(false), [message, setMessage] = useState("");
  const submitRemoval = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!busy && reason.trim().length >= 10) onAction(report.id, "ACTIONED", reason.trim());
  };
  return <article className="card flex min-w-0 flex-col gap-3 break-words p-5 text-sm">
    <header className="flex min-w-0 flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><p className="font-bold">{CATEGORIES[report.category ?? ""] ?? "Otro"}</p><p className="text-xs text-zinc-500">{fmtDate(report.createdAt)} · {report.status === "OPEN" ? "Abierta" : "Resuelta"}</p></div>
      <span className="tag">{report.targetType}</span>
    </header>
    <p className="whitespace-pre-wrap text-zinc-800">{report.reason}</p>
    <dl className="grid min-w-0 grid-cols-1 gap-2 border-t border-zinc-200 pt-3 sm:grid-cols-2">
      <div className="min-w-0"><dt className="font-bold">Denunciante</dt><dd className="break-words">{report.reporter?.nombre || "Usuario"}</dd></div>
      <div className="min-w-0"><dt className="font-bold">Dueño / vendedor</dt><dd className="break-words">{report.owner ? <>{report.owner.nombre || "Sin nombre"}<br />{report.owner.correo}</> : "No disponible"}</dd></div>
      <div className="min-w-0 sm:col-span-2"><dt className="font-bold">Publicación</dt><dd className="break-words">{report.publication ? <Link className="font-bold text-primary-ink underline" to={`/p/${report.publication.type}/${report.publication.id}`}>{report.publication.title}</Link> : "No aplica"}</dd></div>
    </dl>
    {message && <p role="status" className="text-sm">{message}</p>}
    {report.status === "OPEN" && <div className="flex min-w-0 flex-wrap gap-2 border-t border-dashed border-zinc-300 pt-3">
      {report.publication && <button type="button" disabled={busy} className="btn btn-primary btn-sm" onClick={() => setRemoving(!removing)}>{removing ? "Cancelar retiro" : "Retirar publicación"}</button>}
      {report.owner && <button type="button" disabled={busy} className="btn btn-secondary btn-sm" onClick={() => setSanctioning(!sanctioning)}>{sanctioning ? "Cerrar sanción" : "Sancionar vendedor"}</button>}
      <button type="button" disabled={busy} className="btn btn-secondary btn-sm" onClick={() => onAction(report.id, "DISMISSED")}>Desestimar</button>
    </div>}
    {removing && report.publication && <form className="flex min-w-0 flex-col gap-2" onSubmit={submitRemoval}>
      <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor={`remove-reason-${report.id}`}>Motivo para retirar (10–500)
        <textarea id={`remove-reason-${report.id}`} className="input min-h-20 w-full min-w-0" required minLength={10} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
      <p className="text-right text-xs text-zinc-500">{reason.length}/500</p>
      <button type="submit" className="btn btn-primary btn-sm self-start" disabled={busy || reason.trim().length < 10}>{busy ? "Retirando…" : "Confirmar retiro"}</button>
    </form>}
    {sanctioning && report.owner && <SanctionForm userId={report.owner.id} admin={admin} done={() => { setSanctioning(false); setMessage("Sanción aplicada."); }} />}
  </article>;
}
