import { acceptWithCase } from "../cases/orderChanges.js";
import { canTransition, type OrderStatus } from "@hub/shared";
import type { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { buyerOrderLink, notify } from "../../lib/notify.js";
import { expiredPatch, isExpired, blockingOrderWhere } from "./reservation.js";
import { EXPIRED_REASONS, itemOwner } from "./itemOwner.js";

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
      if (order.status !== "PENDING" || !canTransition(order.status as OrderStatus, "ACCEPTED")) {
        return res.status(409).json({ error: { code: "BAD_STATE", message: `La solicitud está en ${order.status}` } });
      }
      if (isExpired(order)) {
        await prisma.$transaction(async (tx) => {
          const cancelled = await tx.order.updateMany({ where: { id: order.id, status: "PENDING", expiresAt: { lte: new Date() } }, data: expiredPatch() });
          if (cancelled.count && !await tx.order.count({ where: blockingOrderWhere("bazar", order.itemId) })) {
            await tx.bazarItem.updateMany({ where: { id: order.itemId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
          }
        });
        return res.status(409).json(expiredMsg);
      }
      const upd = await acceptWithCase(order.id, req.user!.sub);
      await notify({ userId: order.buyerId, type: "ORDER_ACCEPTED", title: "Solicitud aceptada", body: `${item.title} — el equipo coordinará entrega y recojo. Pagarás al vendedor al recoger.`, link: buyerOrderLink(order.id) });
      res.json({ data: upd });
    }),
  );

  router.post(
    "/:id/confirm-payment",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
      if (order.sellerId !== req.user!.sub) return res.status(403).json({ error: { code: "FORBIDDEN", message: "No eres el vendedor" } });
      if (order.itemType === "bazar") return res.status(409).json({ error: { code: "PHYSICAL_PAYMENT", message: "El equipo registra el pago en sede" } });
      res.status(409).json({ error: { code: "TEAM_VERIFICATION", message: "Solo el equipo verifica el comprobante y atribuye el producto" } });
    }),
  );
}
