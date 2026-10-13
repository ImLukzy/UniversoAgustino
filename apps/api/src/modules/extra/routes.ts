import { createPaymentReport } from "../payouts/claims.js";
import { Router } from "express";
import { CreateReportSchema, SimulateSchema, simulateEarnings } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { actionReport } from "./reportActions.js";
import { listReports } from "./reportQueries.js";

export const monetizationRouter = Router();

monetizationRouter.post(
  "/simulate",
  asyncHandler(async (req, res) => {
    const input = SimulateSchema.parse(req.body);
    res.json({ data: simulateEarnings(input) });
  })
);

export const reportsRouter = Router();

reportsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = CreateReportSchema.parse(req.body);
    const report = await createPaymentReport(input, req.user!.sub);
    res.status(201).json({ data: report });
  })
);

reportsRouter.get("/", requireAuth, requireRole("moderator", "admin"), listReports);

// Mis reportes enviados (para el centro de soporte del vendedor/comprador).
reportsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = await prisma.report.findMany({ where: { reporterId: req.user!.sub }, orderBy: { createdAt: "desc" }, take: 50 });
    res.json({ data: rows });
  })
);

reportsRouter.post(
  "/:id/action",
  requireAuth,
  requireRole("moderator", "admin"),
  actionReport
);
