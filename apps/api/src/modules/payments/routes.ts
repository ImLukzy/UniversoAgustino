import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../env.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { createPreference, fetchPayment, mpEnabled, verifySignature } from "../../lib/mercadopago.js";
import { buyerOrderLink, notify, orderLink } from "../../lib/notify.js";
import { audit } from "../orders/itemOwner.js";
import { expiredPatch, isExpired } from "../orders/reservation.js";
import { settle } from "./settle.js";

// Pasarela (spec 16). "manual": Yape/Plin al vendedor, que verifica el abono
// (PAID → ESCROW). "mercadopago": Checkout Pro; el webhook firmado verifica.
export const paymentsRouter = Router();

paymentsRouter.get("/config", (_req, res) => {
  res.json({ data: { provider: mpEnabled() ? "mercadopago" : "manual" } });
});

paymentsRouter.post(
  "/checkout/:orderId",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!mpEnabled()) return res.status(404).json({ error: { code: "PROVIDER_OFF", message: "La pasarela no está activa: paga por Yape o Plin" } });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.orderId } });
    if (order.buyerId !== req.user!.sub) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el comprador paga su pedido" } });
    if (isExpired(order)) {
      await prisma.order.update({ where: { id: order.id }, data: expiredPatch() });
      return res.status(409).json({ error: { code: "RESERVATION_EXPIRED", message: "La reserva expiró. Genera un nuevo pedido." } });
    }
    const payable = order.status === "ACCEPTED" || (order.status === "PENDING" && !(order.itemType === "bazar" && order.rentalStart));
    if (!payable) return res.status(409).json({ error: { code: "BAD_STATE", message: `El pedido está en ${order.status}` } });
    const url = await createPreference(order, env.WEB_ORIGIN[0]);
    await audit(req.user!.sub, "payment.checkout", order.id);
    res.json({ data: { url } });
  })
);

// Notificación de Mercado Pago. Nunca se confía en el cuerpo: se valida la
// firma y se relee el pago en la API de MP (estado, referencia y monto).
paymentsRouter.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as { type?: string; data?: { id?: string | number } };
    const dataId = String(req.query["data.id"] ?? body.data?.id ?? "");
    const type = String(req.query.type ?? body.type ?? "");
    if (!mpEnabled()) return res.status(404).json({ error: { code: "PROVIDER_OFF", message: "Pasarela inactiva" } });
    if (!verifySignature(req.header("x-signature"), req.header("x-request-id"), dataId)) {
      return res.status(401).json({ error: { code: "BAD_SIGNATURE", message: "Firma inválida" } });
    }
    if (type !== "payment") return res.json({ data: { ignored: true } });
    const pay = await fetchPayment(dataId);
    const order = pay.external_reference ? await prisma.order.findUnique({ where: { id: pay.external_reference } }) : null;
    if (!order) return res.json({ data: { ignored: true } });
    const outcome = settle(order, pay);
    if (outcome === "ESCROW") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "ESCROW", payProof: `MP-${pay.id}`, expiresAt: null, cancelledAt: null, cancelledReason: null, escrow: { connectOrCreate: { where: { orderId: order.id }, create: {} } } },
      });
      await Promise.all([
        audit(order.buyerId, "payment.approved", order.id),
        notify({ userId: order.buyerId, type: "ORDER_PAID", title: "Pago aprobado", body: `${order.itemTitle} — Mercado Pago confirmó tu pago.`, link: buyerOrderLink(order.id) }),
        notify({ userId: order.sellerId, type: "ORDER_PAID", title: "Venta pagada", body: `${order.itemTitle} — pago verificado por Mercado Pago, en custodia.`, link: orderLink(order.id) }),
      ]);
    } else if (outcome === "MISMATCH" || outcome === "ORPHAN") {
      await audit(order.buyerId, `payment.${outcome.toLowerCase()}`, order.id);
    }
    res.json({ data: { outcome } });
  })
);
