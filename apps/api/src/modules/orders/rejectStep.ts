import type { Router } from "express";
import { canTransition, RejectOrderSchema, type OrderStatus } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { buyerOrderLink, notify } from "../../lib/notify.js";
import { isExpired } from "./reservation.js";

export function registerReject(router: Router) {
  router.post("/:id/reject", requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
    if (order.sellerId !== req.user!.sub) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el vendedor rechaza solicitudes" } });
    const { reason } = RejectOrderSchema.parse(req.body);
    if (order.itemType !== "bazar" || order.status !== "PENDING" || !canTransition(order.status as OrderStatus, "CANCELLED") || isExpired(order)) {
      return res.status(409).json({ error: { code: "BAD_STATE", message: "Esta solicitud ya cambió o venció" } });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({ where: { id: order.id, status: "PENDING", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelledReason: `SELLER_REJECTED: ${reason}`, expiresAt: null } });
      if (!claimed.count) return false;
      await tx.bazarItem.updateMany({ where: { id: order.itemId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
      await tx.auditLog.create({ data: { actorId: req.user!.sub, action: "order.reject", entity: "order", entityId: order.id, meta: JSON.stringify({ reason }) } });
      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: { escrow: true } });
    });
    if (!updated) return res.status(409).json({ error: { code: "BAD_STATE", message: "Esta solicitud ya cambió" } });
    await notify({ userId: order.buyerId, type: "ORDER_CANCELLED", title: "Solicitud rechazada", body: `${order.itemTitle} — ${reason}`, link: buyerOrderLink(order.id) });
    res.json({ data: updated });
  }));
}
