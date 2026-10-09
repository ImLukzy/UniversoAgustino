import { privateOrder } from "./paymentPrivacy.js";
import { cancelDigitalOrder } from "./cancelDigital.js";
import { cancelPhysical } from "../cases/orderChanges.js";
import type { Router } from "express";
import { canTransition, type OrderStatus } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { buyerOrderLink, notify, orderLink } from "../../lib/notify.js";
import { itemOwner } from "./itemOwner.js";

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
      if (!isBuyer && order.itemType === "bazar" && order.status === "PENDING") {
        return res.status(409).json({ error: { code: "BAD_STATE", message: "Usa /reject e indica el motivo para rechazar la solicitud" } });
      }
      if (!canTransition(order.status as OrderStatus, "CANCELLED")) {
        return res.status(409).json({ error: { code: "BAD_STATE", message: `Ya no se puede cancelar (está ${order.status})` } });
      }
      const upd = order.itemType === "bazar" ? await cancelPhysical(order.id, req.user!.sub) : await cancelDigitalOrder(order.id, req.user!.sub);
      // Un solo registro de auditoría por cancelación (antes se escribía dos veces).
      await Promise.all([
        notify({
          userId: isBuyer ? order.sellerId : order.buyerId,
          type: "ORDER_CANCELLED",
          title: isBuyer ? "Reserva cancelada por el comprador" : "Reserva rechazada por el vendedor",
          body: order.itemTitle,
          link: isBuyer ? orderLink(order.id) : buyerOrderLink(order.id),
        }),
      ]);
      res.json({ data: privateOrder(upd, isBuyer ? "buyer" : "seller") });
    }),
  );

  router.post(
    "/:id/refund",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthedRequest, res) => {
      res.status(409).json({ error: { code: "TEAM_SETTLEMENT", message: "El Técnico revisa el reclamo y la liquidación antes de decidir un reembolso" } });
    }),
  );
}
