import { useState, type FormEvent } from "react";
import { api, apiError, fmtDate, type HubReport } from "../../lib/api";
import { ITEM_TYPE_LABEL, REPORT_STATUS_LABEL } from "../../lib/orderLabels";
import { fieldLabel } from "../publicar/StepDetails";
import { EmptyState } from "../EmptyState";

type Filter = "all" | "open" | "done";

// Mis reportes (devoluciones, archivos, D.L. 822) + formulario para abrir uno.
export function ReportsCenter({ reports, onSent }: { reports: HubReport[]; onSent: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState({ type: "bazar", id: "", reason: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const open = reports.filter((r) => r.status === "OPEN");
  const shown = reports.filter((r) => (filter === "all" ? true : filter === "open" ? r.status === "OPEN" : r.status !== "OPEN"));
  const tabs: [Filter, string][] = [["all", `Todas (${reports.length})`], ["open", `Abiertas (${open.length})`], ["done", `Resueltas (${reports.length - open.length})`]];

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await api.post("/reports", { targetType: form.type, targetId: form.id.trim(), reason: form.reason.trim() });
      setMsg("Reporte enviado. Lo revisaremos en menos de 48 horas.");
      setForm((f) => ({ ...f, id: "", reason: "" }));
      onSent();
    } catch (ex) {
      setMsg(apiError(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="seccion-reportes" className="flex flex-col gap-4">
      <div>
        <h2 className="h-display text-2xl">Soporte y reportes</h2>
        <p className="mt-1 text-sm text-zinc-600">Reporta devoluciones del bazar, problemas con archivos o infracciones. Respondemos en menos de 48 horas.</p>
      </div>
      <div role="tablist" aria-label="Filtrar reportes" className="flex gap-2 overflow-x-auto p-1">
        {tabs.map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={`chip ${filter === v ? "chip-active" : ""}`}>{l}</button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {shown.length === 0 && <EmptyState boxed className="lg:col-span-2" icon="flag" title="Sin reportes en este filtro" />}
        {shown.map((r) => (
          <div key={r.id} className="card flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-extrabold text-zinc-950">Caso #{r.id.slice(0, 6).toUpperCase()}</p>
              <span className={`tag ${r.status === "OPEN" ? "bg-[#fee2e2]" : "bg-[#dcfce7]"}`}>{REPORT_STATUS_LABEL[r.status] ?? r.status}</span>
            </div>
            <p className="text-xs text-zinc-500">{ITEM_TYPE_LABEL[r.targetType] ?? r.targetType} · Ref. {r.targetId.slice(0, 8)}… · {fmtDate(r.createdAt)}</p>
            <p className="text-sm text-zinc-800">“{r.reason}”</p>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="card flex flex-col gap-4 p-5">
        <h3 className="font-extrabold text-zinc-950">Abrir un reporte</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={fieldLabel}>
            Tipo
            <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="bazar">Artículo de bazar</option>
              <option value="document">Apunte digital</option>
              <option value="user">Usuario</option>
            </select>
          </label>
          <label className={fieldLabel}>
            ID del ítem o usuario
            <input className="input" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} required />
          </label>
        </div>
        <label className={fieldLabel}>
          Motivo (mín. 10 caracteres)
          <textarea className="input" rows={3} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} required minLength={10} maxLength={2000} placeholder="Describe la devolución o el problema…" />
        </label>
        <p role="status" className="min-h-[1rem] text-xs font-bold text-zinc-700">{msg}</p>
        <button disabled={busy} type="submit" className="btn btn-primary w-fit">{busy ? "Enviando…" : "Enviar reporte"}</button>
      </form>
    </section>
  );
}
