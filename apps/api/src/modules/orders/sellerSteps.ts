import type { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { buyerOrderLink, notify } from "../../lib/notify.js";
import { expiredPatch, isExpired } from "./reservation.js";
import { audit, EXPIRED_REASONS, itemOwner } from "./itemOwner.js";

const expiredMsg = { error: { code: "RESERVATION_EXPIRED", message: "La reserva expiró. El comprador debe generar un nuevo pedido." } };

// Pasos del vendedor: aceptar un alquiler (PENDING → ACCEPTED) y confirmar
// que recibió el pago (PAID → ESCROW).
export function registerSellerSteps(router: Router) {
  router.post(
    "/:id/accept",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
      const item = await itemOwner(order.itemType, order.itemId);
      if (item.ownerId !== req.user!.sub) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el vendedor acepta solicitudes" } });
      }
      if (order.itemType !== "bazar") {
        return res.status(409).json({ error: { code: "NOT_RENTAL", message: "Las ventas digitales no requieren aceptación" } });
      }
      // Reserva ya expirada (cron o expiración perezosa): mensaje accionable.
      if (order.status === "CANCELLED" && EXPIRED_REASONS.includes(order.cancelledReason ?? "")) return res.status(409).json(expiredMsg);
      if (order.status !== "PENDING") {
        return res.status(409).json({ error: { code: "BAD_STATE", message: `La solicitud está en ${order.status}` } });
      }
      if (isExpired(order)) {
        await prisma.order.update({ where: { id: order.id }, data: expiredPatch() });
        return res.status(409).json(expiredMsg);
      }
      const upd = await prisma.order.update({ where: { id: order.id }, data: { status: "ACCEPTED", acceptedAt: new Date(), expiresAt: null }, include: { escrow: true } });
      await Promise.all([
        audit(req.user!.sub, "order.accept", order.id),
        notify({ userId: order.buyerId, type: "ORDER_ACCEPTED", title: "Alquiler aceptado", body: `${item.title} — ya puedes pagar al vendedor.`, link: buyerOrderLink(order.id) }),
      ]);
      res.json({ data: upd });
    }),
  );

  router.post(
    "/:id/confirm-payment",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
      const item = await itemOwner(order.itemType, order.itemId);
      if (item.ownerId !== req.user!.sub) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el vendedor confirma el pago" } });
      }
      if (order.status !== "PAID") {
        return res.status(409).json({ error: { code: "BAD_STATE", message: `El pedido está en ${order.status}, falta que el comprador pague` } });
      }
      const upd = await prisma.order.update({ where: { id: order.id }, data: { status: "ESCROW", escrow: { create: {} } }, include: { escrow: true } });
      // El comprador se entera de que su pago fue confirmado (antes no se le avisaba).
      await Promise.all([
        audit(req.user!.sub, "order.escrow", order.id),
        notify({ userId: order.buyerId, type: "ORDER_PAID", title: "Pago confirmado", body: `${order.itemTitle} — el pedido quedó en custodia hasta que confirmes la recepción.`, link: buyerOrderLink(order.id) }),
      ]);
      res.json({ data: upd });
    }),
  );
}
