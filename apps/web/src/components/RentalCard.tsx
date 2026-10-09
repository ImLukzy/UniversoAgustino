import { fmtDate, pen, type HubOrder } from "../lib/api";
import { careerLabel } from "../data/unsa";
import { getOrderLabel } from "../lib/orderLabels";
import { CareerAvatar } from "./CareerVisual";
import { BuyerCaseView } from "./orders/BuyerCaseView";
import { SaleActions } from "./SaleActions";



// Solicitud de alquiler del bazar: comprador, fechas, desglose congelado y acciones.
export function RentalCard({ order }: { order: HubOrder }) {
  const buyer = order.buyer?.profile?.fullName?.trim() || order.buyer?.email || "Comprador";
  const meta = [order.buyer?.profile?.career ? careerLabel(order.buyer.profile.career) : null, order.buyer?.profile?.cycle ? `Ciclo ${order.buyer.profile.cycle}` : null].filter(Boolean).join(" · ");
  const days = order.rentalStart && order.rentalEnd ? Math.max(1, Math.round((new Date(order.rentalEnd).getTime() - new Date(order.rentalStart).getTime()) / 86400000)) : null;
  return (
    <article className="card flex h-full min-w-0 flex-col gap-4 p-5">
      <header className="flex min-w-0 flex-col items-start justify-between gap-2 sm:flex-row">
        <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:flex-1">
          <CareerAvatar name={buyer} className="h-12 w-12 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-extrabold text-zinc-950">{buyer}</p>
            <p className="truncate text-xs text-zinc-500">{meta || "Comunidad UNSA"} · {order.buyerCompleted ?? 0} alquileres previos</p>
          </div>
        </div>
        <span className="tag max-w-full whitespace-normal break-words text-left sm:max-w-[50%]">{getOrderLabel(order.status, "seller", order.cancelledReason)}</span>
      </header>
      <div className="rounded-xl border border-dashed border-zinc-300 p-3">
        <p className="eyebrow">{order.rentalStart ? "Alquiler de bazar" : "Compra de bazar"}</p>
        <p className="truncate font-bold text-zinc-950">{order.itemTitle ?? order.itemId}</p>
        <p className="flex items-center gap-1 text-xs text-zinc-600">
          <span className="material-symbols-outlined text-sm">event</span>
          {order.rentalStart && order.rentalEnd ? `${fmtDate(order.rentalStart)} → ${fmtDate(order.rentalEnd)}${days ? ` (${days} días)` : ""}` : "Fechas a coordinar"}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex flex-col gap-0.5">
          <dt className="text-zinc-500">Precio</dt>
          <dd className="price text-lg text-primary">{pen(order.amountCents)}</dd>
          <dd className="text-zinc-500">Comisión del 13 % a cargo del vendedor: recibes el 87 % del precio.</dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-zinc-500">Cobro</dt>
          <dd className="font-bold text-zinc-900">Al equipo en sede</dd>
          <dd className="text-zinc-500">Neto de {pen(order.netCents)} por liquidar en 24–48 h.</dd>
        </div>
      </dl>
      {order.status === "PAID" && (
        <p className="rounded-lg border border-zinc-900 bg-[#fef3c7] p-2 text-xs text-zinc-900">
          Contacta al equipo para revisar este pedido anterior al flujo de entrega física.
        </p>
      )}
      {order.status === "PENDING" && order.expiresAt && <p className="text-xs text-zinc-600">Plazo restante: {Math.max(0, Math.ceil((new Date(order.expiresAt).getTime() - Date.now()) / 3_600_000))} h · Vence {new Date(order.expiresAt).toLocaleString("es-PE")}</p>}
      {order.status !== "PENDING" && <BuyerCaseView orderId={order.id} />}
      <div className="mt-auto">
        <SaleActions order={order} />
      </div>
    </article>
  );
}
