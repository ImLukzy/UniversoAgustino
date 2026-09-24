import { fmtDate, pen, type HubOrder } from "../../lib/api";
import { ITEM_TYPE_LABEL } from "../../lib/orderLabels";

// Resumen sobre los montos CONGELADOS del pedido (snapshot al reservar):
// la UI nunca recalcula precio ni comisión.
export function OrderSummary({ order }: { order: HubOrder }) {
  const price = order.itemPriceCents ?? order.amountCents;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{ITEM_TYPE_LABEL[order.itemType] ?? order.itemType}</p>
        <p className="mt-0.5 line-clamp-2 font-semibold text-zinc-900">{order.itemTitle ?? "Tu pedido"}</p>
        {order.rentalStart && order.rentalEnd && (
          <p className="mt-0.5 text-xs text-zinc-500">Alquiler: {fmtDate(order.rentalStart)} → {fmtDate(order.rentalEnd)}</p>
        )}
      </div>
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between text-zinc-500"><dt>Precio</dt><dd className="text-zinc-900">{pen(price)}</dd></div>
        <div className="flex justify-between text-zinc-500">
          <dt>Comisión de custodia</dt>
          <dd>{pen(order.feeCents)}</dd>
        </div>
        <p className="-mt-1 text-[11px] text-zinc-400">La asume el vendedor; no se suma a tu total.</p>
        <div className="mt-1 flex items-baseline justify-between border-t border-zinc-100 pt-2">
          <dt className="font-semibold text-zinc-900">Total</dt>
          <dd className="font-display text-2xl font-extrabold text-primary theme-transition">{pen(order.amountCents)}</dd>
        </div>
      </dl>
    </div>
  );
}
