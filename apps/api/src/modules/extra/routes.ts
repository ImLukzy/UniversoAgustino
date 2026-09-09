import { Router } from "express";
import { CreateReportSchema, SimulateSchema, simulateEarnings } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";

export const monetizationRouter = Router();

monetizationRouter.post(
  "/simulate",
  asyncHandler(async (req, res) => {
    const input = SimulateSchema.parse(req.body);
    res.json({ data: simulateEarnings(input) });
  })
);

monetizationRouter.get(
  "/payouts/mine",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = await prisma.payout.findMany({ where: { creatorId: req.user!.sub }, orderBy: { createdAt: "desc" } });
    res.json({ data: rows });
  })
);

export const reportsRouter = Router();

reportsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = CreateReportSchema.parse(req.body);
    const reporterId = (req as any).user?.sub ?? null;
    const report = await prisma.report.create({ data: { ...input, reporterId } });
    res.status(201).json({ data: report });
  })
);

reportsRouter.get("/", requireAuth, requireRole("moderator", "admin"), asyncHandler(async (_req, res) => {
  const rows = await prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  res.json({ data: rows });
}));

reportsRouter.post(
  "/:id/action",
  requireAuth,
  requireRole("moderator", "admin"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const action = String(req.body?.decision ?? "ACTIONED");
    const report = await prisma.report.update({ where: { id: req.params.id }, data: { status: action } });
    if (report.targetType === "document" && action === "ACTIONED") {
      await prisma.document.update({ where: { id: report.targetId }, data: { status: "TAKEDOWN" } });
    }
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "report.action", entity: "report", entityId: report.id, meta: action } });
    res.json({ data: report });
  })
);
