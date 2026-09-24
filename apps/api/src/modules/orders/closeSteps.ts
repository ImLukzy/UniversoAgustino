import type { Router } from "express";
import { canTransition, type OrderStatus } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { buyerOrderLink, notify, orderLink } from "../../lib/notify.js";
import { audit, itemOwner } from "./itemOwner.js";

// Una reserva de bazar que se cierra sin venta devuelve el ítem al catálogo.
const freeBazarItem = (itemId: string) => prisma.bazarItem.updateMany({ where: { id: itemId, status: "RESERVED" }, data: { status: "AVAILABLE" } });

// Cierres sin venta: cancelar (comprador o vendedor, según ORDER_TRANSITIONS)
// y reembolsar (moderación, solo con dinero ya movido: PAID o ESCROW).
export function registerCloseSteps(router: Router) {
  router.post(
    "/:id/cancel",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
      const item = await itemOwner(order.itemType, order.itemId);
      const isBuyer = order.buyerId === req.user!.sub;
      if (!isBuyer && item.ownerId !== req.user!.sub) return res.status(403).json({ error: { code: "FORBIDDEN", message: "No participas en este pedido" } });
      if (!canTransition(order.status as OrderStatus, "CANCELLED")) {
        return res.status(409).json({ error: { code: "BAD_STATE", message: `Ya no se puede cancelar (está ${order.status})` } });
      }
      const cancelledReason = isBuyer ? "BUYER_CANCELLED" : "SELLER_REJECTED";
      const upd = await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelledReason, expiresAt: null }, include: { escrow: true } });
      if (order.itemType === "bazar") await freeBazarItem(order.itemId);
      // Un solo registro de auditoría por cancelación (antes se escribía dos veces).
      await Promise.all([
        audit(req.user!.sub, "order.cancel", order.id),
        notify({
          userId: isBuyer ? order.sellerId : order.buyerId,
          type: "ORDER_CANCELLED",
          title: isBuyer ? "Reserva cancelada por el comprador" : "Reserva rechazada por el vendedor",
          body: order.itemTitle,
          link: isBuyer ? orderLink(order.id) : buyerOrderLink(order.id),
        }),
      ]);
      res.json({ data: upd });
    }),
  );

  router.post(
    "/:id/refund",
    requireAuth,
    requireRole("moderator", "admin"),
    asyncHandler(async (req: AuthedRequest, res) => {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
      if (order.status !== "PAID" && order.status !== "ESCROW") {
        return res.status(409).json({ error: { code: "BAD_STATE", message: `Solo se reembolsan pedidos pagados o en custodia (está ${order.status})` } });
      }
      const upd = await prisma.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
      if (order.itemType === "bazar") await freeBazarItem(order.itemId);
      await audit(req.user!.sub, "order.refund", order.id);
      res.json({ data: upd });
    }),
  );
}
