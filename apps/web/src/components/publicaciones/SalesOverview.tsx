import { Link } from "react-router-dom";
import { pen, resolveQr, type HubOrder } from "../../lib/api";
import { getOrderLabel } from "../../lib/orderLabels";
import { ROUTES } from "../../lib/routes";
import { SaleActions } from "../SaleActions";
import { EmptyState } from "../EmptyState";
import { statusBars } from "./listing";

// Ventas recibidas (acciones del vendedor) + distribución por estado.
export function SalesOverview({ sales, isStaff }: { sales: HubOrder[]; isStaff: boolean }) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-3 lg:col-span-2">
        <h2 className="h-display text-2xl">Ventas recibidas ({sales.length})</h2>
        <p className="text-sm text-zinc-600">Confirma los pagos para pasarlos a custodia.</p>
        {sales.length === 0 && <EmptyState boxed icon="payments" title="Sin ventas todavía" />}
        {sales.map((o) => (
          <div key={o.id} className="card flex flex-col gap-2 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-auto truncate font-bold text-zinc-950">{o.itemTitle ?? `${o.itemType} · ${o.itemId.slice(0, 8)}…`}</p>
              <span className="tag">{getOrderLabel(o.status,"seller", o.cancelledReason)}</span>
              <span className="price text-primary">{pen(o.amountCents)}</span>
            </div>
            {o.payProof && <p className="text-zinc-600">Constancia del comprador: <b>{o.payProof}</b></p>}
            {o.payProofUrl && <a href={resolveQr(o.payProofUrl) ?? undefined} target="_blank" rel="noreferrer" className="w-fit font-bold text-zinc-950 underline">Ver voucher</a>}
            <SaleActions order={o} />
          </div>
        ))}
      </div>
      <aside className="flex flex-col gap-4">
        <div className="card p-5">
          <h3 className="font-extrabold text-zinc-950">Ventas por estado</h3>
          <div className="mt-4 flex h-40 items-end justify-between gap-3" role="img" aria-label="Distribución de ventas por estado">
            {statusBars(sales).map((b) => (
              <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-bold text-zinc-700">{b.n}</span>
                <div className="w-full max-w-[36px] rounded-t border-2 border-b-0 border-zinc-900" style={{ height: `${b.h}%`, backgroundColor: b.color }} />
                <span className="text-[11px] text-zinc-500">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-dashed flex flex-col gap-2 p-5">
          <h3 className="flex items-center gap-2 font-extrabold text-zinc-950"><span className="material-symbols-outlined">gavel</span>Cumplimiento D.L. 822</h3>
          <p className="text-sm text-zinc-600">Publica solo material de autoría propia. Los reportes fundados se atienden en menos de 48 horas.</p>
          <Link to={ROUTES.mySales} className="font-bold text-zinc-950 underline">Ir a Gestión de ventas</Link>
          {isStaff && <Link to={ROUTES.admin} className="text-sm font-bold text-zinc-600 underline">Cola de moderación</Link>}
        </div>
      </aside>
    </section>
  );
}
