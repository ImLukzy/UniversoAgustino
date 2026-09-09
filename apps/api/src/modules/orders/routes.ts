import { Router } from "express";
import { CreateOrderSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../env.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";

export const ordersRouter = Router();

// Crea orden en ESCROW (custodia academica): el dinero queda retenido hasta confirmacion.
ordersRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = CreateOrderSchema.parse(req.body);
    let amountCents = 0;
    if (input.itemType === "document") {
      const d = await prisma.document.findUniqueOrThrow({ where: { id: input.itemId } });
      amountCents = d.priceCents;
    } else {
      const b = await prisma.bazarItem.findUniqueOrThrow({ where: { id: input.itemId } });
      amountCents = b.priceCents;
    }
    const feeCents = Math.round(amountCents * (env.FEE_PCT / 100));
    const order = await prisma.order.create({
      data: {
        buyerId: req.user!.sub,
        itemType: input.itemType,
        itemId: input.itemId,
        amountCents,
        feeCents,
        netCents: amountCents - feeCents,
        status: "ESCROW",
        escrow: { create: {} },
      },
      include: { escrow: true },
    });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "order.escrow", entity: "order", entityId: order.id } });
    res.status(201).json({ data: order });
  })
);

ordersRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = await prisma.order.findMany({ where: { buyerId: req.user!.sub }, orderBy: { createdAt: "desc" }, include: { escrow: true } });
    res.json({ data: rows });
  })
);

ordersRouter.post(
  "/:id/confirm-receipt",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "RELEASED", escrow: { update: { releasedAt: new Date() } } },
      include: { escrow: true },
    });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "order.release", entity: "order", entityId: order.id } });
    res.json({ data: order });
  })
);

ordersRouter.post(
  "/:id/refund",
  requireAuth,
  requireRole("moderator", "admin"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: "REFUNDED" } });
    res.json({ data: order });
  })
);
