import type { Router } from "express";
import { UpdateDocumentSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";

// Guardados, edición/borrado del dueño y takedown de moderación.
export function registerManage(router: Router) {
  router.post(
    "/:id/save",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const doc = await prisma.document.findUnique({ where: { id: req.params.id }, select: { id: true } });
      if (!doc) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Documento no existe" } });
      const key = { userId: req.user!.sub, documentId: doc.id };
      await prisma.savedDocument.upsert({ where: { userId_documentId: key }, create: key, update: {} });
      res.json({ data: { saved: true } });
    })
  );

  router.delete(
    "/:id/save",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      await prisma.savedDocument.deleteMany({ where: { userId: req.user!.sub, documentId: req.params.id } });
      res.json({ data: { saved: false } });
    })
  );

  function canEditDoc(role: string | undefined, authorId: string, me: string) {
    return authorId === me || role === "admin" || role === "moderator";
  }

  router.patch(
    "/:id",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const doc = await prisma.document.findUniqueOrThrow({ where: { id: req.params.id } });
      if (!canEditDoc(req.user!.role, doc.authorId, req.user!.sub)) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el dueño edita su publicación" } });
      }
      const input = UpdateDocumentSchema.parse(req.body);
      const upd = await prisma.document.update({ where: { id: doc.id }, data: input });
      await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "document.update", entity: "document", entityId: doc.id } });
      res.json({ data: upd });
    })
  );

  router.delete(
    "/:id",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const doc = await prisma.document.findUniqueOrThrow({ where: { id: req.params.id } });
      if (!canEditDoc(req.user!.role, doc.authorId, req.user!.sub)) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el dueño elimina su publicación" } });
      }
      const active = await prisma.order.findMany({
        where: { itemId: doc.id, status: { in: ["PENDING", "ACCEPTED", "PAID", "ESCROW"] } },
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
      await prisma.document.delete({ where: { id: doc.id } });
      await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "document.delete", entity: "document", entityId: doc.id } });
      res.json({ data: { id: doc.id } });
    })
  );

  router.post(
    "/:id/takedown",
    requireAuth,
    requireRole("moderator", "admin"),
    asyncHandler(async (req: AuthedRequest, res) => {
      const doc = await prisma.document.update({ where: { id: req.params.id }, data: { status: "TAKEDOWN" } });
      await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "document.takedown", entity: "document", entityId: doc.id } });
      res.json({ data: doc });
    })
  );
}
