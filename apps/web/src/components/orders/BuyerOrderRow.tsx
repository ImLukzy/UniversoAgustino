import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { api, apiError, fmtDate, pen, type HubOrder } from "../../lib/api";
import { getOrderLabel } from "../../lib/orderLabels";
import { ROUTES } from "../../lib/routes";
import { SPRING } from "../../lib/motion";
import { BuyerCaseView } from "./BuyerCaseView";
import { PrivateImage } from "../PrivateImage";
import { DownloadButton } from "../DownloadButton";

const HINT: Record<string, (o: HubOrder) => string> = {
  PENDING: (o) => (o.itemType === "bazar" ? `Esperando respuesta del vendedor${o.expiresAt ? ` (vence ${new Date(o.expiresAt).toLocaleString("es-PE")})` : ""}.` : "Paga al equipo y adjunta el comprobante."),
  ACCEPTED: (o) => o.itemType === "bazar" ? "Solicitud aceptada. El equipo coordinará el recojo." : "Solicitud aceptada. Ya puedes pagar.",
  PAID: (o) => o.paymentRejectedReason ? `Comprobante denegado: ${o.paymentRejectedReason}. Reenvíalo desde el checkout.` : "El equipo está verificando tu comprobante.",
  ESCROW: () => "Pago verificado; el equipo liquida al vendedor en 24–48 h.",
  RELEASED: (o) => o.itemType === "bazar" && o.rentalEnd ? "Pago liquidado. Consulta la coordinación física de tu alquiler." : "El equipo liquidó el pago al vendedor.",
};

// Fila única de un pedido del comprador (Panel y Mis pedidos): estado,
// snapshot del pedido (sin fetch por fila) y la acción que toca en cada paso.
export function BuyerOrderRow({ order }: { order: HubOrder }) {
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const isDoc = order.itemType === "document";
  const title = order.itemTitle?.trim() || `${order.itemType} · ${order.itemId.slice(0, 8)}…`;
  const itemHref = isDoc ? ROUTES.document(order.itemId) : ROUTES.bazarItem(order.itemId);

  const post = async (path: string) => {
    setBusy(true);
    setMsg("");
    try {
      await api.post(path);
      void qc.invalidateQueries({ queryKey: ["orders", "mine"] });
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-2xl text-primary">{isDoc ? "picture_as_pdf" :"storefront"}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-zinc-500">#ORD-{order.id.slice(0, 4).toUpperCase()}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={order.status} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={SPRING} className="tag">
                  {isDoc && order.status === "PAID" ? (order.paymentRejectedReason ? "Comprobante denegado" : "Pago en revisión") : !isDoc && order.status === "PENDING" ? "Esperando respuesta" : order.cancelledReason?.startsWith("SELLER_REJECTED: ") ? "Rechazada" : getOrderLabel(order.status, "buyer", order.cancelledReason)}
                </motion.span>
              </AnimatePresence>
            </div>
            <Link to={itemHref} className="mt-1 block truncate font-extrabold text-zinc-950 hover:underline">{title}</Link>
            <p className="mt-0.5 text-xs text-zinc-500">
              {fmtDate(order.createdAt)}
              {order.rentalStart && order.rentalEnd && <> · Alquiler {fmtDate(order.rentalStart)} → {fmtDate(order.rentalEnd)}</>}
              {order.payProof && <> · Constancia <b>{order.payProof}</b></>}
              {order.payProofUrl && <> · <DownloadButton url={order.payProofUrl} className="font-bold underline">comprobante</DownloadButton></>}
            </p>
          </div>
        </div>
        <span className="price text-xl text-zinc-950">{pen(order.amountCents)}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-zinc-300 pt-3">
        <p className="text-xs text-zinc-600">{msg ? <span className="font-bold text-[#b91c1c]">{msg}</span> : (order.cancelledReason?.startsWith("SELLER_REJECTED: ") ? `Rechazada: ${order.cancelledReason.slice(17)}` : HINT[order.status]?.(order) ?? getOrderLabel(order.status,"buyer", order.cancelledReason))}</p>
        <div className="flex flex-wrap gap-2">
          {(order.status === "PENDING" || order.status === "ACCEPTED") && (
            <>
              {isDoc && <Link to={ROUTES.checkout(order.id)} className="btn btn-primary btn-sm">{order.status === "ACCEPTED" ? "Pagar ahora" :"Continuar pago"}</Link>}
              <button type="button" disabled={busy} onClick={() => post(`/orders/${order.id}/cancel`)} className="btn btn-secondary btn-sm">Cancelar</button>
            </>
          )}
          {order.status === "PAID" && <Link to={ROUTES.checkout(order.id)} className="btn btn-secondary btn-sm">Ver estado</Link>}
          {isDoc && (order.fileUrl || order.status === "ESCROW" || order.status === "RELEASED") && (order.fileUrl ? (
            <DownloadButton documentId={order.itemId} url={order.fileUrl} className="btn btn-dark btn-sm"><span className="material-symbols-outlined text-base">download</span>Descargar</DownloadButton>
          ) : (
            <Link to={itemHref} className="btn btn-dark btn-sm">Abrir apunte</Link>
          ))}
        </div>
      </div>
      {order.status === "REFUNDED" && order.refund?.refundProofUrl && <div className="flex min-w-0 flex-col gap-2"><p className="text-sm">Reembolsado: {pen(order.amountCents)}</p><PrivateImage path={order.refund.refundProofUrl} alt="Comprobante de devolución al comprador" expandable />{order.refund.refundPaymentRef && <p className="break-all text-sm">Operación: {order.refund.refundPaymentRef}</p>}</div>}
      {!isDoc && order.status !== "PENDING" && <BuyerCaseView orderId={order.id} />}
    </article>
  );
}
