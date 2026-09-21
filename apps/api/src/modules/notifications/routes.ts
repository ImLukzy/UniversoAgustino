import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";

export const notificationsRouter = Router();

// GET /notifications?unread=1&page=&pageSize= (auth, máx 50 por página)
notificationsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const unreadOnly = String(req.query.unread ?? "") === "1";
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 20) || 20));
    const where = { userId: req.user!.sub, ...(unreadOnly ? { readAt: null } : {}) };
    const [total, rows] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    res.json({ data: rows, page, pageSize, total });
  })
);

// POST /notifications/read-all — marca todo como leído
notificationsRouter.post(
  "/read-all",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const r = await prisma.notification.updateMany({
      where: { userId: req.user!.sub, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ data: { read: r.count } });
  })
);

// POST /notifications/:id/read — marca una como leída (solo propia)
notificationsRouter.post(
  "/:id/read",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const r = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.sub, readAt: null },
      data: { readAt: new Date() },
    });
    if (r.count === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notificación no existe" } });
    }
    res.json({ data: { ok: true } });
  })
);
