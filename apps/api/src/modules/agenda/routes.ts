import { accountRole } from "../staff/accountPermissions.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { Router } from "express";
import { AgendaQuerySchema } from "@hub/shared";
import { asyncHandler } from "../../middleware/errors.js";
import { weekAgenda } from "./week.js";
import { staffMetrics } from "./metrics.js";

// Se montan bajo staffRouter (ya exige rol moderator/admin). Solo lectura.
export const agendaRouter = Router();
agendaRouter.get("/", asyncHandler(async (req, res) => { res.json({ data: await weekAgenda(AgendaQuerySchema.parse(req.query)) }); }));
export const metricsRouter = Router();
metricsRouter.get("/", asyncHandler(async (req: AuthedRequest, res) => { await accountRole(prisma, req.user!.sub); res.setHeader("Cache-Control", "private, no-store"); res.json({ data: await staffMetrics() }); }));
