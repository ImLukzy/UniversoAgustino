import { Router } from "express";
import { CreateBazarItemSchema, ListQuerySchema } from "@hub/shared";
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

bazarRouter.post(
  "/:id/reserve",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const item = await prisma.bazarItem.update({ where: { id: req.params.id }, data: { status: "RESERVED" } });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "bazar.reserve", entity: "bazar", entityId: item.id } });
    res.json({ data: item });
  })
);
