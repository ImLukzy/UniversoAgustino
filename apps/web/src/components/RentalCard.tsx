import { fmtDate, pen, type HubOrder } from "../lib/api";
import { useCareerTheme } from "../live/careerTheme";
import { careerLabel } from "../data/unsa";
import { CareerAvatar } from "./CareerVisual";
import { SaleActions } from "./SaleActions";
import { getOrderLabel } from "../lib/orderLabels";
import { motion } from "framer-motion";

// Tarjeta de solicitud de alquiler (Sprint 2B). Extraída de Ventas.tsx sin
// cambios visuales; usa el helper único de etiquetas y SaleActions.
export function RentalCard({ order }: { order: HubOrder }) {
  const { accent } = useCareerTheme();
  const buyerName = order.buyer?.profile?.fullName?.trim() || order.buyer?.email || "Comprador";
  const buyerMeta = [
    order.buyer?.profile?.career ? careerLabel(order.buyer.profile.career) : null,
    order.buyer?.profile?.cycle ? `Ciclo ${order.buyer.profile.cycle}` : null,
  ].filter(Boolean).join(" · ");
  const days = order.rentalStart && order.rentalEnd
    ? Math.max(1, Math.round((new Date(order.rentalEnd).getTime() - new Date(order.rentalStart).getTime()) / 86400000))
    : null;
  return (
    <motion.div
      className="flex flex-col justify-between gap-3 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <CareerAvatar name={buyerName} className="h-12 w-12" />
          <div className="flex min-w-0 flex-col">
            <p className="flex items-center gap-1 font-bold">
              <span className="truncate">{buyerName}</span>
              <span className="flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-800">
                <span className="material-symbols-outlined text-xs">verified</span> Verificado
              </span>
            </p>
            <p className="truncate text-xs text-slate-500">
              {buyerMeta || "Universo Agustino"}
              <span className="font-semibold text-emerald-700"> · ★ {order.buyerCompleted ?? 0} alquileres previos</span>
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-indigo-800">
          {getOrderLabel(order.status, "seller", order.cancelledReason)}
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
        <span className="material-symbols-outlined text-2xl text-primary" style={accent ? { color: accent.color } : undefined}>storefront</span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary" style={accent ? { color: accent.color } : undefined}>
            Alquiler de bazar
          </span>
          <span className="truncate font-bold">{order.itemTitle ?? order.itemId}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">event</span>
              {order.rentalStart && order.rentalEnd ? `${fmtDate(order.rentalStart)} → ${fmtDate(order.rentalEnd)}${days ? ` (${days} días)` : ""}` : "Fechas a coordinar"}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col rounded-lg bg-slate-100 p-2">
          <span className="text-[11px] text-slate-500">Desglose económico</span>
          <span className="flex items-baseline justify-between text-xs"><span>Alquiler</span><b>{pen(order.amountCents)}</b></span>
          <span className="flex items-baseline justify-between text-xs text-slate-500"><span>Comisión (13%)</span><span>{pen(order.feeCents)}</span></span>
          <span className="mt-1 flex items-baseline justify-between rounded bg-slate-200/60 px-1 text-xs font-bold">
            <span>Total</span><span className="text-sm text-primary" style={accent ? { color: accent.color } : undefined}>{pen(order.amountCents)}</span>
          </span>
        </div>
        <div className="flex flex-col justify-between rounded-lg bg-slate-100 p-2">
          <span className="text-[11px] text-slate-500">Cobro</span>
          <span className="text-xs font-bold">{order.payMethod === "PLIN" ? "Plin" : order.payMethod === "AMBAS" ? "Yape / Plin" : "Yape"}</span>
          <span className="truncate text-[11px] text-slate-500">{order.payDetail || "Ver en Mi Bazar"}</span>
          {order.payProof && <span className="text-[11px]">Constancia: <b>{order.payProof}</b></span>}
        </div>
      </div>

      {order.status === "PAID" && (
        <div className="rounded-lg bg-indigo-50 p-2 text-xs text-indigo-900">
          El comprador declara el pago{order.payProof ? <> con constancia <b>{order.payProof}</b></> : ""}. Confírmalo solo si recibiste el abono en tu cuenta.
        </div>
      )}
      <SaleActions order={order} accentColor={accent?.color ?? null} />
    </motion.div>
  );
}