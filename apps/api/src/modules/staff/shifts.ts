import { protectShift } from "../cases/scheduleProtection.js";
import { Router } from "express";
import { ShiftSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { guardShift, scheduleChange } from "./scheduleGuard.js";

export const shiftsRouter = Router();
const include = { sede: { select: { name: true } }, user: { select: { email: true, profile: { select: { fullName: true } } } } } as const;
shiftsRouter.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const where = req.user!.role === "admin" ? {} : { userId: req.user!.sub };
  const data = await prisma.staffShift.findMany({ where, include, orderBy: [{ weekday: "asc" }, { startsMin: "asc" }] });
  res.json({ data });
}));
shiftsRouter.post("/", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const input = ShiftSchema.parse(req.body);
  const data = await scheduleChange(req.user!.sub, "shift.create", "staffShift", undefined, async (tx) => {
    await guardShift(tx, input); return tx.staffShift.create({ data: input, include });
  });
  res.status(201).json({ data });
}));
shiftsRouter.patch("/:id", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const input = ShiftSchema.parse(req.body);
  const data = await scheduleChange(req.user!.sub, "shift.update", "staffShift", req.params.id, async (tx) => {
    await tx.staffShift.findUniqueOrThrow({ where: { id: req.params.id } });
    await protectShift(tx, req.params.id, input);
    await guardShift(tx, input, req.params.id); return tx.staffShift.update({ where: { id: req.params.id }, data: input, include });
  });
  res.json({ data });
}));
shiftsRouter.delete("/:id", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const data = await scheduleChange(req.user!.sub, "shift.delete", "staffShift", req.params.id, async (tx) => { await protectShift(tx, req.params.id); return tx.staffShift.delete({ where: { id: req.params.id } }); });
  res.json({ data });
}));
