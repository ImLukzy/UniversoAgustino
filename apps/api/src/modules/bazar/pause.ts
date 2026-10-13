import { prisma } from "../../lib/prisma.js";
import { changeListingPause } from "../../lib/pause.js";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";

export const bazarPauseHandler = (resume: boolean) => asyncHandler(async (req: AuthedRequest, res) => {
      const item = await prisma.bazarItem.findUnique({ where: { id: req.params.id }, select: { id: true, sellerId: true, pausedAt: true } });
      if (!item) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ítem no existe" } });
      const result = await changeListingPause({
        id: item.id, actorId: req.user!.sub, ownerId: item.sellerId, pausedAt: item.pausedAt, resume, kind: "bazar",
        findActiveOrders: () => prisma.order.findMany({ where: { itemType: "bazar", itemId: item.id, status: { in: ["PENDING", "ACCEPTED", "PAID", "ESCROW"] } }, select: { status: true, expiresAt: true } }),
        update: (pausedAt) => prisma.bazarItem.update({ where: { id: item.id }, data: { pausedAt } }),
        audit: (action) => prisma.auditLog.create({ data: { actorId: req.user!.sub, action, entity: "bazar", entityId: item.id } }),
      });
      if (result.status === 403) return res.status(403).json({ error: { code: result.code, message: "Solo el dueño puede pausar o reactivar su publicación" } });
      if (result.status === 409) return res.status(409).json({ error: { code: result.code, message: result.details.message, details: { activeOrders: result.details.activeOrders, statuses: result.details.statuses, canForce: result.details.canForce } } });
      return res.json({ data: result.data });
    });
