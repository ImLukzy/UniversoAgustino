import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import type { Router } from "express";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { registerDigitalPay } from "./digitalPay.js";

export function registerBuyerSteps(router: Router) {
  registerDigitalPay(router);
  router.post("/:id/confirm-receipt", requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
    if (order.buyerId !== req.user!.sub) return res.status(403).json({ error: { code: "FORBIDDEN", message: "No eres el comprador" } });
    if (order.itemType === "bazar") return res.status(409).json({ error: { code: "PHYSICAL_PAYMENT", message: "El equipo registra la entrega física" } });
    res.status(409).json({ error: { code: "TEAM_SETTLEMENT", message: "El equipo registra la entrega y la liquidación; la descarga no necesita confirmación" } });
  }));
}
