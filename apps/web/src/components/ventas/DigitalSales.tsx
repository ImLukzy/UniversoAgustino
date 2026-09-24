import { PLATFORM_FEE_PCT } from "@hub/shared";
import { fmtDate, pen, type HubOrder } from "../../lib/api";
import { careerLabel } from "../../data/unsa";
import { getOrderLabel } from "../../lib/orderLabels";
import { SaleActions } from "../SaleActions";

// Ventas de apuntes: desglose congelado por pedido y acción de confirmar pago
// (PAID → custodia; se libera cuando el comprador confirma la descarga).
export function DigitalSales({ rows, more, loadingMore, onMore }: { rows: HubOrder[]; more: boolean; loadingMore: boolean; onMore: () => void }) {
  return (
    <section id="seccion-digitales" className="flex flex-col gap-4">
      <div>
        <h2 className="h-display text-2xl">Ventas digitales</h2>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">
          Confirma cada pago recibido para pasarlo a custodia. [Precio] − [Comisión {PLATFORM_FEE_PCT}%] = [Neto para ti].
        </p>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-900 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Fecha y archivo</th>
                <th className="px-3 py-3">Comprador</th>
                <th className="px-3 py-3 text-right">Precio</th>
                <th className="px-3 py-3 text-right">Neto</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-zinc-300">
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Aún no vendes apuntes.</td></tr>
              )}
              {rows.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="max-w-xs truncate font-bold text-zinc-950">{o.itemTitle ?? o.itemId}</p>
                    <p className="text-[11px] text-zinc-500">{fmtDate(o.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{o.buyer?.profile?.fullName?.trim() || o.buyer?.email || "—"}</p>
                    <p className="text-[11px] text-zinc-500">{o.buyer?.profile?.career ? careerLabel(o.buyer.profile.career) : ""}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-bold">{pen(o.amountCents)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-extrabold text-primary">+{pen(o.netCents)}</td>
                  <td className="px-4 py-3">
                    <span className="tag">{getOrderLabel(o.status, "seller", o.cancelledReason)}</span>
                    <div className="mt-2"><SaleActions order={o} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {more && (
        <button type="button" onClick={onMore} disabled={loadingMore} className="btn btn-secondary w-full">
          {loadingMore ? "Cargando…" : "Cargar más ventas"}
        </button>
      )}
    </section>
  );
}
