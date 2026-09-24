import { PLATFORM_FEE_PCT } from "@hub/shared";
import { fmtDate, pen, resolveQr, type HubOrder } from "../lib/api";
import { careerLabel } from "../data/unsa";
import { getOrderLabel } from "../lib/orderLabels";
import { CareerAvatar } from "./CareerVisual";
import { SaleActions } from "./SaleActions";

const PAY = { YAPE: "Yape", PLIN: "Plin", AMBAS: "Yape / Plin" } as const;

// Solicitud de alquiler del bazar: comprador, fechas, desglose congelado y acciones.
export function RentalCard({ order }: { order: HubOrder }) {
  const buyer = order.buyer?.profile?.fullName?.trim() || order.buyer?.email || "Comprador";
  const meta = [order.buyer?.profile?.career ? careerLabel(order.buyer.profile.career) : null, order.buyer?.profile?.cycle ? `Ciclo ${order.buyer.profile.cycle}` : null].filter(Boolean).join(" · ");
  const days = order.rentalStart && order.rentalEnd ? Math.max(1, Math.round((new Date(order.rentalEnd).getTime() - new Date(order.rentalStart).getTime()) / 86400000)) : null;
  return (
    <article className="card flex h-full flex-col gap-4 p-5">
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <CareerAvatar name={buyer} className="h-12 w-12" />
          <div className="min-w-0">
            <p className="truncate font-extrabold text-zinc-950">{buyer}</p>
            <p className="truncate text-xs text-zinc-500">{meta || "Comunidad UNSA"} · {order.buyerCompleted ?? 0} alquileres previos</p>
          </div>
        </div>
        <span className="tag shrink-0">{getOrderLabel(order.status, "seller", order.cancelledReason)}</span>
      </header>
      <div className="rounded-xl border border-dashed border-zinc-300 p-3">
        <p className="eyebrow">Alquiler de bazar</p>
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
          <dd className="text-zinc-500">Comisión ({PLATFORM_FEE_PCT}%): {pen(order.feeCents)}</dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-zinc-500">Cobro</dt>
          <dd className="font-bold text-zinc-900">{PAY[order.payMethod as keyof typeof PAY] ?? "Yape"}</dd>
          <dd className="truncate text-zinc-500">{order.payDetail || "Ver en Mis publicaciones"}</dd>
          {order.payProof && <dd>Constancia: <b>{order.payProof}</b></dd>}
          {order.payProofUrl && <dd><a href={resolveQr(order.payProofUrl) ?? undefined} target="_blank" rel="noreferrer" className="font-bold text-zinc-950 underline">Ver voucher</a></dd>}
        </div>
      </dl>
      {order.status === "PAID" && (
        <p className="rounded-lg border border-zinc-900 bg-[#fef3c7] p-2 text-xs text-zinc-900">
          El comprador declara el pago{order.payProof ? <> con constancia <b>{order.payProof}</b></> : ""}. Confírmalo solo si recibiste el abono.
        </p>
      )}
      <div className="mt-auto">
        <SaleActions order={order} />
      </div>
    </article>
  );
}
