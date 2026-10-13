import { useState } from "react";
import type { StaffListing } from "../../lib/apiTypes";
import { pen } from "../../lib/api";

const labels = { active: "Activa", paused: "Pausada", removed: "Retirada", pending: "Pendiente" };

export function CatalogoRow({ item, admin, busy, act }: { item: StaffListing; admin: boolean; busy: boolean; act: (action: "remove" | "restore", item: StaffListing, reason?: string) => void }) {
  const [reason, setReason] = useState("");
  const [editing, setEditing] = useState(false);
  const typeLabel = item.type === "document" ? "Apunte" : "Bazar";
  function submit() {
    const clean = reason.trim();
    if (clean.length < 10 || clean.length > 500 || !window.confirm(`¿Retirar «${item.title}»?`)) return;
    act("remove", item, clean);
    setEditing(false);
  }
  return (
    <article className="card flex min-w-0 flex-col gap-3 p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><h3 className="wrap-break-word font-bold">{item.title}</h3><p className="text-sm text-zinc-600">{typeLabel} · {pen(item.priceCents)}</p></div>
        <span className="tag shrink-0">{labels[item.state]}</span>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-1 text-sm text-zinc-600 sm:grid-cols-2">
        <p className="wrap-break-word">Dueño: {item.owner.nombre || "Sin nombre"}</p><p className="break-all">{item.owner.correo}</p>
        <p>Reportes abiertos: {item.openReports}</p><p>Publicado: {new Date(item.createdAt).toLocaleDateString("es-PE")}</p>
      </div>
      {item.state === "removed" ? admin && <button className="btn btn-secondary btn-sm self-start" type="button" disabled={busy} onClick={() => act("restore", item)}>Restaurar</button>
        : editing ? <div className="flex min-w-0 flex-col gap-2">
          <label className="text-sm font-bold" htmlFor={`reason-${item.type}-${item.id}`}>Motivo del retiro</label>
          <textarea id={`reason-${item.type}-${item.id}`} className="input min-h-24 w-full" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          <p className="text-xs text-zinc-600">{reason.trim().length}/500 caracteres (mínimo 10)</p>
          <div className="flex flex-wrap gap-2"><button className="btn btn-primary btn-sm" type="button" disabled={busy || reason.trim().length < 10} onClick={submit}>Confirmar retiro</button><button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(false)}>Cancelar</button></div>
        </div> : <button className="btn btn-secondary btn-sm self-start" type="button" onClick={() => setEditing(true)}>Retirar</button>}
    </article>
  );
}
