import { useState } from "react";
import { fmtDate, type HubReport } from "../../lib/api";
import { ITEM_TYPE_LABEL, REPORT_STATUS_LABEL } from "../../lib/orderLabels";
import { EmptyState } from "../EmptyState";

type Filter = "all" | "open" | "done";

// Mis reportes enviados desde una publicación o pedido.
export function ReportsCenter({ reports }: { reports: HubReport[]; onSent: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const open = reports.filter((r) => r.status === "OPEN");
  const shown = reports.filter((r) => (filter === "all" ? true : filter === "open" ? r.status === "OPEN" : r.status !== "OPEN"));
  const tabs: [Filter, string][] = [["all", `Todas (${reports.length})`], ["open", `Abiertas (${open.length})`], ["done", `Resueltas (${reports.length - open.length})`]];

  return (
    <section id="seccion-reportes" className="flex flex-col gap-4">
      <div>
        <h2 className="h-display text-2xl">Soporte y reportes</h2>
        <p className="mt-1 text-sm text-zinc-600">Para reportar una publicación, usa “Reportar publicación” en su detalle. Para reportar un pedido, usa “Reportar al vendedor” en /pedidos.</p>
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
    </section>
  );
}
