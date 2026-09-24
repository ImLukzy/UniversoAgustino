import { useState } from "react";
import { Link } from "react-router-dom";
import type { HubOrder } from "../../lib/api";
import { ROUTES } from "../../lib/routes";
import { BuyerOrderRow } from "../orders/BuyerOrderRow";
import { ListRowSkeleton } from "../Skeleton";
import { EmptyState } from "../EmptyState";

type Filter = "all" | "escrow" | "digital" | "bazar";
const FILTERS: [Filter, string][] = [["all", "Todos"], ["escrow", "En custodia"], ["digital", "Digitales"], ["bazar", "Bazar"]];
const MATCH: Record<Filter, (o: HubOrder) => boolean> = {
  all: () => true,
  escrow: (o) => o.status === "ESCROW",
  digital: (o) => o.itemType === "document",
  bazar: (o) => o.itemType === "bazar",
};

// Últimos 6 pedidos con filtros rápidos.
export function PanelOrders({ list, loading }: { list: HubOrder[]; loading: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = list.filter(MATCH[filter]);
  return (
    <section className="card flex flex-col gap-4 p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="h-display text-2xl">Últimos pedidos</h2>
          <p className="text-sm text-zinc-600">{list.length} registros · compras digitales y bazar</p>
        </div>
        <Link to={ROUTES.myOrders} className="btn btn-secondary btn-sm">Ver todos</Link>
      </div>
      <div role="tablist" aria-label="Filtrar pedidos" className="flex gap-2 overflow-x-auto p-1">
        {FILTERS.map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={`chip ${filter === v ? "chip-active" : ""}`}>{l}</button>
        ))}
      </div>
      <div className="flex min-h-[10rem] flex-col gap-2">
        {loading && <ListRowSkeleton count={6} />}
        {!loading && rows.length === 0 && (
          <EmptyState
            icon="inbox"
            title={list.length === 0 ? "Aún no tienes pedidos" : "Nada en este filtro"}
            action={list.length === 0 ? <Link to={ROUTES.explore} className="btn btn-primary btn-sm">Explorar apuntes</Link> : undefined}
          />
        )}
        {rows.slice(0, 6).map((o) => <BuyerOrderRow key={o.id} order={o} />)}
      </div>
    </section>
  );
}
