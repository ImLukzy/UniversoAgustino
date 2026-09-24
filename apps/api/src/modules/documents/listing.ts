import type { Router } from "express";
import type { Prisma } from "@prisma/client";
import { CreateDocumentSchema, DocumentTypeSchema, ListQuerySchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { optionalAuth, requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { fileKind, hasFullAccess } from "./access.js";

// Catálogo público, alta, mis documentos y detalle (con acceso resuelto en servidor).
export function registerListing(router: Router) {
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const q = ListQuerySchema.extend({
        course: ListQuerySchema.shape.course.optional(),
        type: DocumentTypeSchema.optional(),
      }).parse(req.query);
      const where: Prisma.DocumentWhereInput = { status: "PUBLISHED", university: "UNSA" };
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
          // Hardening: author con select explícito (nunca passwordHash ni email).
          include: { author: { select: { id: true, profile: true } } },
        }),
      ]);
      // Spec 16: el catálogo nunca expone la ruta del archivo de pago; la
      // portada sale de GET /documents/:id/preview según fileType.
      const data = rows.map(({ fileUrl, ...r }) => ({ ...r, ...(r.priceCents === 0 ? { fileUrl } : {}), fileType: fileKind(fileUrl) }));
      res.json({ data, page: q.page, pageSize: q.pageSize, total });
    })
  );

  router.post(
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

  router.get(
    "/mine",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const rows = await prisma.document.findMany({ where: { authorId: req.user!.sub }, orderBy: { createdAt: "desc" } });
      res.json({ data: rows });
    })
  );

  router.get(
    "/:id",
    optionalAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      // Hardening: author con select explícito (nunca passwordHash).
      const doc = await prisma.document.findUnique({ where: { id: req.params.id }, include: { author: { select: { id: true, profile: true } } } });
      if (!doc) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Documento no existe" } });
      // Acceso y guardado se resuelven en el servidor: el cliente no decide.
      const me = req.user?.sub;
      const [fullAccess, saved] = await Promise.all([
        hasFullAccess(doc, req.user),
        me ? prisma.savedDocument.count({ where: { userId: me, documentId: doc.id } }) : 0,
      ]);
      // Spec 15 (T7): sin acceso completo no se expone la ruta del archivo.
      const { fileUrl, ...rest } = doc;
      const data = { ...rest, ...(fullAccess ? { fileUrl } : {}), fileType: fileKind(fileUrl), saved: saved > 0, fullAccess };
      res.json({ data });
    })
  );
}
