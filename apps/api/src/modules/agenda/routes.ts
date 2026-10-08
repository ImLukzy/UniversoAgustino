import { Router } from "express";
import { AgendaQuerySchema } from "@hub/shared";
import { asyncHandler } from "../../middleware/errors.js";
import { weekAgenda } from "./week.js";
import { staffMetrics } from "./metrics.js";

// Se montan bajo staffRouter (ya exige rol moderator/admin). Solo lectura.
export const agendaRouter = Router();
agendaRouter.get("/", asyncHandler(async (req, res) => { res.json({ data: await weekAgenda(AgendaQuerySchema.parse(req.query)) }); }));
export const metricsRouter = Router();
metricsRouter.get("/", asyncHandler(async (_req, res) => { res.json({ data: await staffMetrics() }); }));
