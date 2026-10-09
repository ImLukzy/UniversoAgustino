import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { CreateBazarItemSchema, ListBazarQuerySchema, UpdateBazarItemSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { optionalAuth, requireAuth, type AuthedRequest } from "../../middleware/auth.js";

import { canViewReview, initialReview, resubmitReview } from "../../lib/moderation.js";
import { assertNotSuspended } from "../sanctions/guard.js";

export const bazarRouter = Router();

bazarRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = ListBazarQuerySchema.parse(req.query);
    const where: Prisma.BazarItemWhereInput = { status: "AVAILABLE", reviewStatus: "APPROVED" };
    if (q.kind) where.kind = q.kind;
    if (q.tx) where.tx = q.tx;
    if (q.q) where.OR = [{ title: { contains: q.q, mode: "insensitive" } }, { kind: { contains: q.q, mode: "insensitive" } }];
    const [total, rows] = await Promise.all([
      prisma.bazarItem.count({ where }),
      prisma.bazarItem.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    ]);
    res.json({ data: rows, page: q.page, pageSize: q.pageSize, total });
  })
);

bazarRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = CreateBazarItemSchema.parse(req.body);
    await assertNotSuspended(req.user!.sub);
    const item = await prisma.bazarItem.create({ data: { ...input, sellerId: req.user!.sub, reviewStatus: await initialReview(req.user!.sub) } });
    res.status(201).json({ data: item });
  })
);

bazarRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = await prisma.bazarItem.findMany({ where: { sellerId: req.user!.sub }, orderBy: { createdAt: "desc" } });
    res.json({ data: rows });
  })
);

bazarRouter.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    // Hardening: seller con select explícito (nunca passwordHash).
    const item = await prisma.bazarItem.findUnique({ where: { id: req.params.id }, include: { seller: { select: { id: true, profile: true } } } });
    if (!item || !canViewReview(item, item.sellerId, req.user)) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ítem no existe" } });
    res.json({ data: item });
  })
);

function canEditBazar(role: string | undefined, sellerId: string, me: string) {
  return sellerId === me || role === "admin" || role === "moderator";
}

bazarRouter.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const item = await prisma.bazarItem.findUniqueOrThrow({ where: { id: req.params.id } });
    if (!canEditBazar(req.user!.role, item.sellerId, req.user!.sub)) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el dueño edita su publicación" } });
    }
    const input = UpdateBazarItemSchema.parse(req.body);
    const upd = await prisma.bazarItem.update({ where: { id: item.id, reviewStatus: item.reviewStatus }, data: { ...input, ...resubmitReview(item.reviewStatus) } });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "bazar.update", entity: "bazar", entityId: item.id } });
    res.json({ data: upd });
  })
);

bazarRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const item = await prisma.bazarItem.findUniqueOrThrow({ where: { id: req.params.id } });
    if (!canEditBazar(req.user!.role, item.sellerId, req.user!.sub)) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el dueño elimina su publicación" } });
    }
    const active = await prisma.order.findMany({
      where: { itemId: item.id, status: { in: ["PENDING", "ACCEPTED", "PAID", "ESCROW"] } },
      select: { status: true, expiresAt: true },
    });
    if (active.length > 0) {
      const statuses = [...new Set(active.map((o) => o.status))];
      const onlyPending = active.every((o) => o.status === "PENDING");
      return res.status(409).json({
        error: {
          code: "CONFLICT_ACTIVE_ORDERS",
          message: onlyPending
            ? "Hay una reserva activa. Podrás eliminarla cuando expire o si la cancelas."
            : "Tiene pedidos en curso, no se puede eliminar",
          details: { activeOrders: active.length, statuses, canForce: onlyPending },
        },
      });
    }
    await prisma.bazarItem.delete({ where: { id: item.id } });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "bazar.delete", entity: "bazar", entityId: item.id } });
    res.json({ data: { id: item.id } });
  })
);

bazarRouter.post(
  "/:id/reserve",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const current = await prisma.bazarItem.findUnique({ where: { id: req.params.id }, select: { reviewStatus: true } });
    if (!current || current.reviewStatus !== "APPROVED") return res.status(409).json({ error: { code: "NOT_AVAILABLE", message: "Esta publicación aún no está aprobada" } });
    const item = await prisma.bazarItem.update({ where: { id: req.params.id, reviewStatus: "APPROVED" }, data: { status: "RESERVED" } });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "bazar.reserve", entity: "bazar", entityId: item.id } });
    res.json({ data: item });
  })
);
