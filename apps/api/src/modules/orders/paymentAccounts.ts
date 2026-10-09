import type { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
export function registerPaymentAccounts(router: Router) {
  router.get("/:id/payment-accounts", requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, buyerId: req.user!.sub,
      status: { in: ["PENDING", "ACCEPTED", "PAID"] }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
    res.setHeader("Cache-Control", "private, no-store");
    if (!order) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Pedido activo no encontrado" } });
    const data = await prisma.paymentAccount.findMany({ where: { active: true, user: { role: { in: ["moderator", "admin"] } } },
      select: { id: true, userId: true, method: true, holder: true, number: true, photoUrl: true, qrUrl: true }, orderBy: { createdAt: "asc" } });
    res.json({ data });
  }));
}
