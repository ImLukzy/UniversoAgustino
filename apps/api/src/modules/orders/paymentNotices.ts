import type { Order } from "@prisma/client";
import { buyerOrderLink, notify, orderLink } from "../../lib/notify.js";
export async function paymentSubmittedNotices(order: Order, collectorId: string) {
  await Promise.all([
    notify({ userId: order.buyerId, type: "ORDER_PAID", title: "Comprobante recibido", body: `${order.itemTitle} — el equipo está verificando tu pago.`, link: buyerOrderLink(order.id) }),
    notify({ userId: order.sellerId, type: "ORDER_PAID", title: "Venta en verificación", body: `${order.itemTitle} — el comprador envió su comprobante al equipo.`, link: orderLink(order.id) }),
    notify({ userId: collectorId, type: "ORDER_PAID", title: "Nuevo pago por verificar", body: `${order.itemTitle} — revisa el abono real y el comprobante.`, link: "/equipo?tab=pagos" }),
  ]);
}
export async function paymentReviewedNotices(order: Order, collectorId: string, accepted: boolean) {
  const type = accepted ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED";
  await Promise.all([
    notify({ userId: order.buyerId, type, title: accepted ? "Apunte disponible" : "Comprobante denegado",
      body: accepted ? `${order.itemTitle} — puedes abrir y descargar el apunte para siempre.` : `${order.itemTitle} — ${order.paymentRejectedReason}. Reenvía una foto del comprobante.`, link: buyerOrderLink(order.id) }),
    notify({ userId: order.sellerId, type, title: accepted ? "Producto atribuido" : "Pago denegado",
      body: accepted ? `${order.itemTitle} — pago verificado por el equipo.` : `${order.itemTitle} — el comprador debe reenviar su comprobante.`, link: orderLink(order.id) }),
    ...(accepted ? [notify({ userId: order.sellerId, type: "PAYOUT_PENDING", title: "Liquidación pendiente",
      body: `${order.itemTitle} — recibirás el neto en 24–48 h.`, link: "/ventas?tab=cobros" }),
      notify({ userId: collectorId, type: "PAYOUT_PENDING", title: "Pago al vendedor pendiente", body: `${order.itemTitle} — liquida dentro de 48 h.`, link: "/equipo?tab=liquidaciones" })] : []),
  ]);
}
