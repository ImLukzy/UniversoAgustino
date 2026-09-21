import { Router } from "express";
import { CreateBazarItemSchema, ListQuerySchema, UpdateBazarItemSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";

export const bazarRouter = Router();

bazarRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = ListQuerySchema.parse(req.query);
    const where: any = { status: "AVAILABLE" };
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
    const item = await prisma.bazarItem.create({ data: { ...input, sellerId: req.user!.sub } });
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
  asyncHandler(async (req, res) => {
    const item = await prisma.bazarItem.findUnique({ where: { id: req.params.id }, include: { seller: { include: { profile: true } } } });
    if (!item) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ítem no existe" } });
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
    const upd = await prisma.bazarItem.update({ where: { id: item.id }, data: input });
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
    const active = await prisma.order.count({ where: { itemId: item.id, status: { in: ["PENDING", "PAID", "ESCROW"] } } });
    if (active > 0) {
      return res.status(409).json({ error: { code: "HAS_ORDERS", message: "Tiene pedidos en curso, no se puede eliminar" } });
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
    const item = await prisma.bazarItem.update({ where: { id: req.params.id }, data: { status: "RESERVED" } });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "bazar.reserve", entity: "bazar", entityId: item.id } });
    res.json({ data: item });
  })
);
