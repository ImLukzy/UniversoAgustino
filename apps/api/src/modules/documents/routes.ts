import { Router } from "express";
import { CreateDocumentSchema, DocumentTypeSchema, ListQuerySchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";

export const documentsRouter = Router();

documentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = ListQuerySchema.extend({
      course: ListQuerySchema.shape.course.optional(),
      type: DocumentTypeSchema.optional(),
    }).parse(req.query);
    const where: any = { status: "PUBLISHED", university: "UNSA" };
    if (q.university) where.university = q.university;
    if (q.career) where.career = q.career;
    if (q.type) where.type = q.type;
    if (q.course) where.course = { contains: q.course, mode: "insensitive" };
    if (q.q) where.OR = [{ title: { contains: q.q, mode: "insensitive" } }, { course: { contains: q.q, mode: "insensitive" } }];
    const [total, rows] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { author: { include: { profile: true } } },
      }),
    ]);
    res.json({ data: rows, page: q.page, pageSize: q.pageSize, total });
  })
);

documentsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = CreateDocumentSchema.parse(req.body);
    // Sin carrera explícita se hereda la del perfil del autor.
    if (!req.body?.career) {
      const me = await prisma.profile.findUnique({ where: { userId: req.user!.sub } });
      if (me?.career) (input as { career: string }).career = me.career;
    }
    const doc = await prisma.document.create({ data: { ...input, university: "UNSA", authorId: req.user!.sub } });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "document.create", entity: "document", entityId: doc.id } });
    res.status(201).json({ data: doc });
  })
);

documentsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id }, include: { author: { include: { profile: true } } } });
    if (!doc) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Documento no existe" } });
    res.json({ data: doc });
  })
);

documentsRouter.post(
  "/:id/takedown",
  requireAuth,
  requireRole("moderator", "admin"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const doc = await prisma.document.update({ where: { id: req.params.id }, data: { status: "TAKEDOWN" } });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "document.takedown", entity: "document", entityId: doc.id } });
    res.json({ data: doc });
  })
);
