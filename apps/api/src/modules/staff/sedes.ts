import { Router } from "express";
import { SedeSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { scheduleChange, scheduleFail } from "./scheduleGuard.js";

export const staffSedesRouter = Router();
staffSedesRouter.get("/", asyncHandler(async (_req, res) => {
  res.json({ data: await prisma.sede.findMany({ orderBy: { name: "asc" } }) });
}));
staffSedesRouter.post("/", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const input = SedeSchema.parse(req.body);
  const data = await scheduleChange(req.user!.sub, "sede.create", "sede", undefined, (tx) => tx.sede.create({ data: input }));
  res.status(201).json({ data });
}));
staffSedesRouter.patch("/:id", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const input = SedeSchema.partial().parse(req.body);
  const data = await scheduleChange(req.user!.sub, "sede.update", "sede", req.params.id, async (tx) => {
    await tx.sede.findUniqueOrThrow({ where: { id: req.params.id } });
    if (input.active === false && await tx.staffShift.count({ where: { sedeId: req.params.id } })) scheduleFail("HAS_SHIFTS", "Quita los turnos antes de desactivar la sede");
    return tx.sede.update({ where: { id: req.params.id }, data: input });
  });
  res.json({ data });
}));
staffSedesRouter.delete("/:id", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const data = await scheduleChange(req.user!.sub, "sede.deactivate", "sede", req.params.id, async (tx) => {
    await tx.sede.findUniqueOrThrow({ where: { id: req.params.id } });
    if (await tx.staffShift.count({ where: { sedeId: req.params.id } })) scheduleFail("HAS_SHIFTS", "Quita los turnos antes de desactivar la sede");
    return tx.sede.update({ where: { id: req.params.id }, data: { active: false } });
  });
  res.json({ data });
}));
